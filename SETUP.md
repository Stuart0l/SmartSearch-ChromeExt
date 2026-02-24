# Setup Instructions - Smart Search Router

This guide will help you set up the Smart Search Router extension with a custom search engine.

## Overview

The extension works by intercepting searches made through a **custom search engine** you configure in Chrome. When you're not using this custom search engine (e.g., when using Google directly), the extension remains inactive.

## Step-by-Step Setup

### Step 1: Install the Extension

1. **Generate Icons** (if not already done):
   - Open `generate-icons.html` in your browser
   - Download all three icon sizes (icon16.png, icon48.png, icon128.png)
   - Save them in the `icons/` directory

2. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `smart_search_ext` directory
   - The extension should now appear in your extensions list

3. **Grant Permissions**:
   - Click "Allow" when prompted for permissions
   - The extension needs access to `smartsearch.local` and Google's connectivity check endpoint

### Step 2: Approve the Search Engine (Automatic!)

The extension **automatically adds** the "Smart Search" search engine to Chrome when you install it!

1. **After installing the extension**, Chrome may show a notification asking you to approve adding the new search engine
   - Click **"Add"** or **"Keep it"** to approve

2. **Verify it was added**:
   - Go to Chrome Settings → Search engine → Manage search engines
   - Look for **"Smart Search"** in the list (should have keyword `ss`)
   - It should already be configured with URL: `http://smartsearch.local/?q=%s`

**No manual configuration needed!** The extension handles this automatically.

### Step 3: Set Smart Search as Default (Optional)

You have two options:

#### Option A: Use as Default Search Engine
1. In the **Search engines** section of Chrome settings
2. Find "Smart Search" in the list
3. Click the three dots (⋮) next to it
4. Select **Make default**
5. Now all address bar searches will use Smart Search (with automatic Google/Baidu routing)

#### Option B: Use Only When Needed
1. Keep Google (or your preferred engine) as default
2. When you want smart routing:
   - Type `ss` in the address bar
   - Press **Space** or **Tab**
   - You'll see "Search Smart Search"
   - Type your query and press **Enter**

### Step 4: Verify Setup

1. **Check Extension Status**:
   - Click the Smart Search Router extension icon in Chrome toolbar
   - You should see the current Google accessibility status
   - The popup will show whether Google is accessible or blocked

2. **Test the Search**:
   - If you set Smart Search as default: Type a query in the address bar and press Enter
   - If using keyword trigger: Type `ss [space] your query` and press Enter
   - The extension will automatically route to Google or Baidu based on accessibility

3. **Watch for Redirection**:
   - When Google is accessible: You'll be redirected to Google search results
   - When Google is blocked: You'll be redirected to Baidu search results

## How It Works

```
User types search query
        ↓
Chrome navigates to: http://smartsearch.local/?q=QUERY
        ↓
Extension intercepts the request
        ↓
Extension checks: Is Google accessible?
        ↓
   ┌────┴────┐
   ↓         ↓
  YES       NO
   ↓         ↓
Google    Baidu
search    search
```

## Customization Options

### Change Search Engine Name
You can use any name you like instead of "Smart Search":
- "Adaptive Search"
- "Auto Search"
- "China Search"
- Or any other name you prefer

### Change Shortcut Keyword
The shortcut `ss` can be changed to anything:
- `smart`
- `auto`
- `s`
- Any keyword you find convenient

### Manual Override
Use the extension popup to manually force Baidu searches even when Google is accessible:
1. Click the extension icon
2. Toggle "Manual Override (Force Baidu)"
3. All Smart Search queries will go to Baidu until you toggle it off

## Troubleshooting

### Search Engine Not Added Automatically

If "Smart Search" doesn't appear in your search engines list:

**Option 1 - Manual Add**:
1. Go to Chrome Settings → Search engine → Manage search engines
2. Click **Add** in the "Site search" section
3. Fill in:
   - Search engine: `Smart Search`
   - Keyword: `ss`
   - URL: `http://smartsearch.local/?q=%s`
4. Click **Add**

**Option 2 - Reload Extension**:
1. Go to `chrome://extensions/`
2. Find "Smart Search Router"
3. Click the reload icon (🔄)
4. Chrome should prompt you to add the search engine again

### "This site can't be reached - smartsearch.local" Error

If you see this error, it means:
- The extension is not loaded, OR
- The extension doesn't have permission for smartsearch.local

**Solution**:
1. Go to `chrome://extensions/`
2. Find "Smart Search Router"
3. Ensure it's **Enabled** (toggle on)
4. Click **Details**
5. Scroll to **Site access**
6. Ensure it has access to `smartsearch.local`
7. Reload the extension (click the refresh icon)

### Search Not Redirecting

**Check these items**:

1. ✓ Extension is installed and enabled
2. ✓ Custom search engine URL is exactly: `http://smartsearch.local/?q=%s`
3. ✓ You're actually using the "Smart Search" engine (check address bar shows "Smart Search")
4. ✓ Extension has necessary permissions

**Debug steps**:
1. Click extension icon to check status
2. Click "Check Now" to manually verify Google accessibility
3. Open extension service worker console:
   - Go to `chrome://extensions/`
   - Click "Inspect views: service worker" under Smart Search Router
   - Check console for error messages

### Extension Shows Wrong Status

If the extension incorrectly reports Google as accessible/inaccessible:

1. Click the extension icon
2. Click "Check Now" to force a manual check
3. If still wrong, you can use Manual Override toggle

## Privacy & Permissions

### What the Extension Can Access:

- **smartsearch.local**: The special domain used for intercepting searches
- **www.google.com/generate_204**: Only for connectivity testing (no search data)
- **Local storage**: To cache accessibility status

### What the Extension Does NOT Do:

- ❌ Does NOT track your searches
- ❌ Does NOT send data to external servers
- ❌ Does NOT modify Google or Baidu search results
- ❌ Does NOT run when using other search engines directly
- ❌ Does NOT intercept Google searches unless you use Smart Search

## Uninstalling

If you want to remove the extension:

1. **Remove the Custom Search Engine**:
   - Go to Chrome Settings → Search engine → Manage search engines
   - Find "Smart Search"
   - Click three dots (⋮) → Remove from list

2. **Uninstall the Extension**:
   - Go to `chrome://extensions/`
   - Find "Smart Search Router"
   - Click **Remove**

## Advanced Configuration

### Adjust Check Frequency

Edit `background.js` line 6:
```javascript
const CHECK_INTERVAL = 60; // Change to desired seconds
```

Values:
- 30 = Check every 30 seconds (more responsive, uses more resources)
- 60 = Check every minute (default, good balance)
- 300 = Check every 5 minutes (less responsive, saves resources)

### Adjust Timeout

Edit `background.js` line 5:
```javascript
const CHECK_TIMEOUT = 3000; // Change to desired milliseconds
```

Values:
- 2000 = 2 seconds (faster checks, may miss slow connections)
- 3000 = 3 seconds (default)
- 5000 = 5 seconds (more tolerant of slow networks)

### Use Different Check Endpoint

Edit `background.js` line 4:
```javascript
const GOOGLE_CHECK_URL = 'https://www.google.com/generate_204';
```

Alternatives:
- `'https://www.google.cn/generate_204'` - Check Google China specifically
- `'https://www.google.com/'` - Check main page (slower)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs in the service worker inspector
3. Verify all setup steps were completed correctly
4. Check that Chrome version is up to date (Manifest V3 required)

## Summary

✅ Install extension and generate icons
✅ Add custom search engine with URL: `http://smartsearch.local/?q=%s`
✅ Optionally set as default or use with `ss` keyword
✅ Extension automatically routes to Google or Baidu
✅ Monitor status via extension popup

Enjoy seamless searching! 🚀
