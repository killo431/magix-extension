console.log("Magix injector content script loaded (v2 - Blob URL).");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXECUTE_SCRIPT' && message.code) {
    console.log("Injector script (v2) received code:", message.code.substring(0, 100) + "...");
    let script = null;
    let objectUrl = null;

    try {
      // 1. Create a Blob from the code
      const blob = new Blob([message.code], { type: 'text/javascript' });

      // 2. Create an Object URL
      objectUrl = URL.createObjectURL(blob);
      console.log("Injector script (v2) created blob URL:", objectUrl);

      // 3. Create the script tag
      script = document.createElement('script');
      script.src = objectUrl; // Set src to the Blob URL

      // 4. Add handlers for cleanup
      script.onload = () => {
        console.log("Injector script (v2): Script loaded via src.");
        cleanup();
        // Optionally send success response
        // sendResponse({ success: true });
      };
      script.onerror = (err) => {
        console.error("Injector script (v2): Error loading script via src:", err);
        cleanup();
        // Optionally send error response
        // sendResponse({ success: false, error: 'Script loading failed' });
      };

      // 5. Append the script to the document head (or body)
      (document.head || document.documentElement).appendChild(script);
      console.log("Injector script (v2) appended script tag with src.");

    } catch (e) {
      console.error("Injector script (v2): Error creating/injecting script tag:", e);
      cleanup(); // Ensure cleanup even if initial steps fail
      // Optionally send error response
      // sendResponse({ success: false, error: e.message });
    }

    // Function to clean up the script tag and object URL
    function cleanup() {
      if (script) {
        console.log("Injector script (v2): Removing script tag.");
        script.remove();
        script = null;
      }
      if (objectUrl) {
        console.log("Injector script (v2): Revoking object URL.");
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    }

    // Return true only if you intend to use sendResponse asynchronously (after onload/onerror)
    // For simplicity now, we are not sending async responses.
    // return true;
  }
});
