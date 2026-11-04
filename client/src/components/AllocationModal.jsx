import React, { useState } from 'react';
import { apiRequest } from '../api';

export default function AllocationModal({ file, agents = [], onClose, onSuccess }) {
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [validityDays, setValidityDays] = useState(7);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggleAgent = (id) => {
    setSelectedAgentIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length > 20) {
        setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [BVA-02]');
      } else {
        setError(null);
      }
      return next;
    });
  };

  const selectNAgents = (n) => {
    const ids = agents.slice(0, n).map(a => a.id);
    setSelectedAgentIds(ids);
    if (ids.length > 20) {
      setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [BVA-02]');
    } else {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (selectedAgentIds.length === 0) {
      setError('Select at least 1 agent for distribution. [BVA-02]');
      return;
    }

    if (selectedAgentIds.length > 20) {
      setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [BVA-02]');
      return;
    }

    if (validityDays < 1 || validityDays > 30) {
      setError('Invalid validity period: File access duration must be between 1 and 30 days. [BVA-07]');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/files/distribute', {
        method: 'POST',
        body: JSON.stringify({
          fileId: file.id,
          agentIds: selectedAgentIds,
          validityDays
        })
      });

      alert(
        `Distribution Complete!\nGenerated ${data.allocatedCount} personalized watermarked copies.\nDispatched in ${data.notifications.totalBatches} email batch(es) [NFR-3].`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-outline-variant/40 flex items-center justify-between bg-surface-container/40">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">share</span>
              <span>Target Agent Allocation &amp; Watermarking</span>
            </h2>
            <p className="text-xs text-outline font-mono mt-0.5">
              Document: {file.originalName} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          </div>
          <button onClick={onClose} className="text-outline hover:text-white p-1 rounded-lg">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Batch Agent Counter Banner [FR-2 / BVA-02] */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container border border-outline-variant/40">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-outline">Recipients Selected:</span>
              <span className={`font-bold text-sm ${selectedAgentIds.length > 20 ? 'text-error' : 'text-secondary'}`}>
                {selectedAgentIds.length}
              </span>
              <span className="text-outline">/ 20 permitted [BVA-02]</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectNAgents(20)}
                className="text-[11px] text-primary hover:underline font-mono"
              >
                Select 20 (Max)
              </button>
              <span className="text-outline">|</span>
              <button
                type="button"
                onClick={() => selectNAgents(21)}
                className="text-[11px] text-warning hover:underline font-mono"
              >
                Select 21 (Over limit test)
              </button>
            </div>
          </div>

          {/* Expiration Days Input [FR-2 / NFR-1 / BVA-07] */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-white font-medium">Access Expiration Period (Days):</label>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary font-bold">
                {validityDays} days
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-outline font-mono">
              <span>1 day (Min)</span>
              <span className="text-primary">Valid Range: [1 to 30 days]</span>
              <span className="text-error">&gt; 30 days (Rejected [BVA-07])</span>
            </div>
          </div>

          {/* Agent Checkbox Selection List */}
          <div>
            <div className="text-xs font-mono text-outline uppercase mb-2 flex items-center justify-between">
              <span>Select Target Agents:</span>
              <button
                type="button"
                onClick={() => setSelectedAgentIds([])}
                className="text-outline hover:text-white text-[11px]"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-surface-container/50 border border-outline-variant/30">
              {agents.map(agent => (
                <label
                  key={agent.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors border border-outline-variant/30"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAgentIds.includes(agent.id)}
                      onChange={() => handleToggleAgent(agent.id)}
                      className="accent-primary rounded cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{agent.name}</div>
                      <div className="text-[10px] text-outline font-mono">
                        {agent.email} • ID: {agent.studentId}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-[9px] font-mono">
                    {agent.department}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-error text-xs font-mono flex items-center gap-2 border border-error/30">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow"
          >
            <span className="material-symbols-outlined text-base">fingerprint</span>
            <span>{loading ? 'Embedding Watermarks...' : 'Generate & Distribute Watermarked Copies'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

