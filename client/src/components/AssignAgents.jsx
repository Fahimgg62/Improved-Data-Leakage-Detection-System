import React, { useState, useMemo } from 'react';
import { apiRequest } from '../api';

export default function AssignAgents({
  files = [],
  agents = [],
  selectedFileId = null,
  onBackToVault,
  onAllocationSuccess
}) {
  // If file was passed or default to first file
  const [currentFileId, setCurrentFileId] = useState(selectedFileId || (files.length > 0 ? files[0].id : ''));
  const [selectedAgentIds, setSelectedAgentIds] = useState([]);
  const [validityDays, setValidityDays] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const currentFile = useMemo(() => {
    return files.find(f => f.id === currentFileId) || (files.length > 0 ? files[0] : null);
  }, [files, currentFileId]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.studentId.includes(searchQuery);
      const matchesDept = !departmentFilter || agent.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [agents, searchQuery, departmentFilter]);

  const departments = useMemo(() => {
    const set = new Set(agents.map(a => a.department).filter(Boolean));
    return Array.from(set);
  }, [agents]);

  const handleToggleAgent = (id) => {
    setSelectedAgentIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length > 20) {
        setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [FR-2 / BVA-02]');
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
      setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [FR-2 / BVA-02]');
    } else {
      setError(null);
    }
  };

  const clearSelection = () => {
    setSelectedAgentIds([]);
    setError(null);
  };

  const handleDistribute = async () => {
    setError(null);
    setSuccessInfo(null);

    if (!currentFile) {
      setError('No master file selected for distribution. Upload or select a file first.');
      return;
    }

    if (selectedAgentIds.length === 0) {
      setError('Select at least 1 agent for distribution. [FR-2 / BVA-02]');
      return;
    }

    if (selectedAgentIds.length > 20) {
      setError('Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [FR-2 / BVA-02]');
      return;
    }

    if (validityDays < 1 || validityDays > 30) {
      setError('Invalid validity period: File access duration must be between 1 and 30 days. [FR-2 / NFR-1 / BVA-07]');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/files/distribute', {
        method: 'POST',
        body: JSON.stringify({
          fileId: currentFile.id,
          agentIds: selectedAgentIds,
          validityDays
        })
      });

      setSuccessInfo({
        message: `Successfully allocated and watermarked ${data.allocatedCount} personalized copies.`,
        batches: data.notifications?.totalBatches || 1,
        totalRecipients: data.allocatedCount
      });

      if (onAllocationSuccess) onAllocationSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stepper Header matching Stitch */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-xs text-secondary uppercase tracking-widest">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Distribution Pipeline // Step 02 of 03</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1 tracking-tight flex items-center gap-2">
              <span>Recipient Attribution &amp; Invariant Stego-Mapping</span>
              <span className="text-[10px] text-secondary bg-surface-container-high px-2 py-0.5 rounded font-mono uppercase">
                Zero-Drift Mode
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToVault}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-white transition-all flex items-center gap-1 text-xs font-mono"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Master Vault</span>
            </button>
          </div>
        </div>

        {/* 3-Step Wizard Visual Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Upload (Completed) */}
          <div className="bg-surface-container-low p-3.5 rounded-xl flex items-center gap-3 border border-outline-variant/30">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-secondary font-semibold">STEP 01 // COMPLETED</div>
              <div className="text-xs font-semibold text-white truncate">Upload Master File</div>
              <div className="font-mono text-[10px] text-on-surface-variant truncate">
                {currentFile ? currentFile.originalName : 'No file selected'}
              </div>
            </div>
          </div>

          {/* Step 2: Assign Agents (ACTIVE) */}
          <div className="bg-surface-container p-3.5 rounded-xl flex items-center gap-3 border border-primary/50 relative overflow-hidden shadow-lg shadow-primary/10">
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"></div>
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-xl">fingerprint</span>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-primary font-bold flex items-center gap-1">
                <span>STEP 02 // ACTIVE ALLOCATION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
              </div>
              <div className="text-xs font-semibold text-white truncate">Assign Target Agents</div>
              <div className="font-mono text-[10px] text-secondary">
                {selectedAgentIds.length} Agents Selected &bull; {selectedAgentIds.length <= 20 ? 'Valid' : 'Exceeds Limit'}
              </div>
            </div>
          </div>

          {/* Step 3: Enclave Dispatch (Pending) */}
          <div className="bg-surface-container-lowest p-3.5 rounded-xl flex items-center gap-3 border border-outline-variant/20 opacity-60">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-outline shrink-0">
              <span className="material-symbols-outlined text-lg">send_time_extension</span>
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[10px] text-outline">STEP 03 // PENDING</div>
              <div className="text-xs font-semibold text-outline truncate">Enclave Dispatch &amp; Seal</div>
              <div className="font-mono text-[10px] text-outline">Awaiting Batch Commitment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column High-Density Forensic Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Master Asset Summary & Stego Matrix (4 Cols) */}
        <div className="xl:col-span-4 space-y-5">
          
          {/* Target Master Asset Card */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">
                Target Master Asset
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-warning/10 text-warning border border-warning/30">
                CONFIDENTIAL // TOP-SECRET
              </span>
            </div>

            {/* Document Selector Dropdown if multiple files */}
            {files.length > 1 && (
              <div>
                <label className="block text-[11px] font-mono text-outline mb-1">Switch Master Document:</label>
                <select
                  value={currentFileId}
                  onChange={(e) => setCurrentFileId(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                >
                  {files.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.originalName} ({(f.size / 1024).toFixed(1)} KB)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentFile ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 border border-outline-variant/50">
                    <span className="material-symbols-outlined text-2xl">
                      {currentFile.extension === '.txt' ? 'description' : 'image'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate" title={currentFile.originalName}>
                      {currentFile.originalName}
                    </h3>
                    <div className="flex items-center gap-2 text-on-surface-variant font-mono text-[11px] mt-0.5">
                      <span>{(currentFile.size / 1024).toFixed(1)} KB</span>
                      <span>&bull;</span>
                      <span className="text-secondary uppercase">{currentFile.extension}</span>
                      <span>&bull;</span>
                      <span>UTF-8 Crypt</span>
                    </div>
                  </div>
                </div>

                {/* SHA-256 Digest */}
                <div className="bg-surface-container-lowest rounded-lg p-2.5 font-mono text-[11px] space-y-1 border border-outline-variant/30">
                  <div className="flex items-center justify-between text-outline text-[10px]">
                    <span>INGESTION DIGEST (SHA-256)</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(currentFile.hash)}
                      className="text-primary hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      <span>COPY</span>
                    </button>
                  </div>
                  <div className="text-primary truncate select-all" title={currentFile.hash}>
                    {currentFile.hash}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-outline text-xs font-mono">
                No file available. Upload a file to proceed.
              </div>
            )}
          </div>

          {/* Steganographic Carrier Matrix Capacity Card */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">memory</span>
                <h3 className="text-xs font-bold text-white uppercase font-mono">Stego Matrix Capacity</h3>
              </div>
              <span className="text-[10px] font-mono text-secondary bg-surface-container px-2 py-0.5 rounded">
                FR-3 Active
              </span>
            </div>

            <div className="bg-surface-container-lowest p-3 rounded-lg space-y-2 border border-outline-variant/30">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-outline">Batch Recipient Commitment:</span>
                <span className="text-white font-bold">
                  <span className={selectedAgentIds.length > 20 ? 'text-error' : 'text-primary'}>
                    {selectedAgentIds.length}
                  </span>{' '}
                  / 20 max
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    selectedAgentIds.length > 20 ? 'bg-error' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, (selectedAgentIds.length / 20) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-outline">
                <span>Boundary: [1 to 20 agents]</span>
                <span className={selectedAgentIds.length > 20 ? 'text-error font-bold' : 'text-success'}>
                  {selectedAgentIds.length > 20 ? 'OVER LIMIT (+1)' : 'NOMINAL'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30 text-xs font-mono pt-1">
              <div className="py-2 flex justify-between">
                <span className="text-outline">Embedding Modality:</span>
                <span className="text-white">
                  {currentFile?.extension === '.txt' ? 'Zero-Width Unicode (ZWSP/ZWNJ)' : 'LSB Pixel Matrix'}
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-outline">Tracking Footprint:</span>
                <span className="text-secondary">RFC 4122 UUID v4 (36 chars)</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-outline">SMTP Notification Limiter:</span>
                <span className="text-white">Max 10 emails/batch (NFR-3)</span>
              </div>
            </div>
          </div>

          {/* Access Validity & Expiration Slider Card */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">timer</span>
                <h3 className="text-xs font-bold text-white uppercase font-mono">Access Expiration Duration</h3>
              </div>
              <span className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                {validityDays} Days
              </span>
            </div>

            <p className="text-[11px] text-outline font-mono">
              Enforces link revocation boundary [1 to 30 days] under requirement FR-2 / NFR-1.
            </p>

            <input
              type="range"
              min="1"
              max="35"
              value={validityDays}
              onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
              className="w-full accent-primary cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-outline">1 day (Min)</span>
              <span className="text-primary font-medium">[1 to 30 days] Valid</span>
              <span className={validityDays > 30 ? 'text-error font-bold' : 'text-outline'}>
                &gt;30 days (Blocked)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Agent Directory & Selection Roster (8 Cols) */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Search, Filter & Batch Quick Actions Header */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/50 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">shield_person</span>
                  <span>Enclave Agent Directory ({agents.length} Registered)</span>
                </h2>
                <p className="text-[11px] text-outline font-mono mt-0.5">
                  Select between 1 and 20 authorized personnel to generate steganographic watermarked copies
                </p>
              </div>

              {/* Batch Preset Buttons */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => selectNAgents(20)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary border border-primary/40 transition-colors"
                >
                  Select 20 (Max)
                </button>
                <button
                  type="button"
                  onClick={() => selectNAgents(21)}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-warning border border-warning/40 transition-colors"
                  title="Test upper boundary +1 threshold [BVA-02]"
                >
                  Select 21 (BVA Test)
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-base">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by agent name, email, or Student ID..."
                  className="w-full bg-surface-container border border-outline-variant rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-outline focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                >
                  <option value="">All Operational Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Validation Alert Banners */}
          {error && (
            <div className="p-3.5 rounded-xl bg-error-container text-error text-xs font-mono flex items-center gap-2.5 border border-error/40">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 rounded-xl bg-success/10 text-success text-xs font-mono flex items-center justify-between border border-success/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>{successInfo.message}</span>
              </div>
              <span className="text-[10px] text-outline font-mono">
                Dispatched in {successInfo.batches} SMTP batch(es)
              </span>
            </div>
          )}

          {/* Agent Selection Table */}
          <div className="bg-surface-container-low border border-outline-variant/50 rounded-xl overflow-hidden">
            <div className="max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container text-outline font-mono uppercase text-[10px] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 w-10 text-center">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-3">Agent Identity</th>
                    <th className="px-4 py-3">Student / Employee ID</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Clearance</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-mono text-[11px]">
                  {filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-outline">
                        No agents matching query criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map(a => {
                      const isSelected = selectedAgentIds.includes(a.id);
                      return (
                        <tr
                          key={a.id}
                          onClick={() => handleToggleAgent(a.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 hover:bg-primary/15'
                              : 'hover:bg-surface-container/50'
                          }`}
                        >
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleAgent(a.id)}
                              className="accent-primary rounded cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{a.name}</div>
                            <div className="text-[10px] text-outline">{a.email}</div>
                          </td>
                          <td className="px-4 py-3 text-secondary font-bold font-mono">
                            {a.studentId}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-[10px]">
                            {a.department}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-outline text-[10px]">
                              {a.clearanceLevel || 'SECRET'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${
                              a.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${a.active ? 'bg-success' : 'bg-error'}`}></span>
                              <span>{a.active ? 'ACTIVE' : 'LOCKED'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Commitment Bar */}
          <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-mono text-xs text-outline flex items-center gap-2">
              <span>Recipients Selected:</span>
              <span className={`font-bold text-sm ${selectedAgentIds.length > 20 ? 'text-error' : 'text-white'}`}>
                {selectedAgentIds.length}
              </span>
              <span>/ 20 max</span>
              {selectedAgentIds.length > 20 && (
                <span className="text-error font-semibold text-[11px]">(Exceeds boundary by {selectedAgentIds.length - 20})</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleDistribute}
              disabled={loading || selectedAgentIds.length === 0 || selectedAgentIds.length > 20}
              className={`px-6 py-2.5 rounded-lg text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                selectedAgentIds.length === 0 || selectedAgentIds.length > 20
                  ? 'bg-surface-container-high text-outline cursor-not-allowed border border-outline-variant/40'
                  : 'bg-primary hover:bg-primary/90 shadow-primary/25 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-base">fingerprint</span>
              <span>
                {loading
                  ? 'Generating Steganographic Copies...'
                  : `Commit Batch & Distribute (${selectedAgentIds.length} Copies)`}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
