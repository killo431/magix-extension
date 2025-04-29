// content.js

console.log("Magix content script loaded.");

// Create the Floating Action Button (FAB) placeholder
const fab = document.createElement('button');
fab.textContent = '🪄'; // Placeholder wand icon
fab.style.position = 'fixed';
fab.style.bottom = '20px';
fab.style.right = '20px';
fab.style.width = '50px';
fab.style.height = '50px';
fab.style.borderRadius = '50%';
fab.style.backgroundColor = '#000000'; // Black button as requested
fab.style.color = '#ffffff'; // White icon
fab.style.fontSize = '24px';
fab.style.border = 'none';
fab.style.cursor = 'pointer';
fab.style.zIndex = '9999'; // Ensure it's on top
fab.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
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
