import React, { useState } from 'react';

export default function StitchCatalog() {
  const screens = [
    { name: 'dashboard.html', label: 'Security Operations Dashboard', category: 'SOC Command' },
    { name: 'admin_dashboard.html', label: 'Admin Dashboard Overview', category: 'SOC Command' },
    { name: 'signin.html', label: 'Sign In (Auth)', category: 'Authentication' },
    { name: 'mfa_challenge.html', label: 'MFA Challenge Verification', category: 'Authentication' },
    { name: 'upload.html', label: 'Secure File Ingestion', category: 'Vault & Upload' },
    { name: 'secure_file_vault.html', label: 'Secure File Vault & Distribution', category: 'Vault & Upload' },
    { name: 'master_files.html', label: 'Master Files & Ledger', category: 'Vault & Upload' },
    { name: 'overview_and_files.html', label: 'Overview & Files Explorer', category: 'Vault & Upload' },
    { name: 'assign.html', label: 'Assign Agents Workflow', category: 'Distribution' },
    { name: 'shared_with_agents.html', label: 'Shared with Agents Ledger', category: 'Distribution' },
    { name: 'authorized_agents.html', label: 'Authorized Agents & Enclaves', category: 'Enclaves' },
    { name: 'investigate.html', label: 'Forensic Leak Analysis & Attribution', category: 'Forensic Lab' },
    { name: 'forensic_extraction_lab.html', label: 'Forensic Extraction Lab', category: 'Forensic Lab' },
    { name: 'leak_analysis.html', label: 'Leak Analysis Workspace', category: 'Forensic Lab' },
    { name: 'audit_logs.html', label: 'Audit Trail & Compliance Ledger', category: 'Compliance' },
    { name: 'agent_workspace.html', label: 'Agent Workspace & My Files', category: 'Agent Portal' },
    { name: 'agent_document_portal.html', label: 'Agent Document Portal', category: 'Agent Portal' },
    { name: 'agent_recipient_portal.html', label: 'Agent Recipient Portal', category: 'Agent Portal' },
    { name: 'employee_file_detail.html', label: 'Employee File Detail Inspector', category: 'Agent Portal' },
    { name: 'admin_security_settings.html', label: 'Admin Security & Profile Settings', category: 'Settings' },
    { name: 'employee_security_settings.html', label: 'Employee Security Settings', category: 'Settings' }
  ];

  const [currentScreen, setCurrentScreen] = useState(screens[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Stitch Prototype Screen Catalog</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-mono">
              21 Screens
            </span>
          </h1>
          <p className="text-xs text-outline font-mono">
            Project #8064901582218045700 • LeakTrace Forensic Platform
          </p>
        </div>
        <a
          href={`/stitch/${currentScreen.name}`}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant text-secondary text-xs font-mono flex items-center gap-1"
        >
          <span>Open Fullscreen</span>
          <span className="material-symbols-outlined text-xs">open_in_new</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[78vh]">
        {/* List of screens */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-3 overflow-y-auto space-y-1.5 h-full">
          <div className="text-[10px] font-mono text-outline uppercase tracking-wider px-2 py-1">
            All 21 Stitch Screens
          </div>
          {screens.map(s => {
            const isSelected = currentScreen.name === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setCurrentScreen(s)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors flex flex-col gap-0.5 ${
                  isSelected
                    ? 'bg-surface-container border-primary/60'
                    : 'bg-surface/50 border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">{s.label}</div>
                <div className="flex items-center justify-between text-[10px] text-outline font-mono">
                  <span>{s.category}</span>
                  <span className="text-secondary">{s.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Preview Iframe */}
        <div className="lg:col-span-3 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden flex flex-col h-full">
          <div className="h-9 bg-surface-container px-4 flex items-center justify-between text-xs font-mono text-outline border-b border-outline-variant/40">
            <span className="text-white font-medium">{currentScreen.label}</span>
            <span>/stitch/{currentScreen.name}</span>
          </div>
          <iframe
            title={currentScreen.label}
            src={`/stitch/${currentScreen.name}`}
            className="flex-1 w-full h-full border-0 bg-surface"
          />
        </div>
      </div>
    </div>
  );
}

