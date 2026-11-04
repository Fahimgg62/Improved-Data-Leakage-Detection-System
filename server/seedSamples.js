const fs = require('fs');
const path = require('path');
const { createSyntheticBmp } = require('./stego/imageStego');

const dir = path.join(__dirname, '..', 'sample_data');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1. Valid Text (68 words)
const validText = 'CONFIDENTIAL DISCLOSURE STATEMENT: PROJECT LEAKTRACE. ' +
  'The recipient of this strategic documentation is granted access strictly for authorized organizational evaluation. ' +
  'Any dissemination, extraction, or distribution of this file is monitored by zero-width steganographic tracking footprints. ' +
  'Each allocated copy carries an RFC 4122 compliant UUID v4 tracking token embedded within the lexical structure. ' +
  'This carrier document contains well over sixty words to reliably satisfy forensic embedding capacity requirements under FR-3.';
fs.writeFileSync(path.join(dir, 'confidential_report.txt'), validText, 'utf8');

// 2. Short Text (49 words - boundary test for BVA-04)
const shortWords = Array(49).fill('confidential').join(' ');
fs.writeFileSync(path.join(dir, 'short_note_49words.txt'), shortWords, 'utf8');

// 3. Valid BMP (256x256)
const bmp256 = createSyntheticBmp(256, 256, { r: 18, g: 26, b: 43 });
fs.writeFileSync(path.join(dir, 'blueprint_256x256.bmp'), bmp256);

// 4. Invalid BMP (255x255 - boundary test for BVA-03)
const bmp255 = createSyntheticBmp(255, 255, { r: 18, g: 26, b: 43 });
fs.writeFileSync(path.join(dir, 'small_icon_255x255.bmp'), bmp255);

// 5. Invalid format (PDF for EP-01)
fs.writeFileSync(path.join(dir, 'invalid_contract.pdf'), '%PDF-1.4 dummy pdf content for testing EP-01', 'utf8');

// 6. Invalid leaked archive (ZIP for EP-03)
fs.writeFileSync(path.join(dir, 'leaked_archive.zip'), 'PK\x03\x04 dummy zip content for testing EP-03', 'utf8');

console.log('Sample carrier test files generated successfully in sample_data/');

