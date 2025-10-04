// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// --- CORS Headers ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// --- Gemini Configuration (Updated Oct 4, 2025) ---
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL_NAME = "gemini-2.5-flash"; // Latest stable model
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
// --- System Prompt for Analysis (MODIFIED) ---
const SYSTEM_PROMPT_ANALYZE = `
Your name is Magix. You are an AI assistant helping a user modify web pages using a browser extension.
Your task is to analyze the user's request and determine two things:
1.  A short, conversational text response to display to the user immediately. It can be dynamic and cheerful depending on the user request. You need not stick to the same words as in the examples below. Also tell the user not to switch to other tabs when processing until its completed. 
2.  Whether the request requires generating CSS or JavaScript code to modify the current web page.

The user's request might also include:
- An "existing_script_content" if they are trying to modify a script they previously created.
- A "selected_element_selector" if they have selected a specific element on the page to target.

Consider these additional pieces of information when formulating your response and deciding if code is needed.
For example, if an existing script is provided and the user asks to "make it green", your response should acknowledge the script, and is_code_needed would be true.
If the user says "this script is perfect" and provides the script, is_code_needed would be false.

**Output Format:**
- Respond ONLY with a valid JSON object.
- Do NOT include any other text, explanations, or markdown formatting.
- The JSON object must have exactly two keys:
    - "response": (string) The short, conversational text response for the user.
    - "is_code_needed": (boolean) Set to true if CSS/JS code generation is required to fulfill the request, otherwise false.

**Example Request (Simple):** "Make the background blue"
**Example JSON Output:**
{
  "response": "Okay, I can try to make the background blue.",
  "is_code_needed": true
}

**Example Request (With Element):** User wants: "Change text to red". Selected element: "h1.title"
**Example JSON Output:**
{
  "response": "Alright, I'll try to change the text of the selected H1 title to red.",
  "is_code_needed": true
}

**Example Request (With Existing Script):** User wants: "Now make it bold too". Existing script: "document.querySelector('p').style.color = 'blue';"
**Example JSON Output:**
{
  "response": "Okay, I'll try to update your modification to also make the text bold.",
  "is_code_needed": true
}

**Example Request (General Question):** "What is CSS?"
**Example JSON Output:**
{
  "response": "CSS stands for Cascading Style Sheets. It's used to describe the presentation of a document written in HTML.",
  "is_code_needed": false
}
`;
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }
    // MODIFIED: Parse additional optional fields
    const { prompt, selected_element_selector, existing_script_content } = await req.json();
    if (!prompt) {
      throw new Error("Missing 'prompt' in request body.");
    }
    console.log(`[analyze-prompt] Received prompt: "${prompt}"`);
    if (selected_element_selector) {
      console.log(`[analyze-prompt] Selected Element: "${selected_element_selector}"`);
    }
    if (existing_script_content) {
      console.log(`[analyze-prompt] Existing Script Content (first 100 chars): "${existing_script_content.substring(0, 100)}..."`);
    }
    // MODIFIED: Construct the full prompt for Gemini based on available context
    let fullUserPromptForGemini = `User wants: "${prompt}"`;
    if (selected_element_selector) {
      fullUserPromptForGemini += `\nSelected element: "${selected_element_selector}"`;
    }
    if (existing_script_content) {
      fullUserPromptForGemini += `\nExisting script to consider: "${existing_script_content}"`;
    }
    const geminiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: SYSTEM_PROMPT_ANALYZE
            }
          ]
        },
        {
          role: "model",
          parts: [
            {
              text: "Okay, I understand the JSON format and how to consider existing scripts or selected elements. Ready for the user's request."
            }
          ]
        },
        {
          role: "user",
          parts: [
            {
              text: fullUserPromptForGemini
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    };
    console.log("[analyze-prompt] Sending request to Gemini with full context...");
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiRequestBody)
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[analyze-prompt] Gemini API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`Gemini API request failed: ${res.status} ${res.statusText}`);
    }
    const geminiResponse = await res.json();
    let analysisResult = {
      response: "Error: Could not parse Gemini analysis.",
      is_code_needed: false
    };
    if (geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const parsedJson = JSON.parse(geminiResponse.candidates[0].content.parts[0].text);
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
    return new Response(JSON.stringify(analysisResult), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("Error in analyze-prompt Edge Function:", error);
    return new Response(JSON.stringify({
      error: error.message,
      response: `Error: ${error.message}`,
      is_code_needed: false
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
console.log(`Function "analyze-prompt" up and running!`);
