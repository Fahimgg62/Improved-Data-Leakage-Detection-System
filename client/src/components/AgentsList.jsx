import React, { useState } from 'react';
import { apiRequest } from '../api';

export default function AgentsList({ agents = [], onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Threat Intelligence Unit');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (agentId) => {
    try {
      await apiRequest(`/agents/${agentId}/toggle-status`, { method: 'PATCH' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest('/agents', {
        method: 'POST',
        body: JSON.stringify({ name, email, studentId, department })
      });
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setStudentId('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Authorized Agents &amp; Enclaves</h1>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Directory of registered organizational recipients qualified for file distribution
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Register New Agent</span>
        </button>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container text-outline font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3">Agent Name</th>
                <th className="px-5 py-3">Student / Employee ID</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Clearance</th>
                <th className="px-5 py-3">Assigned Files</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
              {agents.map(a => (
                <tr key={a.id} className="hover:bg-surface-container/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{a.name}</div>
                    <div className="text-[10px] text-outline font-mono">{a.email}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-secondary font-bold">{a.studentId}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{a.department}</td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px]">
                      {a.clearanceLevel}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold font-mono">
                      {a.allocatedFilesCount} files
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      a.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.active ? 'bg-success' : 'bg-error'}`}></span>
                      <span>{a.active ? 'ACTIVE' : 'DISABLED'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggle(a.id)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-white text-[11px] font-mono transition-colors"
                    >
                      {a.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              <span>Register New Authorized Agent</span>
            </h2>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-outline mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agent Jane Doe"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-outline mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@leaktrace.internal"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-outline mb-1">Student / Employee ID</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="24524203099"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-outline mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                >
                  <option value="Threat Intelligence Unit">Threat Intelligence Unit</option>
                  <option value="Cryptographic Security Analysis">Cryptographic Security Analysis</option>
                  <option value="Field Intelligence">Field Intelligence</option>
                  <option value="Incident Response & Telemetry">Incident Response &amp; Telemetry</option>
                </select>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error-container text-error text-xs font-mono">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs transition-colors"
                >
                  {loading ? 'Creating...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
