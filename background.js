// Smart Search Router - Background Service Worker
// Automatically routes searches to Baidu when Google is inaccessible

const GOOGLE_CHECK_URL = 'https://www.google.com/generate_204';
const CHECK_TIMEOUT = 3000; // 3 seconds
const DEFAULT_CHECK_INTERVAL = 60; // seconds
const REDIRECT_RULE_ID = 1;

// Storage keys
const STORAGE_KEYS = {
  GOOGLE_ACCESSIBLE: 'googleAccessible',
  LAST_CHECK_TIME: 'lastCheckTime',
  MANUAL_OVERRIDE: 'manualOverride',
  CHECK_INTERVAL: 'checkInterval',
  FALLBACK_ENGINE: 'fallbackEngine'
};

const FALLBACK_ENGINES = {
  baidu: { name: 'Baidu', url: 'https://www.baidu.com/s?wd=\\1' },
  bing:  { name: 'Bing',  url: 'https://www.bing.com/search?q=\\1' },
  '360': { name: '360 Search', url: 'https://www.so.com/s?q=\\1' }
};

/**
 * Check if Google is accessible
 * Uses fetch with AbortController for timeout
 */
async function checkGoogleAccessibility() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

  try {
    const response = await fetch(GOOGLE_CHECK_URL, {
      signal: controller.signal,
      mode: 'no-cors', // Avoid CORS issues
      cache: 'no-store' // Always get fresh results
    });
    clearTimeout(timeoutId);

    console.log('[Smart Search Router] Google accessibility check: ACCESSIBLE');
    return true;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.log('[Smart Search Router] Google accessibility check: TIMEOUT (inaccessible)');
    } else {
      console.log('[Smart Search Router] Google accessibility check: ERROR (inaccessible)', error.message);
    }
    return false;
  }
}

/**
 * Update cached accessibility status
 */
async function updateAccessibilityCache(isAccessible) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.GOOGLE_ACCESSIBLE]: isAccessible,
    [STORAGE_KEYS.LAST_CHECK_TIME]: Date.now()
  });
  console.log(`[Smart Search Router] Cache updated: Google is ${isAccessible ? 'accessible' : 'inaccessible'}`);
}

/**
 * Get cached accessibility status
 */
async function getCachedAccessibility() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.GOOGLE_ACCESSIBLE,
    STORAGE_KEYS.LAST_CHECK_TIME,
    STORAGE_KEYS.MANUAL_OVERRIDE
  ]);

  return {
    isAccessible: result[STORAGE_KEYS.GOOGLE_ACCESSIBLE] ?? true, // Default to true
    lastCheckTime: result[STORAGE_KEYS.LAST_CHECK_TIME] ?? 0,
    manualOverride: result[STORAGE_KEYS.MANUAL_OVERRIDE] ?? null
  };
}

/**
 * Get configured check interval from storage
 */
async function getCheckInterval() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CHECK_INTERVAL);
  return result[STORAGE_KEYS.CHECK_INTERVAL] ?? DEFAULT_CHECK_INTERVAL;
}

/**
 * (Re)schedule the periodic alarm with the given interval in seconds
 */
async function scheduleCheck(intervalSeconds) {
  await chrome.alarms.clear('googleAccessibilityCheck');
  chrome.alarms.create('googleAccessibilityCheck', {
    periodInMinutes: intervalSeconds / 60
  });
  console.log(`[Smart Search Router] Check scheduled every ${intervalSeconds}s`);
}

/**
 * Add redirect rule to route custom search engine to Google
 */
async function addGoogleRedirectRule() {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REDIRECT_RULE_ID],
      addRules: [
        {
          id: REDIRECT_RULE_ID,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              regexSubstitution: 'https://www.google.com/search?q=\\1'
            }
          },
          condition: {
            regexFilter: '^[^:]+://smartsearch\\.local/.*[?&]q=([^&]*)',
            resourceTypes: ['main_frame']
          }
        }
      ]
    });
    console.log('[Smart Search Router] Redirect rule ADDED: SmartSearch → Google');
  } catch (error) {
    console.error('[Smart Search Router] Failed to add redirect rule:', error);
  }
}

/**
 * Add redirect rule to route custom search engine to the configured fallback engine
 */
async function addFallbackRedirectRule(engineId) {
  const engine = FALLBACK_ENGINES[engineId] ?? FALLBACK_ENGINES.baidu;
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REDIRECT_RULE_ID],
      addRules: [
        {
          id: REDIRECT_RULE_ID,
          priority: 1,
          action: {
            type: 'redirect',
            redirect: {
              regexSubstitution: engine.url
            }
          },
          condition: {
            regexFilter: '^[^:]+://smartsearch\\.local/.*[?&]q=([^&]*)',
            resourceTypes: ['main_frame']
          }
        }
      ]
    });
    console.log(`[Smart Search Router] Redirect rule ADDED: SmartSearch → ${engine.name}`);
  } catch (error) {
    console.error('[Smart Search Router] Failed to add redirect rule:', error);
  }
}

/**
 * Update redirect rules based on accessibility
 */
async function updateRedirectRules(isAccessible) {
  const result = await chrome.storage.local.get([STORAGE_KEYS.MANUAL_OVERRIDE, STORAGE_KEYS.FALLBACK_ENGINE]);
  const manualOverride = result[STORAGE_KEYS.MANUAL_OVERRIDE] ?? null;
  const engineId = result[STORAGE_KEYS.FALLBACK_ENGINE] ?? 'baidu';

  // Manual override takes precedence
  if (manualOverride !== null) {
    if (manualOverride) {
      await addGoogleRedirectRule();
    } else {
      await addFallbackRedirectRule(engineId);
    }
    return;
  }

  // Automatic mode
  if (isAccessible) {
    await addGoogleRedirectRule();
  } else {
    await addFallbackRedirectRule(engineId);
  }
}

/**
 * Perform accessibility check and update rules
 */
async function performCheck() {
  console.log('[Smart Search Router] Performing accessibility check...');

  const isAccessible = await checkGoogleAccessibility();
  await updateAccessibilityCache(isAccessible);
  await updateRedirectRules(isAccessible);

  return isAccessible;
}

/**
 * Initialize extension
 */
async function initialize() {
  console.log('[Smart Search Router] Initializing...');

  // Perform initial check
  await performCheck();

  // Set up periodic checks using alarms API (more reliable for service workers)
  const interval = await getCheckInterval();
  await scheduleCheck(interval);

  console.log('[Smart Search Router] Initialized successfully');
}

/**
 * Listen for alarm to perform periodic checks
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'googleAccessibilityCheck') {
    performCheck();
  }
});

/**
 * Listen for messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkNow') {
    // Manual check triggered from popup
    performCheck().then((isAccessible) => {
      sendResponse({ success: true, isAccessible });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'getStatus') {
    // Get current status
    getCachedAccessibility().then(async (status) => {
      const result = await chrome.storage.local.get(STORAGE_KEYS.FALLBACK_ENGINE);
      status.fallbackEngine = result[STORAGE_KEYS.FALLBACK_ENGINE] ?? 'baidu';
      sendResponse(status);
    });
    return true;
  }

  if (message.action === 'setManualOverride') {
    // Set manual override
    chrome.storage.local.set({
      [STORAGE_KEYS.MANUAL_OVERRIDE]: message.override
    }).then(() => {
      return performCheck();
    }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'setCheckInterval') {
    const interval = Math.max(60, parseInt(message.interval));
    chrome.storage.local.set({ [STORAGE_KEYS.CHECK_INTERVAL]: interval })
      .then(() => scheduleCheck(interval))
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === 'setFallbackEngine') {
    chrome.storage.local.set({ [STORAGE_KEYS.FALLBACK_ENGINE]: message.engineId })
      .then(() => performCheck())
      .then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.action === 'revalidate') {
    // Quick revalidation when user reports failure
    console.log('[Smart Search Router] Revalidation requested');
    performCheck().then((isAccessible) => {
      sendResponse({ success: true, isAccessible });
    });
    return true;
  }
});

/**
 * Listen for web navigation events to detect failed searches
 * This helps implement quick reversion when cache is wrong
 */
chrome.webNavigation.onErrorOccurred.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame

  // Check if this was a search that got redirected to Google but failed
  if (details.url.includes('google.com/search')) {
    console.log('[Smart Search Router] Google search failed, revalidating...');
    performCheck();
  }
});

/**
 * Initialize on installation
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Smart Search Router] Extension installed');
    initialize();
  } else if (details.reason === 'update') {
    console.log('[Smart Search Router] Extension updated');
    initialize();
  }
});

/**
 * Initialize on startup
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[Smart Search Router] Browser started');
  initialize();
});

// Initialize immediately when service worker loads
initialize();
