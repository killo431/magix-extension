// content.js

// console.log("Magix content script loaded.");

let selectingModeActive = false; // Flag to track if selection mode is on
let currentHoverElement = null; // To keep track of the currently hovered element for styling
const highlightStyle = '2px solid #f06292'; // Pink outline for highlighting

// --- Element Selection Logic ---

// Function to generate a more robust CSS selector
function generateCssSelector(element) {
  if (!(element instanceof Element)) return;
  const path = [];
  const stableAttributes = ['name', 'role', 'type', 'aria-label', 'data-testid']; // Attributes less likely to change

  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();
    let id = element.getAttribute('id');

    // Check for a stable-looking ID first
    if (id && !/[\.:]/.test(id)) { // Avoid IDs with colons or periods, often dynamic
      selector = `#${id}`;
      path.unshift(selector);
      break; // Found a good ID, stop climbing
    }

    // Try stable attributes
    let attrSelector = '';
    for (const attr of stableAttributes) {
      const value = element.getAttribute(attr);
      if (value) {
        attrSelector = `[${attr}="${value}"]`;
        // Check if this attribute selector is unique among siblings
        const siblings = Array.from(element.parentNode?.children || []);
        const matchingSiblings = siblings.filter(sib => sib.matches(`${element.nodeName.toLowerCase()}${attrSelector}`));
        if (matchingSiblings.length === 1) {
          selector += attrSelector;
          break; // Found a unique stable attribute
        }
      }
    }
     if (attrSelector && selector.includes(attrSelector)) {
       // Attribute selector was unique enough, use it
     } else {
        // Fallback to classes if no unique ID or stable attribute found
        const classes = Array.from(element.classList).filter(cls => !/^[0-9]/.test(cls)); // Filter out potentially dynamic classes starting with numbers
        if (classes.length > 0) {
            // Function to escape CSS special characters for .matches()
            const escapeCSS = (str) => str.replace(/([!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~])/g, "\\$1");

            // Create the selector with original class names for the final output
            const classSelector = '.' + classes.join('.');

            // Create an escaped version for the .matches() check
            const escapedClasses = classes.map(escapeCSS);
            const escapedClassSelector = '.' + escapedClasses.join('.');

            // Check if this *escaped* class selector is unique among siblings
            const siblings = Array.from(element.parentNode?.children || []);
            let matchingSiblings = [];
            try {
                 // Use the escaped selector for the .matches() query
                 matchingSiblings = siblings.filter(sib => sib.matches(`${element.nodeName.toLowerCase()}${escapedClassSelector}`));
            } catch (e) {
                 console.warn(`CSS selector matching failed for "${escapedClassSelector}":`, e);
                 // If matching fails even with escaping (highly unlikely but possible), fallback to nth-of-type
                 matchingSiblings = []; // Treat as not unique
            }

             if (matchingSiblings.length === 1) {
                 // If unique, use the *original* (unescaped) class selector for the final path
                 selector += classSelector;
             } else {
                 // If classes aren't unique, fall back to nth-of-type
                 let index = 1;
                 let sibling = element.previousElementSibling;
                 while (sibling) {
                     if (sibling.nodeName === element.nodeName) {
                         index++;
                     }
                     sibling = sibling.previousElementSibling;
                 }
                 selector += `:nth-of-type(${index})`;
             }
        } else {
            // Absolute fallback to nth-of-type if no ID, stable attr, or classes
            let index = 1;
            let sibling = element.previousElementSibling;
            while (sibling) {
                if (sibling.nodeName === element.nodeName) {
                    index++;
                }
                sibling = sibling.previousElementSibling;
            }
            if (index > 1 || !element.previousElementSibling) { // Add nth-of-type if not the first or only child of its type
                 selector += `:nth-of-type(${index})`;
            }
        }
     }


    path.unshift(selector);
    element = element.parentNode;
    if (element === document.body) break; // Stop at body
  }
  return path.join(' > ');
}


// Function to apply highlight style
function applyHighlight(element) {
  if (element && element.style) {
    element.style.outline = highlightStyle;
    element.style.outlineOffset = '2px'; // Offset to make it more visible
  }
}

// Function to remove highlight style
function removeHighlight(element) {
   if (element && element.style) {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }
}

// Function to handle mouseover events during selection mode
function handleMouseOver(event) {
  if (!selectingModeActive) return;

  const targetElement = event.target;

  // Remove highlight from the previously hovered element
  if (currentHoverElement && currentHoverElement !== targetElement) {
    removeHighlight(currentHoverElement);
  }

  // Apply highlight to the new element
  if (targetElement !== currentHoverElement) {
     applyHighlight(targetElement);
     currentHoverElement = targetElement; // Store the new element
  }
}

// Function to handle mousedown events during selection mode (to prevent focus, etc.)
function handleMouseDown(event) {
  if (!selectingModeActive) return;
  // Prevent default actions (like focusing an input) and stop propagation immediately
  event.preventDefault();
  event.stopPropagation();
}

// Function to handle click events during selection mode
function handleClick(event) {
  if (!selectingModeActive) return;

  event.preventDefault();
  event.stopPropagation(); // Stop the click from propagating further

  const clickedElement = event.target;
  // console.log("Element clicked:", clickedElement);

  // Generate the CSS selector
  const selector = generateCssSelector(clickedElement);
  // console.log("Generated Selector:", selector);

  // Remove highlight from the clicked element before exiting
  removeHighlight(clickedElement);
  currentHoverElement = null; // Clear hover state

  // Send message back to sidepanel with the selector
  chrome.runtime.sendMessage({ type: 'ELEMENT_SELECTED', selector: selector }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending ELEMENT_SELECTED message:', chrome.runtime.lastError.message);
    } else {
      // console.log('Sidepanel responded to click:', response);
    }
  });

  // Exit selection mode and remove listeners
  exitSelectionMode();
}

// Function to start element selection mode
function startSelectionMode() {
  if (selectingModeActive) return; // Already active
  selectingModeActive = true;
  // console.log("Starting element selection mode...");
  document.addEventListener('mouseover', handleMouseOver, true); // Use capture phase
  document.addEventListener('mousedown', handleMouseDown, true); // Add mousedown listener in capture phase
  document.addEventListener('click', handleClick, true); // Use capture phase
  // Optionally change cursor style
  document.body.style.cursor = 'crosshair';
}

// Function to exit element selection mode
function exitSelectionMode() {
  if (!selectingModeActive) return;
  selectingModeActive = false;
  // console.log("Exiting element selection mode...");
  // Remove highlight from the last hovered element when exiting
  if (currentHoverElement) {
    removeHighlight(currentHoverElement);
    currentHoverElement = null;
  }
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mousedown', handleMouseDown, true); // Remove mousedown listener
  document.removeEventListener('click', handleClick, true);
  // Restore cursor style
  document.body.style.cursor = 'default';
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log("Content script received message:", message);

  if (message.type === 'START_ELEMENT_SELECTION') {
    startSelectionMode();
    sendResponse({ status: "Selection mode started" });
    return true; // Indicate async response if needed, though not strictly necessary here
  }

  // Handle other messages if necessary

  // Default response if message not handled
  // sendResponse({ status: "Message type not handled by content script" });
  return false; // Indicate synchronous response or no response needed
});


// --- Floating Button Logic (Existing) ---

// Create the Floating Button
const fab = document.createElement('button');
fab.textContent = 'Magix 🪄'; // Updated text to "Magix"
fab.style.cssText = `
  position: fixed !important;
  bottom: 20px !important;
  right: 20px !important;
  border-radius: 8px !important;
  background-color: #ffffff !important;
  color: #000000 !important;
  font-size: 14px !important;
  border: 1px solid #e0e0e0 !important;
  padding: 6px 12px !important;
  cursor: pointer !important;
  z-index: 999999 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 500 !important;
  line-height: 1.2 !important;
  text-align: center !important;
  white-space: nowrap !important;
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  transition: none !important;
  transform: none !important;
  filter: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  width: auto !important;
  height: auto !important;
  min-width: auto !important;
  min-height: auto !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  outline: none !important;
  text-decoration: none !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  word-spacing: normal !important;
`;
fab.id = 'magix-fab';

// Function to maintain FAB integrity - prevents tampering by user scripts
function maintainFABIntegrity() {
  if (fab && fab.parentNode) {
    // Reset text content if changed
    if (fab.textContent !== 'Magix 🪄') {
      fab.textContent = 'Magix 🪄';
    }
    
    // Reset critical styles if changed
    const computedStyle = window.getComputedStyle(fab);
    if (computedStyle.backgroundColor !== 'rgb(255, 255, 255)' || 
        computedStyle.color !== 'rgb(0, 0, 0)' ||
        computedStyle.position !== 'fixed') {
      fab.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        border-radius: 8px !important;
        background-color: #ffffff !important;
        color: #000000 !important;
        font-size: 14px !important;
        border: 1px solid #e0e0e0 !important;
        padding: 6px 12px !important;
        cursor: pointer !important;
        z-index: 999999 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 500 !important;
        line-height: 1.2 !important;
        text-align: center !important;
        white-space: nowrap !important;
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        transition: none !important;
        transform: none !important;
        filter: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        width: auto !important;
        height: auto !important;
        min-width: auto !important;
        min-height: auto !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        outline: none !important;
        text-decoration: none !important;
        text-transform: none !important;
        letter-spacing: normal !important;
        word-spacing: normal !important;
      `;
    }
  }
}

// Start periodic integrity checks
setInterval(maintainFABIntegrity, 1000); // Check every second

// Add event listener to send a message to the background script to open the side panel
fab.addEventListener('click', () => {
  // Prevent FAB click from triggering element selection if active
  if (selectingModeActive) {
     // console.log("Selection mode active, ignoring FAB click for opening panel.");
     return;
  }
  // console.log('Magix FAB clicked. Sending message to background script...');
  chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending message:', chrome.runtime.lastError.message);
    } else {
      // console.log('Background script responded:', response);
    }
  });
});

// Append the FAB to the body
// Ensure body exists before appending
if (document.body) {
    document.body.appendChild(fab);
    // console.log("Magix FAB added to page.");
} else {
    // Wait for the body to load if script runs too early (though unlikely with default injection)
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
            document.body.appendChild(fab);
            // console.log("Magix FAB added to page after DOMContentLoaded.");
        } else {
            console.error("Magix FAB could not be added: document.body not found.");
        }
    });
}
