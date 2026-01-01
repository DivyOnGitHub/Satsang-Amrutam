
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

export interface FilePart {
  data: string;
  mimeType: string;
}

const VACHANAMRUT_CORE = `
[CANONICAL SOURCE: THE VACHANÃMRUT]
Discourses delivered by Bhagwãn Swãminãrãyan (1819-1829 CE).
This is the supreme spiritual text of the Swaminarayan Sampraday.
It contains 273 discourses recorded by four senior paramhansas.
`;

export class GeminiService {
  private getClient() {
    // The API key is obtained from the environment.
    const apiKey = process.env.API_KEY;
    return new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async generateCommunityContent(language: Language) {
    try {
      const ai = this.getClient();
      const target = language === Language.GU ? "Gujarati" : "English";
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a spiritual community librarian. Generate one authentic original bhajan. 
        Respond in JSON with 'title', 'artist' (e.g. 'Devotee from Ahmedabad'), and 'lyrics'.
        Language: ${target}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              lyrics: { type: Type.STRING },
            },
            required: ["title", "artist", "lyrics"],
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini generateCommunityContent error:", error);
      return null;
    }
  }

  async getSpiritualGuidance(prompt: string, language: Language, history: any[] = [], attachedFile?: FilePart) {
    try {
      const ai = this.getClient();
      
      // Build user parts for the current turn
      const userParts: any[] = [{ text: prompt }];
      if (attachedFile) {
        userParts.push({
          inlineData: {
            data: attachedFile.data,
            mimeType: attachedFile.mimeType,
          },
        });
      }

      // Filter history to ensure strict alternation: user -> model -> user...
      // The API requires the sequence to start with 'user'.
      const validHistory = [];
      let nextRole = 'user';
      
      for (const turn of history) {
        if (turn.role === nextRole) {
          validHistory.push(turn);
          nextRole = nextRole === 'user' ? 'model' : 'user';
        }
      }

      // If validHistory ends with a 'user' message, we remove it because the current turn is 'user'
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        validHistory.pop();
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [...validHistory, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `You are the Librarian of the Vachanãmrut. You provide spiritual guidance based ONLY on the 273 discourses of Bhagwan Swaminarayan. ${VACHANAMRUT_CORE} Always cite your sources precisely (e.g., [Gadhada I-1]). Respond in ${language === Language.GU ? 'Gujarati' : 'English'}.`,
          temperature: 0.3,
        },
      });

      if (!response.text) {
        throw new Error("The model returned an empty response.");
      }

      return response.text;
    } catch (error: any) {
      console.error("Gemini Detailed Error:", error);
      
      // If the error message is available, show it for debugging, otherwise use categorized fallbacks
      const msg = error?.message || "";
      
      if (msg.includes("401") || msg.includes("key")) return "Unauthorized (401): The spiritual archives require a valid API key in the environment configuration.";
      if (msg.includes("403")) return "Forbidden (403): Access is restricted for this model in your current region.";
      if (msg.includes("429")) return "Rate Limited (429): The archives are currently busy. Please wait a moment.";
      if (msg.includes("500")) return "Server Error (500): The Google AI service is experiencing internal issues.";
      
      return `Connection Issue: ${msg || "Consultation interrupted. Please verify your network and check the browser console for details."}`;
    }
  }

  async transliterateBhajan(text: string, targetScript: 'Latin' | 'Gujarati') {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Transliterate the following text into ${targetScript} script: ${text}`,
        config: { temperature: 0.1 }
      });
      return response.text || null;
    } catch (error) {
      console.error("Transliteration error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
