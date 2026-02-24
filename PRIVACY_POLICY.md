# Privacy Policy — Smart Search Router

**Last updated: 2026-02-24**

## Overview

Smart Search Router is a Chrome extension that automatically routes your search queries to Google or Baidu based on real-time network accessibility. This policy explains what data the extension accesses and how it is used.

## Data Collection

**Smart Search Router does not collect, transmit, or store any personal data.**

- No personal information is collected.
- No search queries are logged or sent to any external server.
- No browsing history is recorded.
- No analytics or telemetry data is gathered.

## Local Storage

The extension uses Chrome's `storage` API exclusively to cache the result of the most recent network connectivity check (whether Google was accessible at the time of the last check). This cached value:

- Never leaves your device.
- Contains no personal information — only a boolean result and a timestamp.
- Is used solely to avoid redundant network requests between checks.

## Network Requests

The extension makes a single periodic HTTP request to:

```
https://www.google.com/generate_204
```

This is a standard Google connectivity probe endpoint that returns an empty 204 response. The request contains no user data and is used only to determine whether Google's network is reachable from your device.

No other network requests are made by this extension.

## Permissions

The extension requests the following permissions, all of which are used exclusively for local operation:

| Permission | Purpose |
|---|---|
| `declarativeNetRequest` | Redirect search queries between Google and Baidu |
| `declarativeNetRequestWithHostAccess` | Apply redirect rules to the custom search endpoint |
| `storage` | Cache connectivity check results locally |
| `alarms` | Schedule periodic connectivity checks |
| `webNavigation` | Detect when a search is initiated |

## Third-Party Services

The extension interacts with:

- **Google** (`www.google.com`) — as a connectivity probe target and as a potential search destination.
- **Baidu** (`www.baidu.com`) — as a fallback search destination when Google is inaccessible.

Neither Google nor Baidu receives any data from this extension beyond a standard search query you have already chosen to submit.

## Changes to This Policy

If this policy changes, the updated version will be committed to the public repository at:

https://github.com/Stuart0l/SmartSearch-ChromeExt

## Contact

For questions about this policy, open an issue at:

https://github.com/Stuart0l/SmartSearch-ChromeExt/issues
