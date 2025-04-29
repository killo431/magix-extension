// background.js

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Optional: Add a listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Magix extension installed or updated.');
  // You could potentially set default storage values here
});

// Listener for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  // Check if the message is asking to open the side panel
  if (message.action === "openSidePanel") {
    // Ensure the message came from a tab (content script)
    if (sender.tab) {
      console.log(`Opening side panel for tab ${sender.tab.id}...`);
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ status: "Side panel opening request received." });
    } else {
      console.error("Received openSidePanel message without sender tab information.");
      sendResponse({ status: "Error: Sender tab information missing." });
    }
  }
  // Removed the 'else if (message.action === "signInWithGoogle")' block
  // as authentication is now handled directly in the side panel via Supabase client.

  // If the message wasn't handled, we don't need to return true here for async
  // unless other conditions above might respond asynchronously.
  // Let's return true generally within the listener if any branch might be async.
  return true; // Keep this for the listener itself
}); // End of onMessage listener


console.log('Magix background service worker started.');
