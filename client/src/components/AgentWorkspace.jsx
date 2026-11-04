import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function AgentWorkspace() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/files/agent-files');
      setFiles(data.files);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (allocationId, filename) => {
    try {
      const res = await apiRequest(`/files/download/${allocationId}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      fetchFiles();
    } catch (err) {
      alert(`Download Error: ${err.message}`);
      fetchFiles();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Agent Workspace &amp; Assigned Files</span>
          <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning font-mono border border-warning/30">
            Recipient Portal
          </span>
        </h1>
        <p className="text-xs text-on-surface-variant font-mono">
          Confidential documents provisioned specifically for your credentials with unique steganographic footprints
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-outline font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Document Name</th>
                <th className="px-5 py-3">Allocation Date</th>
                <th className="px-5 py-3">Validity Expiration</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-outline">
                    No documents assigned to your enclave yet.
                  </td>
                </tr>
              ) : (
                files.map(f => (
                  <tr key={f.allocationId} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-warning text-sm">lock</span>
                      <span>{f.filename}</span>
                    </td>
                    <td className="px-5 py-3 text-outline">
                      {new Date(f.allocatedAt).toLocaleDateString()}
                    </td>
                    <td className={`px-5 py-3 font-mono text-xs ${f.isExpired ? 'text-error font-bold' : 'text-primary'}`}>
                      {new Date(f.expiresAt).toLocaleDateString()} {f.isExpired ? '(EXPIRED)' : ''}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        f.isExpired ? 'bg-error-container text-error' : 'bg-success/10 text-success'
                      }`}>
                        {f.isExpired ? 'REVOKED' : 'DOWNLOADABLE'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {f.isExpired ? (
                        <button disabled className="px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs cursor-not-allowed">
                          Expired
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDownload(f.allocationId, f.filename)}
                          className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs inline-flex items-center gap-1 shadow"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          <span>Download</span>
                        </button>
                      )}
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
