// Smart Search Router - Popup UI Script

// DOM elements
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const statusDetail = document.getElementById('statusDetail');
const activeEngine = document.getElementById('activeEngine');
const lastCheck = document.getElementById('lastCheck');
const checkNowBtn = document.getElementById('checkNowBtn');
const manualOverrideToggle = document.getElementById('manualOverrideToggle');
const checkIntervalInput = document.getElementById('checkInterval');
const applySettingsBtn = document.getElementById('applySettingsBtn');
const fallbackEngineSelect = document.getElementById('fallbackEngineSelect');
const overrideToggleText = document.getElementById('overrideToggleText');

const ENGINE_NAMES = { baidu: 'Baidu', bing: 'Bing', '360': '360 Search' };
function engineName(id) { return ENGINE_NAMES[id] ?? 'Baidu'; }

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Never';

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Update UI with current status
 */
function updateUI(status) {
  const { isAccessible, lastCheckTime, manualOverride, fallbackEngine } = status;
  const fbName = engineName(fallbackEngine);

  // Update status dot and label
  if (manualOverride !== null && manualOverride === false) {
    // Manual override to fallback engine
    statusDot.className = 'status-dot inaccessible';
    statusLabel.textContent = 'Manual Override Active';
    statusDetail.textContent = 'Forcing ' + fbName + ' search';
    activeEngine.textContent = fbName + ' (Manual)';
  } else if (isAccessible) {
    statusDot.className = 'status-dot accessible';
    statusLabel.textContent = 'Google Accessible';
    statusDetail.textContent = 'Searches go directly to Google';
    activeEngine.textContent = 'Google';
  } else {
    statusDot.className = 'status-dot inaccessible';
    statusLabel.textContent = 'Google Blocked';
    statusDetail.textContent = 'Searches redirected to ' + fbName;
    activeEngine.textContent = fbName;
  }

  // Update last check time
  lastCheck.textContent = formatRelativeTime(lastCheckTime);

  // Update manual override toggle
  if (manualOverride !== null) {
    manualOverrideToggle.checked = !manualOverride; // Inverted: checked = force fallback engine
  } else {
    manualOverrideToggle.checked = false;
  }

  // Update override toggle label and engine select
  overrideToggleText.textContent = 'Manual Override (Force ' + fbName + ')';
  fallbackEngineSelect.value = fallbackEngine ?? 'baidu';
}

/**
 * Load and display current status
 */
async function loadStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
    updateUI(response);
  } catch (error) {
    console.error('Failed to load status:', error);
    statusLabel.textContent = 'Error';
    statusDetail.textContent = 'Failed to load status';
  }
}

/**
 * Trigger manual check
 */
async function triggerManualCheck() {
  try {
    // Disable button and show loading state
    checkNowBtn.disabled = true;
    checkNowBtn.innerHTML = '<span class="btn-icon">🔄</span>Checking...';

    await chrome.runtime.sendMessage({ action: 'checkNow' });

    // Update UI with new status
    await loadStatus();

    // Show success feedback briefly
    checkNowBtn.innerHTML = '<span class="btn-icon">✓</span>Check Complete';
    setTimeout(() => {
      checkNowBtn.disabled = false;
      checkNowBtn.innerHTML = '<span class="btn-icon">🔄</span>Check Now';
    }, 1500);
  } catch (error) {
    console.error('Failed to trigger check:', error);
    checkNowBtn.disabled = false;
    checkNowBtn.innerHTML = '<span class="btn-icon">✗</span>Check Failed';
    setTimeout(() => {
      checkNowBtn.innerHTML = '<span class="btn-icon">🔄</span>Check Now';
    }, 2000);
  }
}

/**
 * Handle manual override toggle
 */
async function handleManualOverride() {
  try {
    const isChecked = manualOverrideToggle.checked;
    const override = isChecked ? false : null; // Checked = force Baidu (false), Unchecked = auto (null)

    await chrome.runtime.sendMessage({
      action: 'setManualOverride',
      override: override
    });

    // Reload status to show updated state
    await loadStatus();
  } catch (error) {
    console.error('Failed to set manual override:', error);
    // Revert toggle state
    manualOverrideToggle.checked = !manualOverrideToggle.checked;
  }
}

/**
 * Load and display the current check interval
 */
async function loadCheckInterval() {
  const result = await chrome.storage.local.get('checkInterval');
  checkIntervalInput.value = result.checkInterval ?? 60;
}

/**
 * Apply all settings at once
 */
async function applySettings() {
  const interval = Math.max(60, parseInt(checkIntervalInput.value) || 60);
  checkIntervalInput.value = interval;
  try {
    applySettingsBtn.textContent = '...';
    applySettingsBtn.disabled = true;
    await chrome.runtime.sendMessage({ action: 'setFallbackEngine', engineId: fallbackEngineSelect.value });
    await chrome.runtime.sendMessage({ action: 'setCheckInterval', interval });
    console.log('Settings applied:', { fallbackEngine: fallbackEngineSelect.value, checkInterval: interval });
    await loadStatus();
    applySettingsBtn.textContent = '✓ Applied';
    setTimeout(() => {
      applySettingsBtn.textContent = 'Apply';
      applySettingsBtn.disabled = false;
    }, 1500);
  } catch (error) {
    console.error('Failed to apply settings:', error);
    applySettingsBtn.textContent = 'Apply';
    applySettingsBtn.disabled = false;
  }
}

/**
 * Initialize popup
 */
function initialize() {
  // Load initial status and settings
  loadStatus();
  loadCheckInterval();

  // Set up tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // Set up event listeners
  checkNowBtn.addEventListener('click', triggerManualCheck);
  manualOverrideToggle.addEventListener('change', handleManualOverride);
  applySettingsBtn.addEventListener('click', applySettings);

  // Auto-refresh status every 5 seconds while popup is open
  setInterval(loadStatus, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
