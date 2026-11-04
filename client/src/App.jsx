import React, { useState, useEffect } from 'react';
import { apiRequest, getToken, setToken } from './api';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MasterVault from './components/MasterVault';
import SecureUpload from './components/SecureUpload';
import ForensicLab from './components/ForensicLab';
import AuditTrail from './components/AuditTrail';
import AgentsList from './components/AgentsList';
import AgentWorkspace from './components/AgentWorkspace';
import AllocationModal from './components/AllocationModal';
import StitchCatalog from './components/StitchCatalog';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [agents, setAgents] = useState([]);
  const [allocatingFile, setAllocatingFile] = useState(null);
  const [assignedCount, setAssignedCount] = useState(0);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest('/auth/profile');
      setUser(data.user);
      if (data.user.role === 'agent') {
        setActiveTab('my-files');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/stats');
      setStats(data.metrics);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const data = await apiRequest('/audit');
      setRecentLogs(data.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await apiRequest('/files');
      setVaultFiles(data.files);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await apiRequest('/agents');
      setAgents(data.agents);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgentFilesCount = async () => {
    try {
      const data = await apiRequest('/files/agent-files');
      setAssignedCount(data.files.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (getToken()) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentLogs();
      if (user.role === 'admin') {
        fetchFiles();
        fetchAgents();
      }
      fetchAgentFilesCount();
    }
  }, [user]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-secondary font-mono text-xs">
        <span className="material-symbols-outlined animate-spin text-2xl mr-2">sync</span>
        <span>Initializing Forensic Console...</span>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthenticated={(u) => setUser(u)} />;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <Sidebar
        user={user}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'vault') fetchFiles();
          if (tab === 'agents') fetchAgents();
          if (tab === 'dashboard') {
            fetchStats();
            fetchRecentLogs();
          }
        }}
        onLogout={handleLogout}
        assignedFilesCount={assignedCount}
      />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header user={user} fileCount={stats?.totalFiles ?? 0} />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              recentLogs={recentLogs}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'vault' && (
            <MasterVault
              files={vaultFiles}
              onOpenAllocate={(f) => setAllocatingFile(f)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'upload' && (
            <SecureUpload
              onUploadSuccess={() => {
                fetchFiles();
                fetchStats();
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'investigate' && <ForensicLab />}

          {activeTab === 'audit' && <AuditTrail />}

          {activeTab === 'agents' && (
            <AgentsList
              agents={agents}
              onRefresh={() => {
                fetchAgents();
                fetchStats();
              }}
            />
          )}

          {activeTab === 'stitch-catalog' && <StitchCatalog />}

          {activeTab === 'my-files' && <AgentWorkspace />}
        </main>
      </div>

      {allocatingFile && (
        <AllocationModal
          file={allocatingFile}
          agents={agents}
          onClose={() => setAllocatingFile(null)}
          onSuccess={() => {
            fetchFiles();
            fetchStats();
            fetchAgentFilesCount();
          }}
        />
      )}
    </div>
  );
}
