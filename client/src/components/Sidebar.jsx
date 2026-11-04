import React from 'react';

export default function Sidebar({ user, activeTab, onSelectTab, onLogout, assignedFilesCount = 0 }) {
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: 'dashboard', adminOnly: true },
    { id: 'vault', label: 'Master Vault', icon: 'folder_special', adminOnly: true },
    { id: 'upload', label: 'Secure Ingestion', icon: 'upload_file', adminOnly: true },
    { id: 'investigate', label: 'Forensic Lab', icon: 'biotech', tag: 'FR-5', adminOnly: true },
    { id: 'audit', label: 'Audit Trail', icon: 'policy', adminOnly: true },
    { id: 'agents', label: 'Enclave Agents', icon: 'group', adminOnly: true },
    { id: 'stitch-catalog', label: 'Stitch Screen Catalog', icon: 'auto_awesome', badge: '21 Screens', isSpecial: true },
    { id: 'my-files', label: 'My Assigned Files', icon: 'file_download', badge: assignedFilesCount, isAgentTab: true }
  ];

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between z-40">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="p-5 flex flex-col gap-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/60 shadow-inner">
              <span className="material-symbols-outlined text-secondary text-xl">fingerprint</span>
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">LeakTrace</span>
              <span className="text-[10px] text-outline font-mono block tracking-wider">REACT PLATFORM</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px] font-mono w-fit mt-1">
            <span className="material-symbols-outlined text-[12px]">verified_user</span>
            <span>FIPS-140-3 Compliant</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 p-3">
          <div className="text-[10px] font-mono text-outline uppercase px-3 py-1 tracking-wider">
            {isAdmin ? 'Forensics & Operations' : 'Workspace'}
          </div>

          {visibleItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-primary-container text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-white hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${item.isSpecial ? 'text-secondary' : ''}`}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.tag && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-mono">
                    {item.tag}
                  </span>
                )}
                {item.badge !== undefined && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    item.isSpecial ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Card & Logout */}
      <div className="p-3 border-t border-outline-variant/30 bg-surface-container-lowest/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container/60 border border-outline-variant/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'LT'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-outline font-mono uppercase truncate">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Terminate Session"
            className="p-1.5 text-outline hover:text-error hover:bg-surface-container rounded transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
