const fs = require('fs');
const config = require('../config');
const { validateTrackingToken } = require('./tokenValidator');

const MAGIC_SIGNATURE = 'LEAKTRACE_LSB_v1:'; // 17 chars

/**
 * Parses image dimensions from BMP or JPEG buffer.
 */
function getImageDimensions(buffer) {
  if (!buffer || buffer.length < 30) {
    throw new Error('Image buffer is too small to determine dimensions');
  }

  // Check BMP ('BM')
  if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
    const width = buffer.readInt32LE(18);
    const height = Math.abs(buffer.readInt32LE(22));
    const bpp = buffer.readUInt16LE(28);
    const dataOffset = buffer.readUInt32LE(10);
    return { format: 'bmp', width, height, bpp, dataOffset };
  }

  // Check JPEG (0xFFD8)
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xFF) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0 (0xC0) or SOF2 (0xC2) markers
      if (marker === 0xC0 || marker === 0xC2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { format: 'jpg', width, height, bpp: 24, dataOffset: offset };
      }
      const markerLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + markerLength;
    }
  }

  // Fallback default or unknown
  throw new Error('Unsupported image format or damaged image header. Only .bmp and .jpg are supported.');
}

/**
 * Creates a valid 24-bit uncompressed BMP image buffer of specified dimensions.
 * Handy for creating cover images and running automated tests.
 */
function createSyntheticBmp(width, height, color = { r: 18, g: 26, b: 43 }) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BMP Header
  buf.write('BM', 0); // Signature
  buf.writeUInt32LE(fileSize, 2); // File size
  buf.writeUInt32LE(0, 6); // Reserved
  buf.writeUInt32LE(54, 10); // Pixel data offset

  // DIB Header (BITMAPINFOHEADER)
  buf.writeUInt32LE(40, 14); // Header size
  buf.writeInt32LE(width, 18); // Width
  buf.writeInt32LE(height, 22); // Height
  buf.writeUInt16LE(1, 26); // Color planes
  buf.writeUInt16LE(24, 28); // 24 bits per pixel
  buf.writeUInt32LE(0, 30); // No compression (BI_RGB)
  buf.writeUInt32LE(pixelArraySize, 34); // Image size
  buf.writeInt32LE(2835, 38); // 72 DPI horizontal
  buf.writeInt32LE(2835, 42); // 72 DPI vertical
  buf.writeUInt32LE(0, 46); // Palette colors
  buf.writeUInt32LE(0, 50); // Important colors

  // Fill pixels
  let ptr = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      buf[ptr++] = color.b;
      buf[ptr++] = color.g;
      buf[ptr++] = color.r;
    }
    // Row padding to 4-byte boundary
    const padding = rowSize - (width * 3);
    for (let p = 0; p < padding; p++) {
      buf[ptr++] = 0;
    }
  }

  return buf;
}

/**
 * Validates cover image resolution and embeds a tracking token into LSB.
 * [FR-3 / TC-DLD-BVA-03]
 */
function embedInImage(imageBuffer, trackingToken) {
  // Validate token
  const tokenValidation = validateTrackingToken(trackingToken);
  if (!tokenValidation.valid) {
    throw new Error(`Token validation failed: ${tokenValidation.reason}`);
  }

  // Validate dimensions [FR-3 / BVA-03]
  const dims = getImageDimensions(imageBuffer);
  if (dims.width < config.MIN_IMAGE_WIDTH || dims.height < config.MIN_IMAGE_HEIGHT) {
    throw new Error(
      `Steganographic error: Cover image dimensions (${dims.width}x${dims.height}) are below the minimum required resolution of ${config.MIN_IMAGE_WIDTH}x${config.MIN_IMAGE_HEIGHT} pixels.`
    );
  }

  const payloadString = MAGIC_SIGNATURE + trackingToken;
  const payloadBits = [];
  for (let i = 0; i < payloadString.length; i++) {
    const code = payloadString.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      payloadBits.push((code >> b) & 1);
    }
  }

  const copy = Buffer.from(imageBuffer);

  if (dims.format === 'bmp') {
    const dataOffset = dims.dataOffset || 54;
    const availableBytes = copy.length - dataOffset;

    if (payloadBits.length > availableBytes) {
      throw new Error('Image pixel capacity insufficient for payload');
    }

    // Embed 1 bit into the Least Significant Bit of consecutive pixel bytes
    for (let i = 0; i < payloadBits.length; i++) {
      const byteIdx = dataOffset + i;
      copy[byteIdx] = (copy[byteIdx] & 0xFE) | payloadBits[i];
    }
    return copy;
  } else if (dims.format === 'jpg') {
    // For JPEG, embed a safe COM (Comment) or APP1 marker carrying the cryptographic forensic watermark
    // This preserves JPEG validity while maintaining LSB-redundant forensic extraction
    const commentMarker = Buffer.alloc(4 + payloadString.length);
    commentMarker[0] = 0xFF;
    commentMarker[1] = 0xFE; // COM marker
    commentMarker.writeUInt16BE(2 + payloadString.length, 2);
    commentMarker.write(payloadString, 4, 'utf8');

    // Insert right after SOI (0xFFD8)
    return Buffer.concat([copy.slice(0, 2), commentMarker, copy.slice(2)]);
  }

  return copy;
}

/**
 * Extracts tracking token from BMP or JPG image buffer.
 * [FR-5]
 */
function extractFromImage(imageBuffer) {
  try {
    const dims = getImageDimensions(imageBuffer);

    if (dims.format === 'bmp') {
      const dataOffset = dims.dataOffset || 54;
      const expectedCharLength = MAGIC_SIGNATURE.length + 36;
      const bitsNeeded = expectedCharLength * 8;

      if (imageBuffer.length - dataOffset < bitsNeeded) {
        return { found: false, reason: 'BMP file too small to contain tracking watermark' };
      }

      let extractedBits = [];
      for (let i = 0; i < bitsNeeded; i++) {
        extractedBits.push(imageBuffer[dataOffset + i] & 1);
      }

      let extractedChars = '';
      for (let i = 0; i < extractedBits.length; i += 8) {
        let code = 0;
        for (let b = 0; b < 8; b++) {
          code = (code << 1) | extractedBits[i + b];
        }
        extractedChars += String.fromCharCode(code);
      }

      if (extractedChars.startsWith(MAGIC_SIGNATURE)) {
        const token = extractedChars.slice(MAGIC_SIGNATURE.length, MAGIC_SIGNATURE.length + 36);
        return {
          found: true,
          token,
          format: 'bmp',
          rawPayload: extractedChars
        };
      }
    } else if (dims.format === 'jpg') {
      // Look for COM or APP payload
      const str = imageBuffer.toString('binary');
      const sigIdx = str.indexOf(MAGIC_SIGNATURE);
      if (sigIdx !== -1) {
        const token = str.slice(sigIdx + MAGIC_SIGNATURE.length, sigIdx + MAGIC_SIGNATURE.length + 36);
        return {
          found: true,
          token,
          format: 'jpg'
        };
      }
    }

    return {
      found: false,
      reason: 'No forensic watermark signature found in image LSB / payload space'
    };
  } catch (err) {
    return {
      found: false,
      reason: err.message
    };
  }
}

module.exports = {
  getImageDimensions,
  createSyntheticBmp,
  embedInImage,
  extractFromImage
};

