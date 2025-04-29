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

  // Return true to indicate you wish to send a response asynchronously
  // (although in this simple case, sendResponse is called synchronously)
  return true;
});


console.log('Magix background service worker started.');
