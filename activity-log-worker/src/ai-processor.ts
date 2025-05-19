// Assuming env.AI is bound to the AI Gateway

interface AiResponse {
  summary: string;
  tags: string[];
}

/**
 * Processes text using the AI Gateway to get a summary and tags.
 */
export async function processTextWithAI(ai: any, textContent: string): Promise<{ summary: string, tagsJson: string } | null> {
  if (!textContent || textContent.trim().length === 0) {
    console.log('[AI Processor] No text content to process.');
    return { summary: '', tagsJson: '[]' }; // Return empty if no text
  }

  // Truncate very long text to avoid hitting model limits unexpectedly
  const MAX_TEXT_LENGTH = 15000; // Adjust as needed
  const truncatedText = textContent.length > MAX_TEXT_LENGTH
    ? textContent.slice(0, MAX_TEXT_LENGTH)
    : textContent;

  const prompt = `Given the following web page text content, provide a concise one-paragraph summary and suggest 2-7 relevant topic tags as a JSON array of strings.

Respond ONLY with a JSON object containing two keys: "summary" (string) and "tags" (JSON array of strings).

Example Response Format:
{
  "summary": "A concise summary of the text.",
  "tags": ["tag1", "tag2", "tag3"]
}

Text Content:
---
${truncatedText}
---

JSON Response:`;

  try {
    console.log('[AI Processor] Sending request to AI Gateway...');
    // Note: The specific model is usually configured in the Gateway itself or part of the URL binding.
    // If using the generic URL like the one set in wrangler.toml, you might need to append the model name.
    // Let's assume the Gateway URL correctly routes to @cf/meta/llama-4-scout-17b-16e-instruct
    // The model returns the JSON string inside a 'response' field.
    const rawAiResult = await ai.run('@cf/meta/llama-4-scout-17b-16e-instruct', { prompt });

    console.log('[AI Processor] Received AI response.');

    // Extract and parse the JSON string from the 'response' field
    let parsedResponse: AiResponse | null = null;
    if (rawAiResult && typeof rawAiResult.response === 'string') {
      try {
        parsedResponse = JSON.parse(rawAiResult.response.trim());
        console.log('[AI Processor] Successfully parsed AI response JSON.');
      } catch (parseError) {
        console.error('[AI Processor] Failed to parse JSON from AI response:', parseError);
        console.error('[AI Processor] Raw AI response string:', rawAiResult.response);
      }
    } else {
      console.error('[AI Processor] AI raw result did not contain a response string:', rawAiResult);
    }

    // Validate the *parsed* response structure
    if (parsedResponse && typeof parsedResponse.summary === 'string' && Array.isArray(parsedResponse.tags)) {
      // Ensure tags are strings
      const validTags = parsedResponse.tags.filter((tag: any) => typeof tag === 'string');
      return {
        summary: parsedResponse.summary.trim(),
        tagsJson: JSON.stringify(validTags) // Store tags as JSON string
      };
    } else {
      console.error('[AI Processor] Parsed AI response has unexpected format or parsing failed:', parsedResponse);
      // Fallback: return the raw text as summary and empty tags
      return { summary: truncatedText.slice(0, 200) + '... (AI processing failed)', tagsJson: '[]' };
    }

  } catch (error) {
    console.error('[AI Processor] Error calling AI Gateway:', error);
    // Fallback on error
    return { summary: truncatedText.slice(0, 200) + '... (AI processing error)', tagsJson: '[]' };
  }
}

/**
 * Generates a vector embedding for the given text using the AI Gateway.
 */
export async function generateEmbedding(ai: any, textInput: string): Promise<number[] | null> {
  if (!textInput || textInput.trim().length === 0) {
    console.log('[AI Processor - Embedding] No text content to generate embedding for.');
    return null;
  }

  // Embedding models have token limits. bge-small-en-v1.5 has a max sequence length of 512 tokens.
  // A simple character limit can act as a safeguard. Average 4 chars/token. 512*4 = 2048.
  const MAX_EMBEDDING_TEXT_LENGTH = 2000; // Keep it slightly under the theoretical max character count
  const text = textInput.length > MAX_EMBEDDING_TEXT_LENGTH
    ? textInput.slice(0, MAX_EMBEDDING_TEXT_LENGTH)
    : textInput;

  try {
    console.log(`[AI Processor - Embedding] Requesting embedding for text (original length: ${textInput.length}, effective length: ${text.length}).`);
    const model = '@cf/baai/bge-small-en-v1.5';
    const response = await ai.run(model, { text });

    // Expected response structure: { shape: [number_of_inputs, dimensions], data: [ [embedding_vector_for_input1], ... ] }
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0 &&
        Array.isArray(response.data[0]) && response.data[0].length > 0) {
      console.log(`[AI Processor - Embedding] Successfully generated embedding. Dimensions: ${response.data[0].length}`);
      return response.data[0]; // Return the first (and only) embedding vector
    } else {
      console.error('[AI Processor - Embedding] Failed to generate embedding or AI response format is unexpected.');
      // Log the raw response for debugging, careful with large responses in production logs
      try {
        console.error('[AI Processor - Embedding] Raw AI response:', JSON.stringify(response).slice(0, 500));
      } catch (e) {
        console.error('[AI Processor - Embedding] Raw AI response (unstringifiable):', response);
      }
      return null;
    }
  } catch (error) {
    console.error('[AI Processor - Embedding] Error calling AI Gateway for embedding:', error);
    return null;
  }
}
