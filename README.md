# Smart Search Router

A Chrome extension that automatically routes your searches to Baidu when Google is inaccessible (e.g., in China). Works through a **custom search engine** that you configure in Chrome, so it only activates when you choose to use it.

## Features

- **Opt-in Design**: Only works when you use the custom "Smart Search" engine
- **Automatic Detection**: Periodically checks if Google is accessible
- **Smart Caching**: Caches accessibility status for fast performance
- **Dynamic Routing**: Automatically routes to Google or Baidu based on accessibility
- **Quick Revalidation**: Detects when cached status is wrong and quickly updates
- **Manual Override**: Option to force Baidu searches even when Google is accessible
- **Real-time Status**: Browser popup shows current accessibility status
- **No Interference**: Doesn't affect normal Google searches when not using Smart Search

## How It Works

1. You add a custom search engine to Chrome named "Smart Search" (URL: `https://smartsearch.local/?q=%s`)
2. Extension checks Google accessibility every 60 seconds in the background
3. When you use Smart Search (either as default or via keyword), the extension intercepts the request
4. Based on Google's accessibility, it routes your search to Google or Baidu
5. When using Google directly (not through Smart Search), the extension doesn't interfere

## Installation

### Quick Start

**See [SETUP.md](SETUP.md) for detailed step-by-step instructions with screenshots.**

### Summary

1. **Install Extension**:
   - Generate icons using `generate-icons.html`
   - Load extension via `chrome://extensions/` → Load unpacked

2. **Add Search Engine** (one-time manual step):
   - Go to `chrome://settings/searchEngines` → **Add** under "Site search"
   - Name: `Smart Search`, Keyword: `ss`, URL: `https://smartsearch.local/?q=%s`

3. **Use Smart Search**:
   - Set as default search engine, OR
   - Type `ss [space] query` in address bar

That's it! The extension will now automatically route to Google or Baidu based on accessibility.

## Usage

### Option 1: Set as Default Search Engine

1. Make "Smart Search" your default search engine in Chrome settings
2. Type any query in the address bar and press Enter
3. Extension automatically routes to Google (if accessible) or Baidu (if blocked)

### Option 2: Use with Keyword Trigger

1. Keep your current default search engine
2. When you want smart routing, type: `ss [space] your query`
3. Press Enter - extension handles the routing

### Manual Override

1. Click the extension icon in Chrome toolbar
2. Toggle "Manual Override (Force Baidu)" to force all Smart Search queries to Baidu
3. Toggle off to return to automatic mode

### Check Status

Click the extension icon to view:
- Current Google accessibility status
- Active search engine (Google or Baidu)
- Last check time
- Manual check button

## Technical Details

### Architecture

- **Manifest V3**: Uses the latest Chrome extension manifest version
- **Service Worker**: Background script that runs efficiently without keeping persistent background page
- **declarativeNetRequest API**: Modern Chrome API for request interception and redirection
- **chrome.storage API**: Persistent storage for caching accessibility status

### Accessibility Detection

The extension uses the following method to detect Google accessibility:

```javascript
fetch('https://www.google.com/generate_204', {
  mode: 'no-cors',
  cache: 'no-store',
  timeout: 3000ms
})
```

- Timeout of 3 seconds
- Uses Google's dedicated connectivity check endpoint
- Non-blocking and lightweight

### Redirect Logic

The extension intercepts requests to the custom search engine URL and redirects based on Google accessibility:

**When Google is accessible:**
```
https://smartsearch.local/?q=QUERY
  ↓
https://www.google.com/search?q=QUERY
```

**When Google is blocked:**
```
https://smartsearch.local/?q=QUERY
  ↓
https://www.baidu.com/s?wd=QUERY
```

The redirect rule updates automatically when Google's accessibility status changes.

### Caching Strategy

- **Cache Duration**: 60 seconds
- **Cache Keys**:
  - `googleAccessible`: Boolean indicating accessibility
  - `lastCheckTime`: Timestamp of last check
  - `manualOverride`: User's manual override setting
- **Revalidation**: Triggered on navigation errors to Google

## File Structure

```
chrome_ext/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (core logic)
├── popup.html            # Browser action popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Permissions Explained

The extension requires the following permissions:

- **declarativeNetRequest**: To intercept and redirect search requests
- **declarativeNetRequestWithHostAccess**: To modify requests to specific hosts
- **storage**: To cache accessibility status
- **alarms**: To schedule periodic accessibility checks
- **webNavigation**: To detect failed navigation for quick revalidation
- **host_permissions**:
  - `*://smartsearch.local/*` - To intercept the custom search engine URL
  - `https://www.google.com/generate_204` - Only for connectivity testing (no search data accessed)

## Limitations

1. **Visible Redirect**: Users will see a brief redirect from `smartsearch.local` to Google/Baidu
2. **Requires Custom Search Engine**: Must manually add and configure the custom search engine in Chrome
3. **Only Works with Smart Search**: Doesn't intercept direct Google searches (by design)
4. **Manual Setup**: Requires following setup instructions - not a one-click install

## Troubleshooting

### "This site can't be reached - smartsearch.local"

This means the extension is not loaded or doesn't have permissions:

1. Go to `chrome://extensions/`
2. Ensure "Smart Search Router" is enabled
3. Click "Inspect views: service worker" to check for errors
4. Reload the extension

### Extension Not Redirecting

1. **Verify Custom Search Engine**:
   - Go to Chrome Settings → Search engine → Manage search engines
   - Confirm URL is exactly: `https://smartsearch.local/?q=%s`
   - Check that you're using "Smart Search" (shown in address bar)

2. **Check Extension Status**:
   - Click extension icon to see current status
   - Use "Check Now" to force revalidation

3. **Check Icons**: Ensure icon files exist in `icons/` directory

### Wrong Search Engine

If searches go to the wrong engine:

- Click extension icon → "Check Now" to update status
- Use "Manual Override" toggle if automatic detection is unreliable
- Adjust `CHECK_TIMEOUT` in `background.js` line 5 (increase for slow networks)

For detailed troubleshooting, see [SETUP.md](SETUP.md#troubleshooting)

## Privacy

This extension:
- **Does NOT** collect or transmit any personal data
- **Does NOT** track your searches
- **Does NOT** communicate with external servers (except for Google accessibility check)
- All data is stored locally on your device
- Source code is fully transparent and auditable

## Development

### Modify Check Interval

Edit `background.js` line 6:
```javascript
const CHECK_INTERVAL = 60; // Change to desired seconds
```

### Modify Timeout

Edit `background.js` line 5:
```javascript
const CHECK_TIMEOUT = 3000; // Change to desired milliseconds
```

### Add More Search Engines

You can extend the extension to support additional search engines by:
1. Adding host permissions in `manifest.json`
2. Creating additional redirect rules in `background.js`
3. Updating the UI in `popup.html` to show more options

### Debug Mode

Open the service worker console:
1. Go to `chrome://extensions/`
2. Find "Smart Search Router"
3. Click "Inspect views: service worker"
4. View console logs prefixed with `[Smart Search Router]`

## Contributing

Contributions are welcome! Areas for improvement:
- Better icon design
- Support for more search engines (Bing, DuckDuckGo, etc.)
- Geo-location based automatic configuration
- User-configurable check intervals
- Advanced caching strategies
- Analytics and reporting

## License

This extension is provided as-is for personal use. Feel free to modify and distribute.

## Version History

### v1.0.0 (Initial Release)
- Automatic Google accessibility detection
- Dynamic redirect to Baidu when Google is blocked
- Browser popup with status and controls
- Manual override option
- Smart caching with 60-second intervals
- Quick revalidation on failures

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify all files are present and icons are created
4. Ensure you're using a recent version of Chrome

## Acknowledgments

Built with Chrome's Manifest V3 APIs:
- declarativeNetRequest for modern request handling
- Service Workers for efficient background processing
- Storage API for persistent caching
