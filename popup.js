// Smart Search Router - Popup UI Script

// DOM elements
const statusDot = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const statusDetail = document.getElementById('statusDetail');
const activeEngine = document.getElementById('activeEngine');
const lastCheck = document.getElementById('lastCheck');
const checkNowBtn = document.getElementById('checkNowBtn');
const manualOverrideToggle = document.getElementById('manualOverrideToggle');

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
  const { isAccessible, lastCheckTime, manualOverride } = status;

  // Update status dot and label
  if (manualOverride !== null && manualOverride === false) {
    // Manual override to Baidu
    statusDot.className = 'status-dot inaccessible';
    statusLabel.textContent = 'Manual Override Active';
    statusDetail.textContent = 'Forcing Baidu search';
    activeEngine.textContent = 'Baidu (Manual)';
  } else if (isAccessible) {
    statusDot.className = 'status-dot accessible';
    statusLabel.textContent = 'Google Accessible';
    statusDetail.textContent = 'Searches go directly to Google';
    activeEngine.textContent = 'Google';
  } else {
    statusDot.className = 'status-dot inaccessible';
    statusLabel.textContent = 'Google Blocked';
    statusDetail.textContent = 'Searches redirected to Baidu';
    activeEngine.textContent = 'Baidu';
  }

  // Update last check time
  lastCheck.textContent = formatRelativeTime(lastCheckTime);

  // Update manual override toggle
  if (manualOverride !== null) {
    manualOverrideToggle.checked = !manualOverride; // Inverted: checked = force Baidu
  } else {
    manualOverrideToggle.checked = false;
  }
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

    const response = await chrome.runtime.sendMessage({ action: 'checkNow' });

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
 * Initialize popup
 */
function initialize() {
  // Load initial status
  loadStatus();

  // Set up event listeners
  checkNowBtn.addEventListener('click', triggerManualCheck);
  manualOverrideToggle.addEventListener('change', handleManualOverride);

  // Auto-refresh status every 5 seconds while popup is open
  setInterval(loadStatus, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
