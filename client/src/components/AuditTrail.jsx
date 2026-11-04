import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionType, setActionType] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (queryStartDate = startDate, queryEndDate = endDate, queryAction = actionType) => {
    setError(null);
    setLoading(true);

    const params = [];
    if (queryStartDate) params.push(`startDate=${encodeURIComponent(queryStartDate)}`);
    if (queryEndDate) params.push(`endDate=${encodeURIComponent(queryEndDate)}`);
    if (queryAction) params.push(`actionType=${encodeURIComponent(queryAction)}`);

    try {
      const data = await apiRequest(`/audit?${params.join('&')}`);
      setLogs(data.logs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs('', '', '');
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const resetFilter = () => {
    setStartDate('');
    setEndDate('');
    setActionType('');
    fetchLogs('', '', '');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Immutable Forensic Audit Ledger</span>
          <span className="text-xs px-2 py-0.5 rounded bg-surface-container text-outline font-mono">
            FR-4
          </span>
        </h1>
        <p className="text-xs text-on-surface-variant font-mono">
          Tamper-evident chronological logs of uploads, allocations, downloads, and scans
        </p>
      </div>

      {/* Date Filter Controls [FR-4 / TC-DLD-EP-04] */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl p-5">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono text-outline mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-outline mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-outline mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
            >
              <option value="">All Action Types</option>
              <option value="FILE_UPLOAD">FILE_UPLOAD</option>
              <option value="AGENT_ALLOCATION">AGENT_ALLOCATION</option>
              <option value="FILE_DOWNLOAD">FILE_DOWNLOAD</option>
              <option value="LEAK_INVESTIGATION">LEAK_INVESTIGATION</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">filter_alt</span>
              <span>Apply Filter</span>
            </button>
            <button
              type="button"
              onClick={resetFilter}
              className="py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-error-container text-error text-xs font-mono flex items-center gap-2 border border-error/30">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Audit Table */}
      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-outline font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Event Timestamp</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Actor Identity</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-outline">
                    No logs found matching specified filter.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-3 text-outline">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px]">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {log.actorName} <span className="text-[10px] text-outline font-mono">({log.actorRole})</span>
                    </td>
                    <td className="px-4 py-3 text-outline font-mono text-[10px]">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-on-surface-variant font-mono text-[11px] truncate max-w-lg" title={log.details}>
                      {log.details}
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

