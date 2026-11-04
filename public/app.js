// State
let currentUser = null;
let currentToken = localStorage.getItem('leaktrace_token') || null;
let mfaPendingToken = null;
let currentAllocatingFile = null;
let allAgents = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  setupEventListeners();

  if (currentToken) {
    fetchProfile();
  } else {
    showAuthView();
  }
});

function initClock() {
  const clockEl = document.getElementById('header-clock');
  setInterval(() => {
    const now = new Date();
    clockEl.innerText = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  }, 1000);
}

// -----------------------------------------------------------------------------
// AUTHENTICATION & SESSIONS
// -----------------------------------------------------------------------------
function presetLogin(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  document.getElementById('login-form').dispatchEvent(new Event('submit'));
}

function showAuthView() {
  document.getElementById('auth-container').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-card').classList.remove('hidden');
  document.getElementById('mfa-card').classList.add('hidden');
}

function showAppShell() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  updateUserInterface();
  navigate('dashboard');
  refreshTelemetry();
}

function updateUserInterface() {
  if (!currentUser) return;

  document.getElementById('user-name').innerText = currentUser.name;
  document.getElementById('user-role').innerText = currentUser.role.toUpperCase();
  document.getElementById('header-clearance').innerText = currentUser.clearanceLevel || 'CONFIDENTIAL';
  document.getElementById('user-avatar').innerText = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  // Hide admin tabs if standard agent
  const isAdmin = currentUser.role === 'admin';
  ['nav-dashboard', 'nav-vault', 'nav-upload', 'nav-investigate', 'nav-audit', 'nav-agents'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (isAdmin) el.classList.remove('hidden');
      else el.classList.add('hidden');
    }
  });

  if (!isAdmin) {
    navigate('my-files');
  }
}

async function fetchProfile() {
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      showAppShell();
    } else {
      logout();
    }
  } catch (err) {
    logout();
  }
}

function logout() {
  localStorage.removeItem('leaktrace_token');
  currentToken = null;
  currentUser = null;
  showAuthView();
}

function cancelMfa() {
  mfaPendingToken = null;
  document.getElementById('mfa-card').classList.add('hidden');
  document.getElementById('login-card').classList.remove('hidden');
}

// -----------------------------------------------------------------------------
// NAVIGATION
// -----------------------------------------------------------------------------
function navigate(tabId) {
  const tabs = ['dashboard', 'vault', 'upload', 'investigate', 'audit', 'agents', 'my-files'];
  
  tabs.forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const nav = document.getElementById(`nav-${t}`);
    if (view) view.classList.add('hidden');
    if (nav) {
      nav.classList.remove('bg-primary-container', 'text-primary');
      nav.classList.add('text-on-surface-variant');
    }
  });

  const activeView = document.getElementById(`view-${tabId}`);
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeNav) {
    activeNav.classList.add('bg-primary-container', 'text-primary');
    activeNav.classList.remove('text-on-surface-variant');
  }

  // View specific fetchers
  if (tabId === 'dashboard') {
    refreshTelemetry();
  } else if (tabId === 'vault') {
    fetchVaultFiles();
  } else if (tabId === 'audit') {
    fetchAuditLogs();
  } else if (tabId === 'agents') {
    fetchAgentsList();
  } else if (tabId === 'my-files') {
    fetchMyFiles();
  }
}

// -----------------------------------------------------------------------------
// TELEMETRY & STATS
// -----------------------------------------------------------------------------
async function refreshTelemetry() {
  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('stat-files').innerText = data.metrics.totalFiles;
      document.getElementById('stat-allocations').innerText = data.metrics.totalAllocations;
      document.getElementById('stat-agents').innerText = data.metrics.totalAgents;
      document.getElementById('stat-investigations').innerText = data.metrics.positiveMatches;
      document.getElementById('header-file-count').innerText = `VAULT: ${data.metrics.totalFiles} ARTIFACTS`;
    }
    fetchRecentAuditSnippet();
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

async function fetchRecentAuditSnippet() {
  try {
    const res = await fetch('/api/audit', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      const tbody = document.getElementById('dashboard-audit-tbody');
      tbody.innerHTML = '';
      const snippet = data.logs.slice(0, 5);
      snippet.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-surface-container/50 transition-colors';
        tr.innerHTML = `
          <td class="px-4 py-2 text-outline">${new Date(log.timestamp).toLocaleTimeString()}</td>
          <td class="px-4 py-2"><span class="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px]">${log.actionType}</span></td>
          <td class="px-4 py-2 text-white font-medium">${log.actorName}</td>
          <td class="px-4 py-2 text-on-surface-variant truncate max-w-md">${log.details}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (err) {}
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS & SETUP
// -----------------------------------------------------------------------------
function setupEventListeners() {
  // Login Form
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');

    errorEl.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errorText.innerText = data.error || 'Authentication rejected';
        errorEl.classList.remove('hidden');
        return;
      }

      if (data.mfaRequired) {
        mfaPendingToken = data.mfaToken;
        document.getElementById('login-card').classList.add('hidden');
        document.getElementById('mfa-card').classList.remove('hidden');
        return;
      }

      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('leaktrace_token', currentToken);
      showAppShell();
    } catch (err) {
      errorText.innerText = 'Network error connecting to forensic server';
      errorEl.classList.remove('hidden');
    }
  });

  // MFA Form
  const mfaForm = document.getElementById('mfa-form');
  mfaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('mfa-code').value;
    const errorEl = document.getElementById('mfa-error');
    const errorText = document.getElementById('mfa-error-text');

    errorEl.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken: mfaPendingToken, code })
      });
      const data = await res.json();

      if (!res.ok) {
        errorText.innerText = data.error || 'MFA validation rejected';
        errorEl.classList.remove('hidden');
        return;
      }

      currentToken = data.token;
      currentUser = data.user;
      localStorage.setItem('leaktrace_token', currentToken);
      showAppShell();
    } catch (err) {
      errorText.innerText = 'Failed to verify MFA code';
      errorEl.classList.remove('hidden');
    }
  });

  // Dropzone setup for Upload
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-primary', 'bg-surface-container-high');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-primary', 'bg-surface-container-high');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-primary', 'bg-surface-container-high');
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleSelectedUploadFile(fileInput.files[0]);
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleSelectedUploadFile(fileInput.files[0]);
    }
  });

  // Upload Form Submit
  const uploadForm = document.getElementById('upload-form');
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files || fileInput.files.length === 0) {
      showUploadAlert('error', 'Select or drop a file before submitting.');
      return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const btn = document.getElementById('btn-submit-upload');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">sync</span><span>Sealing &amp; Ingesting...</span>`;

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        showUploadAlert('error', data.error || 'File upload rejected');
      } else {
        showUploadAlert('success', `Document secured successfully! Checksum: ${data.file.hash.slice(0, 20)}...`);
        resetUploadForm();
        refreshTelemetry();
      }
    } catch (err) {
      showUploadAlert('error', 'Network failure during file upload');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined text-base">lock</span><span>Ingest &amp; Seal Document</span>`;
    }
  });

  // Dropzone setup for Investigation
  const invDropzone = document.getElementById('investigate-dropzone');
  const invFileInput = document.getElementById('investigate-file-input');

  invDropzone.addEventListener('click', () => invFileInput.click());
  invDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    invDropzone.classList.add('border-secondary', 'bg-surface-container-high');
  });
  invDropzone.addEventListener('dragleave', () => {
    invDropzone.classList.remove('border-secondary', 'bg-surface-container-high');
  });
  invDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    invDropzone.classList.remove('border-secondary', 'bg-surface-container-high');
    if (e.dataTransfer.files.length > 0) {
      invFileInput.files = e.dataTransfer.files;
      handleSelectedInvestigateFile(invFileInput.files[0]);
    }
  });
  invFileInput.addEventListener('change', () => {
    if (invFileInput.files.length > 0) {
      handleSelectedInvestigateFile(invFileInput.files[0]);
    }
  });

  // Investigate Form Submit
  const invForm = document.getElementById('investigate-form');
  invForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!invFileInput.files || invFileInput.files.length === 0) {
      alert('Please select an intercepted or recovered artifact to analyze.');
      return;
    }

    const file = invFileInput.files[0];
    const berNoise = document.getElementById('ber-slider').value;
    const formData = new FormData();
    formData.append('file', file);
    if (parseFloat(berNoise) > 0) {
      formData.append('simulatedBER', (parseFloat(berNoise) / 100).toFixed(4));
    }

    const btn = document.getElementById('btn-scan-leak');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">sync</span><span>Scanning Cryptographic Lattice...</span>`;

    try {
      const res = await fetch('/api/investigate/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: formData
      });
      const data = await res.json();
      renderForensicReport(data);
      refreshTelemetry();
    } catch (err) {
      alert('Error during forensic analysis');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined text-base">radar</span><span>Initiate Cryptographic Extraction &amp; Attribution</span>`;
    }
  });

  // Audit filter form
  const auditForm = document.getElementById('audit-filter-form');
  auditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    fetchAuditLogs();
  });
}

function handleSelectedUploadFile(file) {
  const pill = document.getElementById('selected-file-pill');
  document.getElementById('selected-file-name').innerText = file.name;
  document.getElementById('selected-file-size').innerText = `(${(file.size / 1024).toFixed(1)} KB)`;
  pill.classList.remove('hidden');

  // Client-side quick boundary check
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const allowed = ['.txt', '.jpg', '.jpeg', '.bmp'];
  if (!allowed.includes(ext)) {
    showUploadAlert('error', `Invalid file extension '${ext}'. Only .txt, .jpg, and .bmp files are supported for steganographic tracking. [FR-1]`);
  } else if (file.size === 0) {
    showUploadAlert('error', 'Upload failed: Empty file (0 Bytes) is not permitted. [BVA-01]');
  } else if (file.size > 50 * 1024 * 1024) {
    showUploadAlert('error', 'Upload failed: File size exceeds the maximum limit of 50 MB. [BVA-01]');
  } else {
    document.getElementById('upload-alert').classList.add('hidden');
  }
}

function handleSelectedInvestigateFile(file) {
  const pill = document.getElementById('investigate-selected-pill');
  document.getElementById('investigate-file-name').innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  pill.classList.remove('hidden');
}

function showUploadAlert(type, message) {
  const alertEl = document.getElementById('upload-alert');
  const textEl = document.getElementById('upload-alert-text');
  alertEl.className = 'p-4 rounded-lg text-xs font-mono flex items-center gap-3 border ';

  if (type === 'error') {
    alertEl.classList.add('bg-error-container', 'text-error', 'border-error/40');
  } else {
    alertEl.classList.add('bg-secondary/10', 'text-secondary', 'border-secondary/40');
  }

  textEl.innerText = message;
  alertEl.classList.remove('hidden');
}

function resetUploadForm() {
  document.getElementById('upload-form').reset();
  document.getElementById('selected-file-pill').classList.add('hidden');
  document.getElementById('file-input').value = '';
}

// -----------------------------------------------------------------------------
// TEST FILE GENERATION (HELPER FOR INSTANT DEMOS)
// -----------------------------------------------------------------------------
function createAndStageTestFile(type) {
  let file;
  if (type === 'txt-valid') {
    const textContent = `This is a highly confidential executive communication regarding Project LeakTrace. ` +
      `The operational requirements strictly dictate that any distribution of this data must be monitored using ` +
      `imperceptible steganographic watermarking. Every recipient is assigned an immutable tracking token ` +
      `derived from an RFC 4122 compliant UUID v4 specification. This document contains well over sixty words to ` +
      `fully satisfy the minimum fifty-word payload capacity threshold mandated by forensic requirement FR-3. ` +
      `Please ensure all security guidelines are maintained.`;
    file = new File([textContent], 'confidential_brief.txt', { type: 'text/plain' });
  } else if (type === 'txt-invalid-words') {
    // Exactly 49 words
    const words = Array(49).fill('confidential').join(' ');
    file = new File([words], 'short_brief_49words.txt', { type: 'text/plain' });
  } else if (type === 'bmp-valid') {
    // Generate simple 256x256 BMP buffer directly in browser
    const buffer = createBrowserBmp(256, 256);
    file = new File([buffer], 'blueprint_256x256.bmp', { type: 'image/bmp' });
  }

  if (file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    document.getElementById('file-input').files = dataTransfer.files;
    handleSelectedUploadFile(file);
    navigate('upload');
  }
}

function createBrowserBmp(width, height) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BMP Header
  view.setUint8(0, 0x42); view.setUint8(1, 0x4D); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // Offset

  // DIB Header
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true); // 24-bit
  view.setUint32(34, pixelArraySize, true);

  return buffer;
}

// -----------------------------------------------------------------------------
// VAULT & ALLOCATION MODAL
// -----------------------------------------------------------------------------
async function fetchVaultFiles() {
  try {
    const res = await fetch('/api/files', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderVaultFiles(data.files);
    }
  } catch (err) {
    console.error('Error fetching vault files:', err);
  }
}

function renderVaultFiles(files) {
  const tbody = document.getElementById('vault-files-tbody');
  tbody.innerHTML = '';

  if (files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-8 text-center text-outline">No documents in master vault. Ingest a file via Secure Ingestion.</td></tr>`;
    return;
  }

  files.forEach(f => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-container/50 transition-colors';
    tr.innerHTML = `
      <td class="px-5 py-3">
        <div class="font-medium text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-sm ${f.extension === '.txt' ? 'text-secondary' : 'text-primary'}">
            ${f.extension === '.txt' ? 'description' : 'image'}
          </span>
          <span>${f.originalName}</span>
        </div>
        <div class="text-[10px] text-outline font-mono">Uploaded by ${f.uploadedByName}</div>
      </td>
      <td class="px-5 py-3"><span class="px-2 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px] uppercase">${f.extension}</span></td>
      <td class="px-5 py-3 text-outline">${(f.size / 1024).toFixed(1)} KB</td>
      <td class="px-5 py-3 text-outline font-mono text-[10px] truncate max-w-xs" title="${f.hash}">${f.hash.slice(0, 16)}...</td>
      <td class="px-5 py-3"><span class="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold font-mono">${f.distributionCount || 0} copies</span></td>
      <td class="px-5 py-3 text-right">
        <button onclick="openAllocateModal('${f.id}')"
          class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs inline-flex items-center gap-1 shadow">
          <span class="material-symbols-outlined text-sm">share</span>
          <span>Distribute</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function openAllocateModal(fileId) {
  try {
    const filesRes = await fetch('/api/files', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const filesData = await filesRes.json();
    currentAllocatingFile = filesData.files.find(f => f.id === fileId);

    if (!currentAllocatingFile) return;

    document.getElementById('modal-file-title').innerText = `Document: ${currentAllocatingFile.originalName} (${(currentAllocatingFile.size / 1024).toFixed(1)} KB)`;
    document.getElementById('alloc-error').classList.add('hidden');

    // Fetch agents
    const agentsRes = await fetch('/api/agents', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const agentsData = await agentsRes.json();
    allAgents = agentsData.agents;

    renderModalAgentsList();
    updateModalSelectedCount();

    document.getElementById('modal-allocate').classList.remove('hidden');
  } catch (err) {
    alert('Failed to load agents for distribution');
  }
}

function closeAllocateModal() {
  document.getElementById('modal-allocate').classList.add('hidden');
  currentAllocatingFile = null;
}

function renderModalAgentsList() {
  const container = document.getElementById('alloc-agent-list');
  container.innerHTML = '';

  allAgents.forEach((agent, idx) => {
    const item = document.createElement('label');
    item.className = 'flex items-center justify-between p-2 rounded-lg bg-surface-container hover:bg-surface-container-high cursor-pointer transition-colors border border-outline-variant/30';
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <input type="checkbox" value="${agent.id}" class="alloc-agent-checkbox accent-primary rounded cursor-pointer" onchange="updateModalSelectedCount()"/>
        <div>
          <div class="text-xs font-semibold text-white">${agent.name}</div>
          <div class="text-[10px] text-outline font-mono">${agent.email} • ID: ${agent.studentId}</div>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-[9px] font-mono">${agent.department}</span>
    `;
    container.appendChild(item);
  });
}

function updateModalSelectedCount() {
  const checkboxes = document.querySelectorAll('.alloc-agent-checkbox:checked');
  const count = checkboxes.length;
  const countEl = document.getElementById('alloc-selected-count');
  countEl.innerText = count;

  const errorEl = document.getElementById('alloc-error');
  const errorText = document.getElementById('alloc-error-text');

  if (count > 20) {
    countEl.className = 'text-error font-bold text-sm';
    errorText.innerText = 'Batch distribution limit exceeded: Maximum 20 recipients permitted per allocation cycle. [BVA-02]';
    errorEl.classList.remove('hidden');
  } else {
    countEl.className = 'text-secondary font-bold text-sm';
    errorEl.classList.add('hidden');
  }
}

function selectFirstNAgents(n) {
  const checkboxes = document.querySelectorAll('.alloc-agent-checkbox');
  checkboxes.forEach((cb, idx) => {
    cb.checked = idx < n;
  });
  updateModalSelectedCount();
}

function clearSelectedAgents() {
  const checkboxes = document.querySelectorAll('.alloc-agent-checkbox');
  checkboxes.forEach(cb => cb.checked = false);
  updateModalSelectedCount();
}

async function submitAllocation() {
  const checkboxes = document.querySelectorAll('.alloc-agent-checkbox:checked');
  const selectedAgentIds = Array.from(checkboxes).map(cb => cb.value);
  const validityDays = parseInt(document.getElementById('alloc-days-slider').value, 10);
  const errorEl = document.getElementById('alloc-error');
  const errorText = document.getElementById('alloc-error-text');

  errorEl.classList.add('hidden');

  const btn = document.getElementById('btn-submit-alloc');
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">sync</span><span>Embedding Watermarks...</span>`;

  try {
    const res = await fetch('/api/files/distribute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        fileId: currentAllocatingFile.id,
        agentIds: selectedAgentIds,
        validityDays
      })
    });
    const data = await res.json();

    if (!res.ok) {
      errorText.innerText = data.error || 'Distribution rejected';
      errorEl.classList.remove('hidden');
    } else {
      alert(`Distribution Complete!\nGenerated ${data.allocatedCount} personalized watermarked copies.\nDispatched in ${data.notifications.totalBatches} email batch(es) [NFR-3].`);
      closeAllocateModal();
      fetchVaultFiles();
      refreshTelemetry();
    }
  } catch (err) {
    errorText.innerText = 'Failed to process steganographic distribution';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined text-base">fingerprint</span><span>Generate &amp; Distribute Watermarked Copies</span>`;
  }
}

// -----------------------------------------------------------------------------
// FORENSIC LEAK ATTRIBUTION REPORT (FR-5)
// -----------------------------------------------------------------------------
function renderForensicReport(data) {
  const reportCard = document.getElementById('forensic-report-card');
  reportCard.classList.remove('hidden');

  if (!data.success) {
    reportCard.className = 'bg-error-container/20 border border-error/50 rounded-xl p-6';
    reportCard.innerHTML = `
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-error/20 text-error flex items-center justify-center">
          <span class="material-symbols-outlined text-2xl">error</span>
        </div>
        <div>
          <h3 class="text-base font-bold text-error">Extraction Failed / Tampered Carrier</h3>
          <p class="text-xs text-outline font-mono">STATUS: ${data.status || 'REJECTED'}</p>
        </div>
      </div>
      <p class="text-xs text-on-surface font-mono bg-surface-container p-3 rounded-lg border border-outline-variant/40">
        ${data.error || 'The forensic engine could not extract a verifiable watermark.'}
      </p>
    `;
    return;
  }

  const isPositive = data.status === 'POSITIVE_MATCH';
  const confidence = data.matchConfidence || 0;

  reportCard.className = isPositive
    ? 'bg-success/5 border border-success/40 rounded-xl p-6 shadow-xl'
    : 'bg-warning/5 border border-warning/40 rounded-xl p-6 shadow-xl';

  reportCard.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/40 mb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl ${isPositive ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'} flex items-center justify-center">
          <span class="material-symbols-outlined text-3xl">${isPositive ? 'verified' : 'help'}</span>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white">${isPositive ? 'Positive Attribution Confirmed' : 'Inconclusive Attribution'}</h3>
          <p class="text-xs font-mono ${isPositive ? 'text-success' : 'text-warning'}">${data.message}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-[10px] text-outline font-mono uppercase">Match Confidence</div>
          <div class="text-2xl font-bold font-mono ${confidence >= 80 ? 'text-success' : 'text-warning'}">${confidence.toFixed(1)}%</div>
        </div>
        <div class="w-12 h-12 rounded-full border-4 ${confidence >= 80 ? 'border-success' : 'border-warning'} flex items-center justify-center text-xs font-bold font-mono">
          ${confidence >= 80 ? 'PASS' : 'HOLD'}
        </div>
      </div>
    </div>

    ${data.attributedAgent ? `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mb-4">
      <div class="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1.5">
        <div class="text-outline uppercase text-[10px]">Identified Custodial Recipient</div>
        <div class="text-base font-bold text-white">${data.attributedAgent.name}</div>
        <div class="text-secondary font-mono">${data.attributedAgent.email}</div>
        <div class="text-on-surface-variant">Student / Agent ID: <span class="text-white font-bold">${data.attributedAgent.studentId}</span></div>
        <div class="text-on-surface-variant">Assigned Department: ${data.attributedAgent.department}</div>
      </div>

      <div class="p-4 rounded-xl bg-surface-container border border-outline-variant/40 space-y-1.5">
        <div class="text-outline uppercase text-[10px]">Forensic Footprint Telemetry</div>
        <div class="text-on-surface-variant">Original File: <span class="text-white">${data.attributedAgent.originalFilename || 'Carrier Document'}</span></div>
        <div class="text-on-surface-variant">Allocation Timestamp: <span class="text-white">${new Date(data.attributedAgent.allocatedAt).toLocaleString()}</span></div>
        <div class="text-on-surface-variant truncate">Extracted UUID Token:</div>
        <div class="text-[11px] font-mono text-secondary bg-surface-container-high px-2 py-1 rounded truncate select-all">
          ${data.extractedToken}
        </div>
      </div>
    </div>
    ` : ''}

    <div class="text-[11px] text-outline font-mono flex items-center gap-1.5 mt-2">
      <span class="material-symbols-outlined text-xs">info</span>
      <span>Forensic notice: Finding serves as digital evidence pursuant to organizational data governance policy.</span>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// AUDIT LOGS (FR-4)
// -----------------------------------------------------------------------------
async function fetchAuditLogs() {
  const startDate = document.getElementById('audit-start-date').value;
  const endDate = document.getElementById('audit-end-date').value;
  const actionType = document.getElementById('audit-action-type').value;

  const errorEl = document.getElementById('audit-filter-error');
  const errorText = document.getElementById('audit-filter-error-text');
  errorEl.classList.add('hidden');

  let query = [];
  if (startDate) query.push(`startDate=${encodeURIComponent(startDate)}`);
  if (endDate) query.push(`endDate=${encodeURIComponent(endDate)}`);
  if (actionType) query.push(`actionType=${encodeURIComponent(actionType)}`);

  const url = `/api/audit?${query.join('&')}`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    const data = await res.json();

    if (!res.ok) {
      errorText.innerText = data.error || 'Failed to query audit ledger';
      errorEl.classList.remove('hidden');
      return;
    }

    renderAuditTable(data.logs);
  } catch (err) {
    errorText.innerText = 'Network error fetching audit logs';
    errorEl.classList.remove('hidden');
  }
}

function renderAuditTable(logs) {
  const tbody = document.getElementById('audit-table-tbody');
  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-outline">No logs found matching specified filter.</td></tr>`;
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-container/50 transition-colors';
    tr.innerHTML = `
      <td class="px-4 py-3 text-outline">${new Date(log.timestamp).toLocaleString()}</td>
      <td class="px-4 py-3"><span class="px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono text-[10px]">${log.actionType}</span></td>
      <td class="px-4 py-3 text-white font-medium">${log.actorName} <span class="text-[10px] text-outline font-mono">(${log.actorRole})</span></td>
      <td class="px-4 py-3 text-outline font-mono text-[10px]">${log.ipAddress}</td>
      <td class="px-4 py-3 text-on-surface-variant font-mono text-[11px] truncate max-w-lg" title="${log.details}">${log.details}</td>
    `;
    tbody.appendChild(tr);
  });
}

function resetAuditFilter() {
  document.getElementById('audit-start-date').value = '';
  document.getElementById('audit-end-date').value = '';
  document.getElementById('audit-action-type').value = '';
  fetchAuditLogs();
}

// -----------------------------------------------------------------------------
// AGENTS DIRECTORY
// -----------------------------------------------------------------------------
async function fetchAgentsList() {
  try {
    const res = await fetch('/api/agents', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderAgentsTable(data.agents);
    }
  } catch (err) {
    console.error('Error fetching agents:', err);
  }
}

function renderAgentsTable(agents) {
  const tbody = document.getElementById('agents-table-tbody');
  tbody.innerHTML = '';

  agents.forEach(a => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-container/50 transition-colors';
    tr.innerHTML = `
      <td class="px-5 py-3">
        <div class="font-medium text-white">${a.name}</div>
        <div class="text-[10px] text-outline font-mono">${a.email}</div>
      </td>
      <td class="px-5 py-3 font-mono text-secondary font-bold">${a.studentId}</td>
      <td class="px-5 py-3 text-on-surface-variant">${a.department}</td>
      <td class="px-5 py-3"><span class="px-2 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px]">${a.clearanceLevel}</span></td>
      <td class="px-5 py-3"><span class="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold font-mono">${a.allocatedFilesCount} files</span></td>
      <td class="px-5 py-3">
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${a.active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}">
          <span class="w-1.5 h-1.5 rounded-full ${a.active ? 'bg-success' : 'bg-error'}"></span>
          <span>${a.active ? 'ACTIVE' : 'DISABLED'}</span>
        </span>
      </td>
      <td class="px-5 py-3 text-right">
        <button onclick="toggleAgent('${a.id}')"
          class="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline hover:text-white text-[11px] font-mono transition-colors">
          ${a.active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function toggleAgent(id) {
  try {
    const res = await fetch(`/api/agents/${id}/toggle-status`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      fetchAgentsList();
      refreshTelemetry();
    }
  } catch (err) {
    alert('Failed to toggle agent status');
  }
}

// -----------------------------------------------------------------------------
// AGENT PERSONAL WORKSPACE
// -----------------------------------------------------------------------------
async function fetchMyFiles() {
  try {
    const res = await fetch('/api/files/agent-files', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      renderMyFiles(data.files);
      document.getElementById('badge-agent-files').innerText = data.files.length;
    }
  } catch (err) {
    console.error('Error fetching agent files:', err);
  }
}

function renderMyFiles(files) {
  const tbody = document.getElementById('my-files-tbody');
  tbody.innerHTML = '';

  if (files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-8 text-center text-outline">No documents assigned to your enclave yet.</td></tr>`;
    return;
  }

  files.forEach(f => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-container/50 transition-colors';
    tr.innerHTML = `
      <td class="px-5 py-3 font-medium text-white flex items-center gap-2">
        <span class="material-symbols-outlined text-warning text-sm">lock</span>
        <span>${f.filename}</span>
      </td>
      <td class="px-5 py-3 text-outline">${new Date(f.allocatedAt).toLocaleDateString()}</td>
      <td class="px-5 py-3 font-mono text-xs ${f.isExpired ? 'text-error font-bold' : 'text-primary'}">
        ${new Date(f.expiresAt).toLocaleDateString()} ${f.isExpired ? '(EXPIRED)' : ''}
      </td>
      <td class="px-5 py-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-mono ${f.isExpired ? 'bg-error-container text-error' : 'bg-success/10 text-success'}">
          ${f.isExpired ? 'REVOKED' : 'DOWNLOADABLE'}
        </span>
      </td>
      <td class="px-5 py-3 text-right">
        ${f.isExpired ? `
          <button disabled class="px-3 py-1.5 rounded-lg bg-surface-container text-outline text-xs cursor-not-allowed">
            Expired
          </button>
        ` : `
          <button onclick="downloadAgentFile('${f.allocationId}', '${f.filename}')"
            class="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs inline-flex items-center gap-1 shadow">
            <span class="material-symbols-outlined text-sm">download</span>
            <span>Download</span>
          </button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function downloadAgentFile(allocationId, filename) {
  try {
    const res = await fetch(`/api/files/download/${allocationId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) {
      const data = await res.json();
      alert(`Download Error: ${data.error}`);
      fetchMyFiles();
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    fetchMyFiles();
  } catch (err) {
    alert('Failed to download file');
  }
}

