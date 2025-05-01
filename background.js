// background.js

// Listener for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Optional: Add a listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Magix extension installed or updated.');
});

// Listener for messages from content scripts or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);

  if (message.action === "openSidePanel") {
    if (sender.tab) {
      console.log(`Opening side panel for tab ${sender.tab.id}...`);
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ status: "Side panel opening request received." });
    } else {
      console.error("Received openSidePanel message without sender tab information.");
      sendResponse({ status: "Error: Sender tab information missing." });
    }
    return false; // Synchronous response
  }
  // Removed injectCSS and injectJS handlers as injection is now done from sidepanel

  // Default case if no action matches
  console.log("Message action not recognized or handled:", message.action);
  sendResponse({ status: "Unknown action."});
  return false;

}); // End of onMessage listener


console.log('Magix background service worker started.');
