// background.js

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Optional: Add a listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(async () => { // Make listener async
  console.log('Magix extension installed or updated.');
  // Re-add world configuration for userScripts API
  try {
    if (chrome.userScripts && chrome.userScripts.configureWorld) {
      await chrome.userScripts.configureWorld({ messaging: true });
      console.log('User script world configured successfully.');
    } else {
      console.warn('chrome.userScripts.configureWorld API not available.');
    }
  } catch (error) {
    console.error('Error configuring user script world:', error);
  }
});

// Function to handle USER SCRIPT registration (Simplified for testing)
async function handleUserScriptRegistration(message, sender, sendResponse) {
  // Check for targetUrl and code in the message payload
  if (!message.targetUrl) {
    console.error("REGISTER_USER_SCRIPT: Missing targetUrl in message payload.");
    sendResponse({ success: false, error: "Missing targetUrl in message payload." });
    return;
  }
  if (!message.code) {
    console.error("REGISTER_USER_SCRIPT: Missing script code in message payload.");
    sendResponse({ success: false, error: "Missing script code in message payload." });
    return;
  }

  const targetUrl = message.targetUrl; // Use URL from message
  const newCode = message.code;
  const scriptIdPrefix = "magix-script-"; // Reverted prefix

  // Helper function to create a broad match pattern from a URL
  function getBroadMatchPattern(url) {
    try {
      const urlObj = new URL(url);
      // Handle common cases like www.youtube.com, youtube.com, m.youtube.com
      // Create pattern like *://*.youtube.com/*
      // Allow http/https, any subdomain, the main domain, and any path
      return `*://*.${urlObj.hostname.replace(/^www\./, '')}/*`;
    } catch (e) {
      console.error("Could not parse URL to create broad match pattern:", url, e);
      // Fallback to the specific URL if parsing fails (less ideal)
      return url;
    }
  }

  const broadMatchPattern = getBroadMatchPattern(targetUrl);
  console.log(`Using broad match pattern: ${broadMatchPattern}`);

  try {
    // 1. Get all currently registered user scripts
    const existingScripts = await chrome.userScripts.getScripts();
    const scriptsToUnregister = existingScripts.filter(script => script.id.startsWith(scriptIdPrefix));

    // 2. Unregister any existing scripts with the same prefix
    if (scriptsToUnregister.length > 0) {
      const idsToUnregister = scriptsToUnregister.map(script => script.id);
      console.log(`Unregistering existing Magix scripts: ${idsToUnregister.join(', ')}`);
      await chrome.userScripts.unregister({ ids: idsToUnregister });
      console.log("Existing Magix scripts unregistered.");
    } else {
      console.log("No existing Magix scripts found to unregister.");
    }

    // 3. Register the new USER SCRIPT using the broad pattern
    const newScriptId = `${scriptIdPrefix}${Date.now()}`; // Use original prefix
    console.log(`Registering new Magix user script for pattern ${broadMatchPattern} with ID: ${newScriptId}`);
    await chrome.userScripts.register([{ // Use userScripts API
      id: newScriptId,
      matches: [broadMatchPattern], // Use the broad match pattern
      js: [{ code: newCode }],
      runAt: "document_idle" // Changed from document_start
      // world: "USER_SCRIPT" // Implicit default
    }]);

    console.log(`User script ${newScriptId} registered successfully for pattern ${broadMatchPattern}.`);
    sendResponse({ success: true, scriptId: newScriptId });

  } catch (error) {
    console.error(`Error handling user script registration for pattern ${broadMatchPattern}:`, error);
    sendResponse({ success: false, error: error.message || "Unknown error" });
  }
}


// Listener for messages from content scripts or other parts of the extension
// Make the listener async to handle await calls properly
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  // Handle opening side panel (existing logic)
  if (message.action === "openSidePanel") {
    if (sender.tab) {
      console.log(`Opening side panel for tab ${sender.tab.id}...`);
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ status: "Side panel opening request received." });
    } else {
      console.error("Received openSidePanel message without sender tab information.");
      sendResponse({ status: "Error: Sender tab information missing." });
    }
    // Keep this synchronous if it doesn't involve async operations
    return false;
  }

  // Handle new USER SCRIPT registration
  if (message.type === 'REGISTER_USER_SCRIPT') { // Reverted type check
    // Use the async handler function (reverted name)
    handleUserScriptRegistration(message, sender, sendResponse);
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }

  // Removed injectCSS and injectJS handlers as injection is now done from sidepanel

  // Let other listeners (like sidepanel) handle messages not explicitly targeted here
  return false; // Indicate synchronous processing or no response needed from background

}); // End of onMessage listener


console.log('Magix background service worker started.');
