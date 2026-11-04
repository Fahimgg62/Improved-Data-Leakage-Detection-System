import React, { useState, useEffect } from 'react';

export default function Header({ user, fileCount = 0 }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface-container-low/90 backdrop-blur border-b border-outline-variant/40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 text-xs font-mono text-outline">
        <span className="flex items-center gap-1.5 text-success">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          <span>REACT FORENSIC TELEMETRY</span>
        </span>
        <span className="hidden md:inline">|</span>
        <span className="hidden md:inline">VAULT: {fileCount} ARTIFACTS</span>
        <span className="hidden md:inline">|</span>
        <span className="text-on-surface">{time}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container border border-outline-variant/50 text-xs font-mono">
          <span className="text-outline">CLEARANCE:</span>
          <span className="text-secondary font-semibold">{user?.clearanceLevel || 'TOP-SECRET'}</span>
        </div>
      </div>
    </header>
  );
}

