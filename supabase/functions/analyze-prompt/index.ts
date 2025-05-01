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
const GEMINI_MODEL_NAME = "gemini-1.5-flash-preview-0417";
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

// --- System Prompt for Analysis ---
const SYSTEM_PROMPT_ANALYZE = `
You are an AI assistant helping a user modify web pages using a browser extension.
Your task is to analyze the user's request and determine two things:
1.  A short, conversational text response to display to the user immediately (e.g., "Okay, I can try that.", "Sure, I can help with that.", "I understand you want to...", or if the request is not about modifying the page, a relevant answer).
2.  Whether the request requires generating CSS or JavaScript code to modify the current web page.

**Output Format:**
- Respond ONLY with a valid JSON object.
- Do NOT include any other text, explanations, or markdown formatting.
- The JSON object must have exactly two keys:
    - "response": (string) The short, conversational text response for the user.
    - "is_code_needed": (boolean) Set to true if CSS/JS code generation is required to fulfill the request, otherwise false.

**Example Request:** "Make the background blue"
**Example JSON Output:**
{
  "response": "Okay, I can try to make the background blue.",
  "is_code_needed": true
}

**Example Request:** "What is CSS?"
**Example JSON Output:**
{
  "response": "CSS stands for Cascading Style Sheets. It's used to describe the presentation of a document written in HTML.",
  "is_code_needed": false
}

**Example Request:** "Hide all images"
**Example JSON Output:**
{
  "response": "Sure, I can attempt to hide all images on the page.",
  "is_code_needed": true
}

**Example Request:** "Tell me a joke"
**Example JSON Output:**
{
  "response": "Why don't scientists trust atoms? Because they make up everything!",
  "is_code_needed": false
}

**Example Request:** "delete my account"
**Example JSON Output:**
{
  "response": "Sorry, I cannot perform actions like deleting accounts. My capabilities are limited to modifying the appearance or behavior of the current page.",
  "is_code_needed": false
}
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

    console.log(`[analyze-prompt] Received prompt: ${prompt}`);

    // --- Call Gemini API ---
    const geminiRequestBody = {
      contents: [
        // Structure for system prompt + user prompt
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT_ANALYZE }],
        },
        {
          role: "model",
          parts: [{ text: "Okay, I understand the JSON format. Ready for the user's request." }],
        },
        {
          role: "user",
          parts: [{ text: prompt }], // The actual user request
        },
      ],
       "generationConfig": {
         "responseMimeType": "application/json", // Request JSON output
         "temperature": 0.3 // Lower temperature for more predictable JSON structure
       },
       // Add safety settings if needed
    };

    console.log("[analyze-prompt] Sending request to Gemini...");

    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[analyze-prompt] Gemini API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Gemini API request failed: ${res.status} ${res.statusText}`);
    }

    const geminiResponse = await res.json();

    // --- Process Response ---
    let analysisResult = { response: "Error: Could not parse Gemini analysis.", is_code_needed: false }; // Default error

     if (geminiResponse.candidates && geminiResponse.candidates[0] && geminiResponse.candidates[0].content && geminiResponse.candidates[0].content.parts && geminiResponse.candidates[0].content.parts[0]) {
       try {
         // The response *should* be JSON already because of responseMimeType
         const parsedJson = JSON.parse(geminiResponse.candidates[0].content.parts[0].text);
         // Basic validation
         if (typeof parsedJson.response === 'string' && typeof parsedJson.is_code_needed === 'boolean') {
            analysisResult = parsedJson;
         } else {
            console.error("[analyze-prompt] Gemini response JSON has incorrect structure:", parsedJson);
            analysisResult.response = "Error: Received unexpected format from AI analysis.";
         }
       } catch (parseError) {
         console.error("[analyze-prompt] Failed to parse Gemini JSON response:", parseError, geminiResponse.candidates[0].content.parts[0].text);
         analysisResult.response = "Error: Failed to understand AI analysis response.";
       }
     } else {
        console.error("[analyze-prompt] Unexpected Gemini response structure:", JSON.stringify(geminiResponse, null, 2));
        analysisResult.response = "Error: Unexpected response structure from AI analysis.";
     }

    console.log(`[analyze-prompt] Gemini analysis received:`, analysisResult);

    // Return the analysis result
    return new Response(
      JSON.stringify(analysisResult), // Send back the { response, is_code_needed } object
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in analyze-prompt Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message, response: `Error: ${error.message}`, is_code_needed: false }), // Ensure the response structure is consistent even on error
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

console.log(`Function "analyze-prompt" up and running!`);
