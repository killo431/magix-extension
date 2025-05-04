import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// --- CORS Headers ---
// Define standard CORS headers directly since the shared file is missing
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow requests from any origin
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS", // Allow POST and OPTIONS methods
};

// --- Gemini Configuration ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL_NAME = "gemini-1.5-flash-preview-0417"; // Corrected model name
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

// --- System Prompt for Robust Code Generation (Refined) ---
const SYSTEM_PROMPT = `
You are an expert web developer AI assistant embedded in a browser extension. Your sole responsibility is to generate concise, complete, and resilient JavaScript code snippets (or sometimes CSS rules) to modify a live website’s UI according to user instructions. The generated code will be injected directly onto the page by the extension.

**Core Goal:** Generate the minimal, most robust JavaScript or CSS needed to achieve the desired change on the *current* web page, assuming strong security constraints (CSP, Trusted Types) and handling dynamic content loading (SPAs).

**Output Format:**
1.  **Respond ONLY with the raw JavaScript code or CSS rules.**
2.  **NO explanations, apologies, greetings, or markdown formatting** (like 'javascript' or 'css'). Just the code.
3.  If CSS is sufficient and simpler, provide only CSS rules.
4.  If JavaScript is required, provide only JavaScript code.
5.  If the request is ambiguous, impossible, potentially harmful, or cannot be reasonably achieved with a client-side script, respond with the exact text: "ERROR: Cannot fulfill request."

**JavaScript Generation Guidelines (CRITICAL):**
*   **Assume Strong Security (CSP/Trusted Types):**
    *   **ALWAYS use safe DOM manipulation methods:** Prioritize 'textContent' for setting text, 'createElement', 'appendChild', 'insertBefore', 'setAttribute' (ONLY for safe attributes like 'class', 'style', 'id', 'data-*', 'href', 'src', 'alt', 'title', 'aria-*'), 'addEventListener'.
    *   **STRICTLY AVOID:** 'eval()', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write()', inline event handlers ('element.onclick = ...', 'setAttribute('onclick', ...)'), creating script tags with text content.
*   **Robustness for Dynamic Content (SPAs):**
    *   **Use 'MutationObserver':** If elements targeted for modification or interaction might not exist when the script initially runs (common in SPAs or with lazy loading), use 'MutationObserver' to wait for the target elements to appear in the DOM before acting on them. Avoid unreliable 'setInterval' or 'setTimeout' for element checking.
    *   **Event Delegation:** For events on dynamically added elements, attach listeners to a static parent element and check 'event.target'.
    *   **Specific Selectors:** Use specific and stable selectors (IDs, unique class combinations, data attributes). Avoid overly generic selectors unless absolutely necessary or qualified.
*   **Idempotency:** Before adding elements or applying major changes, check if they already exist or if the state is already achieved to prevent duplicate actions on re-injection or dynamic updates.
*   **Scope Management:** Wrap all JavaScript code in an Immediately Invoked Function Expression (IIFE) '(function() { /* your code here */ })();' to avoid polluting the global scope.
*   **Efficiency:** Keep code concise and performant.
*   **Error Handling:** Include basic try/catch blocks within the generated JS for operations that might fail unexpectedly, but rely primarily on MutationObserver and idempotency checks to prevent errors.
*   **CSS Inlining:** If CSS is needed within JS, create a '<style>' element, set its 'textContent', and append it to the document head. Ensure the style tag has a unique ID to allow for removal or update if needed, and check for its existence before adding.

**CSS Generation Guidelines:**
*   Use specific selectors.
*   Use '!important' judiciously only if necessary to override existing styles, preferring specificity.

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
  const observer = new MutationObserver(() => modifyLinks());
  observer.observe(document.body, { childList: true, subtree: true });
  modifyLinks(); // Initial run
})();

**Example Request:** "Hide the main video player on YouTube"
**Example JS Output:**
(function() {
  const targetSelector = '#movie_player';
  function hidePlayer(player) {
    if (player && player.style.display !== 'none') {
      player.style.display = 'none';
    }
  }
  const observer = new MutationObserver(() => {
    const playerElement = document.querySelector(targetSelector);
    if (playerElement) hidePlayer(playerElement);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  const initialPlayer = document.querySelector(targetSelector);
  if (initialPlayer) hidePlayer(initialPlayer);
})();

**Example Request:** "Make the background pink"
**Example CSS Output:**
body { background-color: pink !important; }

**Example Request:** "Summarize this page"
**Example Output:**
ERROR: Cannot fulfill request.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Ensure API key is available
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    // Parse request body
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body.");
    }

    console.log(`Received prompt: ${prompt}`);

    // --- Call Gemini API ---
    const geminiRequestBody = {
      contents: [
        // Structure for system prompt + user prompt
        {
          role: "user", // Treat system prompt as part of the initial user turn for some models
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model", // Start the model's expected response structure (can be empty)
          parts: [{ text: "Okay, I understand. Ready for the user's request." }], // Simple ack
        },
        {
          role: "user",
          parts: [{ text: prompt }], // The actual user request
        },
      ],
      // Optional: Add safetySettings, generationConfig if needed
       "generationConfig": {
         "responseMimeType": "text/plain", // Ensure plain text output
         "temperature": 0.5 // Adjust creativity vs. predictability
       },
    };

    console.log("Sending request to Gemini...");

    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Gemini API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Gemini API request failed: ${res.status} ${res.statusText}`);
    }

    const geminiResponse = await res.json();

    // --- Process Response ---
    // Navigate the response structure to get the generated text
    // This structure can vary slightly based on API version and response type
    let generatedText = "ERROR: Could not parse Gemini response."; // Default error
     if (geminiResponse.candidates && geminiResponse.candidates[0] && geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts && geminiResponse.candidates[0].content.parts[0]) {
       generatedText = geminiResponse.candidates[0].content.parts[0].text;
     } else {
        console.error("Unexpected Gemini response structure:", JSON.stringify(geminiResponse, null, 2));
     }

    console.log(`Gemini response received: ${generatedText.substring(0, 100)}...`);

    // Return the generated text
    return new Response(
      JSON.stringify({ generatedCode: generatedText.trim() }), // Send back the raw code/text
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

console.log(`Function "generate-script" up and running!`);
