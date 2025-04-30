// content.js

console.log("Magix content script loaded.");

// Create the Floating Button
const fab = document.createElement('button');
fab.textContent = 'Modify 🪄'; // Updated text
fab.style.position = 'fixed';
fab.style.bottom = '20px';
fab.style.right = '20px';
// Removed fixed width/height for auto sizing
fab.style.borderRadius = '8px'; // Corner rounding like recent items
fab.style.backgroundColor = '#ffffff'; // White background
fab.style.color = '#000000'; // Black text
fab.style.fontSize = '14px'; // Adjusted font size
fab.style.border = '1px solid #e0e0e0'; // Light grey border
fab.style.padding = '6px 12px'; // Added padding
fab.style.cursor = 'pointer';
fab.style.zIndex = '9999';
fab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'; // Subtle shadow
fab.style.fontFamily = 'Inter, sans-serif'; // Match sidepanel font
fab.id = 'magix-fab';

// Add event listener to send a message to the background script to open the side panel
fab.addEventListener('click', () => {
  console.log('Magix FAB clicked. Sending message to background script...');
  chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError.message);
    } else {
      console.log('Background script responded:', response);
    }
  });
});

// Append the FAB to the body
document.body.appendChild(fab);

console.log("Magix FAB added to page.");
