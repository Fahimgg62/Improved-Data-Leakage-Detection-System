import React from 'react';

export default function Dashboard({ stats, recentLogs = [], onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Forensic Operations Command</h1>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Real-time steganographic telemetry and leak attribution metrics (React Client)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('upload')}
            className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            <span>Upload Document</span>
          </button>
          <button
            onClick={() => onNavigate('investigate')}
            className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-secondary/40 text-secondary text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">biotech</span>
            <span>Analyze Leaked Artifact</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-outline text-xs font-mono">
            <span>MASTER VAULT FILES</span>
            <span className="material-symbols-outlined text-primary text-xl">folder</span>
          </div>
          <div className="text-3xl font-bold text-white mt-2 font-mono">
            {stats?.totalFiles ?? 0}
          </div>
          <div className="text-[11px] text-outline mt-2 flex items-center gap-1">
            <span className="text-success font-medium">100% encrypted</span> at rest
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-outline text-xs font-mono">
            <span>WATERMARKED COPIES</span>
            <span className="material-symbols-outlined text-secondary text-xl">fingerprint</span>
          </div>
          <div className="text-3xl font-bold text-secondary mt-2 font-mono">
            {stats?.totalAllocations ?? 0}
          </div>
          <div className="text-[11px] text-outline mt-2 flex items-center gap-1">
            <span>RFC 4122 UUID v4 tokens</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-outline text-xs font-mono">
            <span>AUTHORIZED AGENTS</span>
            <span className="material-symbols-outlined text-warning text-xl">badge</span>
          </div>
          <div className="text-3xl font-bold text-white mt-2 font-mono">
            {stats?.totalAgents ?? 25}
          </div>
          <div className="text-[11px] text-outline mt-2 flex items-center gap-1">
            <span className="text-success">{stats?.activeAgents ?? 25} active enclaves</span>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-outline text-xs font-mono">
            <span>LEAK ATTRIBUTIONS</span>
            <span className="material-symbols-outlined text-success text-xl">troubleshoot</span>
          </div>
          <div className="text-3xl font-bold text-success mt-2 font-mono">
            {stats?.positiveMatches ?? 0}
          </div>
          <div className="text-[11px] text-outline mt-2 flex items-center gap-1">
            <span>Threshold: &ge; 80.0% confidence</span>
          </div>
        </div>
      </div>

      {/* System Compliance & Core Specifications Card */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">verified_user</span>
            <h3 className="font-bold text-sm text-white">Cryptographic Watermarking Standards &amp; Bounds</h3>
          </div>
          <span className="text-xs font-mono text-outline">SRS 3.1 &amp; Test Suite Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40">
            <div className="text-outline uppercase text-[10px]">Zero-Width Text Embedding (FR-3)</div>
            <div className="text-white font-semibold mt-1">Unicode ZWSP &amp; ZWNJ Bitstream</div>
            <div className="text-on-surface-variant text-[11px] mt-0.5">Payload capacity: &ge; 50 words cover text</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40">
            <div className="text-outline uppercase text-[10px]">LSB Spatial Steganography (FR-3)</div>
            <div className="text-white font-semibold mt-1">24-Bit BMP / JPEG Redundant Bits</div>
            <div className="text-on-surface-variant text-[11px] mt-0.5">Resolution floor: &ge; 256&times;256 px</div>
          </div>
          <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/40">
            <div className="text-outline uppercase text-[10px]">Forensic Inverse Attribution (FR-5)</div>
            <div className="text-white font-semibold mt-1">BER Tolerance: &le; 5.0% Noise</div>
            <div className="text-on-surface-variant text-[11px] mt-0.5">Attribution threshold: &ge; 80.0% confidence</div>
          </div>
        </div>
      </div>

      {/* Recent Audit Stream Table */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-lg">history</span>
            <h3 className="font-bold text-sm text-white">Live Forensic Audit Trail</h3>
          </div>
          <button onClick={() => onNavigate('audit')} className="text-xs text-primary hover:underline font-mono">
            View Full Trail &rarr;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-outline font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Action Type</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
              {recentLogs.slice(0, 5).map(log => (
                <tr key={log.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-2 text-outline">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px]">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-white font-medium">{log.actorName}</td>
                  <td className="px-4 py-2 text-on-surface-variant truncate max-w-md">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

