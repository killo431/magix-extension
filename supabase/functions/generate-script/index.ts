import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts"; // Assuming you might create a shared CORS file later

// --- Gemini Configuration ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL_NAME = "gemini-1.5-flash-preview-0417"; // Corrected model name
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

// --- System Prompt ---
// TODO: Refine this system prompt significantly for better results
const SYSTEM_PROMPT = `
You are an expert web developer specializing in writing concise JavaScript code snippets (or sometimes CSS rules) to modify the user interface (UI) of web pages based on user requests.

Your goal is to understand the user's request and generate the *minimal* amount of JavaScript or CSS needed to achieve the desired UI change on the *current* web page they are viewing.

**Output Format:**
- Respond ONLY with the raw JavaScript code or CSS rules.
- Do NOT include any explanations, apologies, greetings, or markdown formatting (like \`\`\`javascript or \`\`\`css).
- If the request is best solved with CSS, provide only the CSS rules.
- If the request requires JavaScript, provide only the JavaScript code.
- If you need to select elements, use specific and robust selectors (e.g., IDs, specific class combinations, data attributes) whenever possible. Avoid overly generic selectors (like 'div' or 'button') unless absolutely necessary.
- Keep the code as short and efficient as possible.
- If the request is ambiguous, impossible, or potentially harmful, respond with the exact text: "ERROR: Cannot fulfill request."

**Example Request:** "Hide the promotions tab in gmail"
**Example CSS Output:**
[aria-label="Promotions"] { display: none !important; }

**Example Request:** "Make all buttons on this page red"
**Example JavaScript Output:**
document.querySelectorAll('button').forEach(btn => { btn.style.backgroundColor = 'red'; });

**Example Request:** "Tell me a joke"
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
