// background.js - Magix Extension Service Worker

// Extension metadata
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
const EXTENSION_NAME = 'Magix';

console.log(`${EXTENSION_NAME} v${EXTENSION_VERSION} service worker initializing...`);

// Error logging utility
function logError(context, error, additionalInfo = {}) {
  const errorDetails = {
    context,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    version: EXTENSION_VERSION,
    ...additionalInfo
  };
  console.error(`[${EXTENSION_NAME}] Error in ${context}:`, errorDetails);
  return errorDetails;
}

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  try {
    if (!tab?.windowId) {
      throw new Error('Invalid tab or windowId');
    }
    chrome.sidePanel.open({ windowId: tab.windowId });
    console.log(`Side panel opened for tab ${tab.id}`);
  } catch (error) {
    logError('action.onClicked', error, { tabId: tab?.id });
  }
});

// Installation and update handler
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    const { reason, previousVersion } = details;
    
    if (reason === 'install') {
      console.log(`${EXTENSION_NAME} v${EXTENSION_VERSION} installed successfully!`);
    } else if (reason === 'update') {
      console.log(`${EXTENSION_NAME} updated from v${previousVersion} to v${EXTENSION_VERSION}`);
    }
    
    // Configure userScripts API world
    if (chrome.userScripts && chrome.userScripts.configureWorld) {
      await chrome.userScripts.configureWorld({ messaging: true });
      console.log('User script world configured successfully with messaging enabled.');
    } else {
      console.warn('chrome.userScripts.configureWorld API not available. This extension requires Chrome 138+ or Developer Mode.');
    }
  } catch (error) {
    logError('runtime.onInstalled', error, { 
      reason: details.reason, 
      previousVersion: details.previousVersion 
    });
  }
});

// Recommended function to check UserScripts API availability
function isUserScriptsAvailable() {
  try {
    // Method call which throws if API permission or toggle is not enabled.
    chrome.userScripts.getScripts();
    return true;
  } catch {
    // Not available.
    return false;
  }
}

// Function to handle USER SCRIPT registration using the database scriptId
async function handleUserScriptRegistration(message, sender, sendResponse) {
  // Check for scriptId, targetUrl, and code in the message payload
  if (!message.scriptId) {
    console.error("REGISTER_USER_SCRIPT: Missing scriptId (database UUID) in message payload.");
    sendResponse({ success: false, error: "Missing scriptId in message payload." });
    return;
  }
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

  const scriptId = message.scriptId; // Use the database UUID as the script ID
  const targetUrl = message.targetUrl;
  const newCode = message.code;

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
  // console.log(`Using broad match pattern: ${broadMatchPattern}`);

  // Check if the userScripts API is available using the recommended method
  if (!isUserScriptsAvailable()) {
    console.error("UserScripts API is not available - user needs to enable required toggle.");
    
    // Provide user-friendly guidance based on Chrome version
    let version = Number(navigator.userAgent.match(/(Chrome|Chromium)\/([0-9]+)/)?.[2]);
    let errorMessage = "UserScripts API not available. ";
    
    if (version >= 138) {
      errorMessage += "Please enable 'Allow User Scripts' toggle:\n1. Go to chrome://extensions\n2. Click 'Details' on Magix extension\n3. Enable 'Allow User Scripts' toggle";
    } else {
      errorMessage += "Please enable Developer Mode:\n1. Go to chrome://extensions\n2. Enable 'Developer Mode' toggle in top right";
    }
    
    sendResponse({ success: false, error: errorMessage });
    return;
  }

  try {
    // 1. Attempt to unregister any existing script with the *same database ID* first.
    // This handles updates/overwrites correctly.
    try {
      // console.log(`Attempting to unregister existing script with ID: ${scriptId} before registering.`);
      await chrome.userScripts.unregister({ ids: [scriptId] });
      // console.log(`Successfully unregistered script ${scriptId} (if it existed).`);
    } catch (unregisterError) {
      // Ignore "Nonexistent script ID" errors, as this just means the script wasn't registered before.
      // Log other potential errors during unregistration.
      if (unregisterError.message && unregisterError.message.includes("Nonexistent script ID")) {
        // console.log(`Script ${scriptId} not found during pre-registration unregister check (this is expected for new scripts). Proceeding to register.`);
      } else {
        // Log and rethrow unexpected errors during unregistration attempt
        console.error(`Unexpected error during pre-registration unregister attempt for ${scriptId}:`, unregisterError);
        throw new Error(`Failed to unregister existing script ${scriptId}: ${unregisterError.message}`);
      }
    }

    // 2. Register the new script using the database ID
    // console.log(`Registering user script for pattern ${broadMatchPattern} with database ID: ${scriptId}`);
    await chrome.userScripts.register([{
      id: scriptId, // Use the database UUID
      matches: [broadMatchPattern],
      js: [{ code: newCode }],
      runAt: "document_idle"
    }]);

    // console.log(`User script ${scriptId} registered successfully for pattern ${broadMatchPattern}.`);
    sendResponse({ success: true }); // No need to send back ID, sidepanel already has it

  } catch (error) {
    console.error(`Error handling user script registration for ID ${scriptId}, pattern ${broadMatchPattern}:`, error);
    sendResponse({ success: false, error: error.message || "Unknown registration error" });
  }
}


// Listener for messages from content scripts or other parts of the extension
// Make the listener async to handle await calls properly
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('Background script received message:', message);

  // Handle opening side panel (existing logic)
  if (message.action === "openSidePanel") {
    if (sender.tab) {
      // console.log(`Opening side panel for tab ${sender.tab.id}...`);
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

  // Handle UserScripts availability check
  if (message.type === 'CHECK_USER_SCRIPTS_AVAILABILITY') {
    const isAvailable = isUserScriptsAvailable();
    
    if (!isAvailable) {
      // Provide user-friendly guidance based on Chrome version
      let version = Number(navigator.userAgent.match(/(Chrome|Chromium)\/([0-9]+)/)?.[2]);
      let errorMessage = "UserScripts API not available. ";
      
      if (version >= 138) {
        errorMessage += "Please enable 'Allow User Scripts' toggle:\n1. Go to chrome://extensions\n2. Click 'Details' on Magix extension\n3. Enable 'Allow User Scripts' toggle";
      } else {
        errorMessage += "Please enable Developer Mode:\n1. Go to chrome://extensions\n2. Enable 'Developer Mode' toggle in top right";
      }
      
      sendResponse({ 
        available: false, 
        error: errorMessage,
        guidance: errorMessage 
      });
    } else {
      sendResponse({ available: true });
    }
    
    return false; // Synchronous response
  }

  // Handle removing script effect (JS or CSS)
  if (message.type === 'REMOVE_SCRIPT_EFFECT') {
    const { scriptId, scriptCode } = message;
    // console.log(`Received request to remove effect for script ID: ${scriptId}`);

    // Basic check to determine type (improve as needed)
    const isJs = scriptCode && ['function', 'const', 'let', 'var', 'document', 'window', '=>'].some(k => scriptCode.includes(k));

    if (isJs) {
      // Attempt to unregister the user script
      // IMPORTANT CAVEAT: The current registration logic (handleUserScriptRegistration)
      // Since registration now uses the database scriptId, we can directly attempt unregistration.
      (async () => { // Wrap in async IIFE to use await
        try {
          // Check if userScripts API is available before attempting to use it
          if (isUserScriptsAvailable()) {
             // console.log(`Attempting to unregister JS script with ID: ${scriptId}`);
             await chrome.userScripts.unregister({ ids: [scriptId] });
             // console.log(`Unregistration successful for script ID: ${scriptId} (if it was registered).`);
             sendResponse({ success: true, status: "JS unregistration successful." });
          } else {
             console.error("chrome.userScripts.unregister API not available.");
             sendResponse({ success: false, error: "UserScripts API for unregistration not available." });
          }
        } catch (error) {
          // Catch errors, e.g., if the ID format is invalid or API fails
          console.error(`Error trying to unregister script ${scriptId}:`, error);
          // Check if the error indicates the script ID was not found (which is okay)
          if (error.message && (error.message.includes("Invalid script ID") || error.message.includes("No script with ID") || error.message.includes("Nonexistent script ID"))) {
             // console.warn(`Script ID ${scriptId} was not found for unregistration (it might have already been removed or never registered).`);
             // Still send success=true because the desired state (script not registered) is achieved.
             sendResponse({ success: true, status: "Script ID not found for unregistration." });
          } else {
             // Send failure for other unexpected errors
             sendResponse({ success: false, error: error.message });
          }
        }
      })();
    } else { // Assume CSS
      // console.log(`CSS removal for script ${scriptId} needs implementation.`);
      // TODO: Implement sending message to content script to remove the specific <style> tag
      // This requires CSS to be injected with identifiable IDs.
      sendResponse({ success: true, status: "CSS removal pending implementation" });
    }
    return true; // Indicates asynchronous response
  }

  // Handle getting currently registered user scripts
  if (message.type === 'GET_REGISTERED_SCRIPTS') {
    (async () => { // Wrap in async IIFE to use await
      try {
        // Check if userScripts API is available
        if (isUserScriptsAvailable()) {
          const registeredScripts = await chrome.userScripts.getScripts();
          // console.log(`Found ${registeredScripts.length} registered scripts`);
          sendResponse({ success: true, scripts: registeredScripts });
        } else {
          console.error("chrome.userScripts.getScripts API not available.");
          sendResponse({ success: false, error: "UserScripts API for getScripts not available." });
        }
      } catch (error) {
        console.error(`Error getting registered scripts:`, error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Indicates asynchronous response
  }

  // Removed injectCSS and injectJS handlers as injection is now done from sidepanel

  // Let other listeners (like sidepanel) handle messages not explicitly targeted here
  return false; // Indicate synchronous processing or no response needed from background

}); // End of onMessage listener


console.log('Magix background service worker started.');
