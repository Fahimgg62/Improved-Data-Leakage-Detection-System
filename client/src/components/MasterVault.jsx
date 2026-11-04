import React from 'react';

export default function MasterVault({ files = [], onOpenAllocate, onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Master Files &amp; Distribution Ledger</h1>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Confidential repository documents ready for steganographic tracking distribution
          </p>
        </div>
        <button
          onClick={() => onNavigate('upload')}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Upload New File</span>
        </button>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-outline font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Document Name</th>
                <th className="px-5 py-3">Carrier Format</th>
                <th className="px-5 py-3">File Size</th>
                <th className="px-5 py-3">SHA-256 Checksum</th>
                <th className="px-5 py-3">Allocations</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-outline">
                    No documents in master vault. Ingest a file via Secure Ingestion.
                  </td>
                </tr>
              ) : (
                files.map(f => (
                  <tr key={f.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span className={`material-symbols-outlined text-sm ${f.extension === '.txt' ? 'text-secondary' : 'text-primary'}`}>
                          {f.extension === '.txt' ? 'description' : 'image'}
                        </span>
                        <span>{f.originalName}</span>
                      </div>
                      <div className="text-[10px] text-outline font-mono">Uploaded by {f.uploadedByName}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px] uppercase">
                        {f.extension}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-outline">{(f.size / 1024).toFixed(1)} KB</td>
                    <td className="px-5 py-3 text-outline font-mono text-[10px] truncate max-w-xs" title={f.hash}>
                      {f.hash.slice(0, 16)}...
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold font-mono">
                        {f.distributionCount || 0} copies
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => onOpenAllocate(f)}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs inline-flex items-center gap-1 shadow"
                      >
                        <span className="material-symbols-outlined text-sm">share</span>
                        <span>Distribute</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
