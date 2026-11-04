import React, { useState, useRef } from 'react';
import { apiRequest } from '../api';

export default function ForensicLab() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [berNoise, setBerNoise] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an intercepted or recovered artifact to analyze.');
      return;
    }

    setLoading(true);
    setReport(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (parseFloat(berNoise) > 0) {
      formData.append('simulatedBER', (parseFloat(berNoise) / 100).toFixed(4));
    }

    try {
      const data = await apiRequest('/investigate/analyze', {
        method: 'POST',
        body: formData
      });
      setReport(data);
    } catch (err) {
      setReport({
        success: false,
        status: 'REJECTED',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const isPositive = report?.status === 'POSITIVE_MATCH';
  const confidence = report?.matchConfidence || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-mono text-outline">
          <span className="text-secondary">VAULT FORENSICS</span>
          <span>/</span>
          <span className="text-white">INVERSE ATTRIBUTION LAB</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Steganographic Leak Analysis &amp; Attribution</span>
          <span className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary font-mono border border-secondary/30">
            FR-5 Engine
          </span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          Upload intercepted or exfiltrated artifacts to extract steganographic footprints, compute Bit Error Rates, and attribute custodial origin.
        </p>
      </div>

      {/* Analysis Input Card */}
      <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-6">
        <form onSubmit={handleScan} className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]);
            }}
            className="border-2 border-dashed border-outline-variant hover:border-secondary rounded-xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all bg-surface-container/30"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.jpg,.jpeg,.bmp"
              onChange={(e) => {
                if (e.target.files.length > 0) setSelectedFile(e.target.files[0]);
              }}
            />
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-secondary mb-2 border border-outline-variant">
              <span className="material-symbols-outlined text-2xl">biotech</span>
            </div>
            <div className="text-sm font-semibold text-white">Upload Intercepted / Recovered Artifact</div>
            <div className="text-xs text-outline font-mono mt-0.5">
              Accepts .txt, .jpg, .bmp (Rejects .zip, .mp4, etc.)
            </div>

            {selectedFile && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary/10 text-secondary text-xs font-mono border border-secondary/30">
                <span className="material-symbols-outlined text-xs">file_present</span>
                <span>
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Simulated BER Noise Slider */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-white font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-warning text-sm">grain</span>
                <span>Simulate Transmission Noise / Bit Error Rate (BER):</span>
              </label>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary font-bold">
                {parseFloat(berNoise).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={berNoise}
              onChange={(e) => setBerNoise(parseFloat(e.target.value))}
              className="w-full accent-secondary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline font-mono">
              <span>0.0% (Clean)</span>
              <span className="text-success">&le; 5.0% (Tolerable Limit [FR-5])</span>
              <span className="text-error">&gt; 5.0% (Decoder Failure [BVA-05])</span>
              <span>10.0% (Severe)</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-secondary/20"
            >
              <span className="material-symbols-outlined text-base">radar</span>
              <span>{loading ? 'Scanning Cryptographic Lattice...' : 'Initiate Cryptographic Extraction & Attribution'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Forensic Report Display */}
      {report && (
        <div
          className={`border rounded-xl p-6 transition-all ${
            !report.success
              ? 'bg-error-container/20 border-error/50'
              : isPositive
              ? 'bg-success/5 border-success/40 shadow-xl'
              : 'bg-warning/5 border-warning/40 shadow-xl'
          }`}
        >
          {!report.success ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-error/20 text-error flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">error</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-error">Extraction Failed / Tampered Carrier</h3>
                  <p className="text-xs text-outline font-mono">STATUS: {report.status || 'REJECTED'}</p>
                </div>
              </div>
              <p className="text-xs text-on-surface font-mono bg-surface-container p-3 rounded-lg border border-outline-variant/40">
                {report.error || 'The forensic engine could not extract a verifiable watermark.'}
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40 mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${isPositive ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'} flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-3xl">
                      {isPositive ? 'verified' : 'help'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {isPositive ? 'Positive Attribution Confirmed' : 'Inconclusive Attribution'}
                    </h3>
                    <p className={`text-xs font-mono ${isPositive ? 'text-success' : 'text-warning'}`}>
                      {report.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-outline font-mono uppercase">Match Confidence</div>
                    <div className={`text-2xl font-bold font-mono ${confidence >= 80 ? 'text-success' : 'text-warning'}`}>
                      {confidence.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full border-4 ${confidence >= 80 ? 'border-success' : 'border-warning'} flex items-center justify-center text-xs font-bold font-mono`}>
                    {confidence >= 80 ? 'PASS' : 'HOLD'}
                  </div>
                </div>
              </div>

              {report.attributedAgent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1.5">
                    <div className="text-outline uppercase text-[10px]">Identified Custodial Recipient</div>
                    <div className="text-base font-bold text-white">{report.attributedAgent.name}</div>
                    <div className="text-secondary font-mono">{report.attributedAgent.email}</div>
                    <div className="text-on-surface-variant">
                      Student / Agent ID: <span className="text-white font-bold">{report.attributedAgent.studentId}</span>
                    </div>
                    <div className="text-on-surface-variant">
                      Assigned Department: {report.attributedAgent.department}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1.5">
                    <div className="text-outline uppercase text-[10px]">Forensic Footprint Telemetry</div>
                    <div className="text-on-surface-variant">
                      Original File: <span className="text-white">{report.attributedAgent.originalFilename || 'Carrier Document'}</span>
                    </div>
                    <div className="text-on-surface-variant">
                      Allocation Timestamp: <span className="text-white">{new Date(report.attributedAgent.allocatedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-on-surface-variant truncate">Extracted UUID Token:</div>
                    <div className="text-[11px] font-mono text-secondary bg-surface-container-high px-2 py-1 rounded truncate select-all">
                      {report.extractedToken}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-outline font-mono flex items-center gap-1.5 mt-2">
                <span className="material-symbols-outlined text-xs">info</span>
                <span>Forensic notice: Finding serves as digital evidence pursuant to organizational data governance policy.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

