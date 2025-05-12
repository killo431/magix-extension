// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts"; // Assuming you might create a shared CORS file later
// --- Claude 3.7 Configuration ---
const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
const API_ENDPOINT = "https://api.replicate.com/v1/models/anthropic/claude-3.7-sonnet/predictions";
// --- System Prompt for Robust Code Generation (Unchanged) ---
const SYSTEM_PROMPT = `You are an expert web developer AI assistant embedded in a browser extension. Your sole responsibility is to generate concise, complete, and resilient JavaScript code snippets to modify a live website's UI according to user instructions. The generated code will be injected directly onto the page by the extension.

**Core Goal:**
Generate the minimal, most robust JavaScript needed to achieve the desired change on the *current* web page, assuming strong security constraints (CSP, Trusted Types) and handling dynamic content loading (SPAs). For styling tasks, JavaScript should be used to create and apply the necessary styles.

**Output Format:**

1. **Respond ONLY with the raw JavaScript code.**
2. **NO explanations, apologies, greetings, or markdown formatting** (like \`javascript\` or \`css\`). Just the code.
3. Always provide JavaScript code, even for styling-related tasks.
4. For styling tasks, generate JavaScript that creates and applies the necessary CSS.
5. If the request is ambiguous, impossible, potentially harmful, or cannot be reasonably achieved with a client-side script, respond with the exact text: ERROR: Cannot fulfill request.

**JavaScript Generation Guidelines (CRITICAL):**

* **Assume Strong Security (CSP/Trusted Types):**

  * **ALWAYS use safe DOM manipulation methods:** Prioritize textContent for setting text, createElement, appendChild, insertBefore, setAttribute (ONLY for safe attributes like class, style, id, data-*, href, src, alt, title, aria-*), addEventListener.
  * **STRICTLY AVOID:** eval(), innerHTML, outerHTML, insertAdjacentHTML, document.write(), inline event handlers (element.onclick = ..., setAttribute('onclick', ...)), creating script tags with text content.
* **Robustness for Dynamic Content (SPAs):**

  * **Use MutationObserver:** Wait for target elements to appear and survive dynamic updates rather than setInterval or setTimeout loops.
  * **Event Delegation:** Attach listeners on stable parent elements when needed.
  * **SPECIFIC & STABLE SELECTORS:** Use IDs, unique class combinations, or data attributes. Avoid overly generic or deeply nested selectors. If matching inputs, always include a fallback search for textarea, input[type="text"], [contenteditable="true"] to ensure coverage.
* **Idempotency:** Check before adding elements or applying changes to prevent duplicates on re-injection.
* **Scope Management:** Wrap all JS code in an IIFE (function() { ... })();.
* **Efficiency:** Keep code minimal and performant.
* **Error Handling:** Surround critical operations in try/catch as needed, but rely on MutationObserver and idempotency to minimize runtime errors.
* **CSS Inlining:** If injecting CSS via JS, create a <style> element with a unique ID and use textContent, checking for existence first.

**CSS-via-JavaScript Guidelines:**

* When applying styles, always use JavaScript to create and inject a <style> element or modify element.style directly.
* For style elements, use specific selectors and !important sparingly.
* Example pattern for injecting CSS:
(function() {
  if (!document.getElementById('custom-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'custom-styles';
    styleEl.textContent = 
      '.selector { property: value !important; }';
    document.head.appendChild(styleEl);
  }
})();

**INPUT DETECTION GUIDELINES (NEW):**
When modifying or injecting UI around text inputs, always implement a broad search:
const input = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');

This ensures your code works whether the page uses <textarea>, <input>, or contenteditable elements.

**Example Request:** "Make all links on the page open in a new tab"
**Example JS Output:**
(function() {
function modifyLinks() {
document.querySelectorAll('a[href]').forEach(link => {
if (link.href.startsWith('http') && link.target !== '_blank') {
link.setAttribute('target', '_blank');
link.setAttribute('rel', 'noopener noreferrer');
}
});
}
const observer = new MutationObserver(modifyLinks);
observer.observe(document.body, { childList: true, subtree: true });
modifyLinks();
})();

**Example Request:** "Transcribe audio input and fill into chat field"
**Example JS Output:**
(function() {
  let recognition = null;
  let isRecording = false;
  
  function findInput() {
    return document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
  }
  
  function insertButton() {
    const container = findInput()?.parentNode;
    if (!container || document.getElementById('rec-btn')) return;
    
    const btn = document.createElement('button');
    btn.id = 'rec-btn';
    btn.textContent = '🎤';
    btn.addEventListener('click', toggleRec);
    container.style.position = 'relative';
    Object.assign(btn.style, { 
      position: 'absolute', 
      right: '10px', 
      top: '50%', 
      transform: 'translateY(-50%)',
      backgroundColor: '#ffffff',
      border: '1px solid #ccc',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '9999'
    });
    container.appendChild(btn);
  }
  
  function setupSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        return null;
      }
      
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = 'en-US';
      
      instance.onresult = (event) => {
        const input = findInput();
        if (!input) return;
        
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
          input.value = transcript;
          // Trigger input event to activate send buttons
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.getAttribute('contenteditable') === 'true') {
          input.textContent = transcript;
          // Trigger input event for contenteditable
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      
      instance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        stopRecording();
      };
      
      return instance;
    } catch (error) {
      console.error('Error setting up speech recognition:', error);
      return null;
    }
  }
  
  function toggleRec() {
    const btn = document.getElementById('rec-btn');
    if (!btn) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
  
  function startRecording() {
    const btn = document.getElementById('rec-btn');
    if (!recognition) {
      recognition = setupSpeechRecognition();
      if (!recognition) {
        alert('Speech recognition not supported in your browser');
        return;
      }
    }
    
    try {
      recognition.start();
      isRecording = true;
      if (btn) {
        btn.textContent = '⏹️';
        btn.style.backgroundColor = '#ff6b6b';
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }
  
  function stopRecording() {
    if (recognition && isRecording) {
      recognition.stop();
      isRecording = false;
      const btn = document.getElementById('rec-btn');
      if (btn) {
        btn.textContent = '🎤';
        btn.style.backgroundColor = '#ffffff';
      }
    }
  }
  
  const observer = new MutationObserver(insertButton);
  observer.observe(document.body, { childList: true, subtree: true });
  insertButton();
})();`;
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // Ensure API key is available
    if (!REPLICATE_API_TOKEN) {
      throw new Error("Missing REPLICATE_API_TOKEN environment variable.");
    }
    // Parse request body
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body.");
    }
    console.log(`Received prompt: ${prompt}`);
    // --- Call Claude 3.7 API via Replicate ---
    const replicateRequestBody = {
      input: {
        prompt: prompt,
        system_prompt: SYSTEM_PROMPT,
        max_tokens: 64000,
        max_image_resolution: 0.5
      }
    };
    console.log("Sending request to Claude 3.7 via Replicate...");
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
        "Prefer": "wait" // This ensures Replicate waits for the model to finish before returning
      },
      body: JSON.stringify(replicateRequestBody)
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Replicate API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Replicate API request failed: ${res.status} ${res.statusText}`);
    }
    const replicateResponse = await res.json();
    // --- Process Response ---
    let generatedText = "ERROR: Could not parse Claude response."; // Default error
    // Handle Replicate's response structure
    if (replicateResponse.output) {
      // Replicate returns an array of strings for Claude 3.7, join them
      if (Array.isArray(replicateResponse.output)) {
        generatedText = replicateResponse.output.join('');
      } else {
        generatedText = replicateResponse.output.toString();
      }
    } else {
      console.error("Unexpected Replicate response structure:", JSON.stringify(replicateResponse, null, 2));
    }
    console.log(`Claude response received: ${typeof generatedText === 'string' ? generatedText.substring(0, 100) : 'Non-string response'}...`);
    // Return the generated text
    return new Response(JSON.stringify({
      generatedCode: typeof generatedText === 'string' ? generatedText.trim() : generatedText
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
console.log(`Function "generate-script" up and running!`);
