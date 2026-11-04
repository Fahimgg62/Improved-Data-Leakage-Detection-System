import React, { useState, useRef } from 'react';
import { apiRequest } from '../api';

export default function SecureUpload({ onUploadSuccess, onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFileLocally = (file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.txt', '.jpg', '.jpeg', '.bmp'];

    if (!allowed.includes(ext)) {
      setAlertInfo({
        type: 'error',
        message: `Invalid file extension '${ext}'. Only .txt, .jpg, and .bmp files are supported for steganographic tracking. [FR-1 / EP-01]`
      });
      return false;
    }

    if (file.size === 0) {
      setAlertInfo({
        type: 'error',
        message: 'Upload failed: Empty file (0 Bytes) is not permitted. [FR-1 / BVA-01]'
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setAlertInfo({
        type: 'error',
        message: 'Upload failed: File size exceeds the maximum limit of 50 MB. [FR-1 / BVA-01]'
      });
      return false;
    }

    setAlertInfo(null);
    return true;
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setSelectedFile(file);
    validateFileLocally(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setAlertInfo({ type: 'error', message: 'Select or drop a file before submitting.' });
      return;
    }

    if (!validateFileLocally(selectedFile)) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const data = await apiRequest('/files/upload', {
        method: 'POST',
        body: formData
      });

      setAlertInfo({
        type: 'success',
        message: `Document secured successfully! Checksum: ${data.file.hash.slice(0, 20)}...`
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setAlertInfo({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const stageSampleFile = (type) => {
    let file;
    if (type === 'txt-valid') {
      const text = `This is a highly confidential executive communication regarding Project LeakTrace. ` +
        `The operational requirements strictly dictate that any distribution of this data must be monitored using ` +
        `imperceptible steganographic watermarking. Every recipient is assigned an immutable tracking token ` +
        `derived from an RFC 4122 compliant UUID v4 specification. This document contains well over sixty words to ` +
        `fully satisfy the minimum fifty-word payload capacity threshold mandated by forensic requirement FR-3. ` +
        `Please ensure all security guidelines are maintained.`;
      file = new File([text], 'confidential_brief.txt', { type: 'text/plain' });
    } else if (type === 'txt-short') {
      const text = Array(49).fill('confidential').join(' ');
      file = new File([text], 'short_note_49words.txt', { type: 'text/plain' });
    } else if (type === 'bmp-valid') {
      // Create 256x256 BMP buffer
      const width = 256;
      const height = 256;
      const rowSize = Math.floor((24 * width + 31) / 32) * 4;
      const pixelArraySize = rowSize * height;
      const fileSize = 54 + pixelArraySize;
      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);
      view.setUint8(0, 0x42); view.setUint8(1, 0x4D);
      view.setUint32(2, fileSize, true);
      view.setUint32(10, 54, true);
      view.setUint32(14, 40, true);
      view.setInt32(18, width, true);
      view.setInt32(22, height, true);
      view.setUint16(26, 1, true);
      view.setUint16(28, 24, true);
      view.setUint32(34, pixelArraySize, true);
      file = new File([buffer], 'blueprint_256x256.bmp', { type: 'image/bmp' });
    }

    if (file) {
      handleFileChange(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-mono text-outline">
          <span className="text-primary cursor-pointer" onClick={() => onNavigate('vault')}>
            VAULT STORAGE
          </span>
          <span>/</span>
          <span className="text-white">SECURE INGESTION</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload Confidential Document</h1>
        <p className="text-xs text-on-surface-variant">
          Validated format ingestion (.txt, .jpg, .bmp) with cryptographic SHA-256 integrity sealing
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) handleFileChange(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-10 text-center flex flex-col items-center justify-center cursor-pointer transition-all bg-surface-container/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.jpg,.jpeg,.bmp"
              onChange={(e) => {
                if (e.target.files.length > 0) handleFileChange(e.target.files[0]);
              }}
            />
            <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary mb-3 border border-outline-variant">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <div className="text-sm font-semibold text-white mb-1">
              Drag and drop confidential file or <span className="text-primary underline">browse</span>
            </div>
            <div className="text-xs text-outline font-mono">
              Supported: <span className="text-secondary font-bold">.txt, .jpg, .bmp</span> (Max 50 MB)
            </div>

            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/40 text-primary font-mono text-xs">
                <span className="material-symbols-outlined text-sm">attachment</span>
                <span>{selectedFile.name}</span>
                <span className="text-outline">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {alertInfo && (
            <div
              className={`p-4 rounded-lg text-xs font-mono flex items-center gap-3 border ${
                alertInfo.type === 'error'
                  ? 'bg-error-container text-error border-error/40'
                  : 'bg-secondary/10 text-secondary border-secondary/40'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {alertInfo.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{alertInfo.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setAlertInfo(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>{loading ? 'Sealing Document...' : 'Ingest & Seal Document'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Test Document Generators */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-5">
        <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider mb-2">
          Generate Sample Carrier Files for Testing:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            onClick={() => stageSampleFile('txt-valid')}
            className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-left transition-colors"
          >
            <div className="font-medium text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">description</span>
              <span>Valid Text (65 words)</span>
            </div>
            <div className="text-[10px] text-outline font-mono mt-1">&ge; 50 words requirement [FR-3]</div>
          </button>

          <button
            onClick={() => stageSampleFile('bmp-valid')}
            className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-left transition-colors"
          >
            <div className="font-medium text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">image</span>
              <span>Valid BMP (256&times;256)</span>
            </div>
            <div className="text-[10px] text-outline font-mono mt-1">&ge; 256px resolution [FR-3]</div>
          </button>

          <button
            onClick={() => stageSampleFile('txt-short')}
            className="p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-left transition-colors"
          >
            <div className="font-medium text-warning flex items-center gap-1.5">
              <span className="material-symbols-outlined text-warning text-sm">warning</span>
              <span>Short Text (49 words)</span>
            </div>
            <div className="text-[10px] text-outline font-mono mt-1">Triggers capacity rejection [BVA-04]</div>
          </button>
        </div>
      </div>
    </div>
  );
}
