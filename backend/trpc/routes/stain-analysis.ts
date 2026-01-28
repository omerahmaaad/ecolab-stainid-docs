import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { OAUTH_CONFIG, TokenCache, buildTokenRequestBody } from "@/utils/oauth-config";

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && now < tokenCache.expiresAt) {
    console.log('[Backend] Using cached token');
    return tokenCache.token;
  }

  console.log('[Backend] Fetching new token...');

  const response = await fetch(OAUTH_CONFIG.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildTokenRequestBody(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Backend] Token fetch failed:', response.status, errorText);
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 300) * 1000,
  };

  console.log('[Backend] Token fetched successfully');
  return data.access_token;
}

export const stainAnalysisRouter = createTRPCRouter({
  analyze: publicProcedure
    .input(
      z.object({
        imageWithFlash: z.string(),
        imageWithoutFlash: z.string(),
        aiModel: z.string().default("gemma"),
        apiLanguage: z.string().default("english"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const token = await getAccessToken();
        
        const endpoint = 'https://api-cloudhubcentral-dev.ecolab.com/databricks-proxy/api/v1/serving-endpoints/ecolab-stainid-multiagent/invocations';
        
        const PROMPT_TEXT = `Analyze these two images (No Flash vs. Flash) to identify the stain.
1. No Flash: Shows natural color (Check for greenish undertones vs tan/orange).
2. Flash: Shows texture (Check for wicking vs surface sitting).

CRITICAL: Differentiate between Foundation (wicked/soft edges) and Blood (wicked/greenish).

Identify the stain from this specific list ONLY:
- Foundation
- Iron
- Sunscreen
- Abuse - Carbon Black Staining
- Mascara
- Lipstick
- Blood
- Ink/Dye/Hair Dye
- Food Soil (Grease)
- Dirt
- Body Soil/Lotion

Return the result in JSON format with fields: "Stain" (must be one from the list above), "Stain Type", "Ecolab Treatment", "Stain Analysis" (brief reasoning).`;
        
        const requestBody = {
          input: [
            {
              role: "user",
              content: PROMPT_TEXT
            },
            {
              role: "user",
              content: `data:image/jpeg;base64,${input.imageWithoutFlash}`
            },
            {
              role: "user",
              content: `data:image/jpeg;base64,${input.imageWithFlash}`
            }
          ],
          custom_inputs: {
            model: input.aiModel,
            language: input.apiLanguage
          },
          params: {
            max_tokens: 1000,
            temperature: 0.0
          }
        };
        
        console.log('[Backend] Sending BOTH images - NoFlash:', input.imageWithoutFlash.length, 'Flash:', input.imageWithFlash.length);
        
        console.log('[Backend] Sending request to Databricks...');
        console.log('[Backend] Request body:', JSON.stringify(requestBody).substring(0, 500));
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('[Backend] Response status:', response.status);
        console.log('[Backend] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Backend] API error:', response.status, errorText.substring(0, 500));
          throw new Error(`Databricks API returned ${response.status}: ${errorText.substring(0, 100)}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        console.log('[Backend] Content-Type:', contentType);
        
        if (!contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('[Backend] Non-JSON response received:', textResponse.substring(0, 500));
          throw new Error(`Databricks returned non-JSON response. Content-Type: ${contentType}. Response preview: ${textResponse.substring(0, 100)}`);
        }
        
        let data: any;
        const responseText = await response.text();
        console.log('[Backend] Raw response text:', responseText.substring(0, 500));
        
        try {
          data = JSON.parse(responseText);
          console.log('[Backend] Successfully parsed JSON response');
          console.log('[Backend] Response keys:', Object.keys(data));
        } catch (parseError: any) {
          console.error('[Backend] Failed to parse JSON:', parseError.message);
          console.error('[Backend] Response text:', responseText.substring(0, 1000));
          throw new Error(`Failed to parse Databricks response as JSON: ${parseError.message}. Response: ${responseText.substring(0, 100)}`);
        }
        
        return data;
      } catch (error: any) {
        console.error('[Backend] Error:', error);
        throw new Error(error.message || 'Failed to analyze stain');
      }
    }),
});