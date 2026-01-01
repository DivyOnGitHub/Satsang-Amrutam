
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
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
      throw new Error("API_KEY_MISSING");
    }
    return new GoogleGenAI({ apiKey });
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

      // Gemini API Requirements:
      // 1. History must start with a 'user' role.
      // 2. Roles must strictly alternate: user, model, user, model...
      let validHistory = [];
      let nextExpectedRole = 'user';

      for (const msg of history) {
        if (msg.role === nextExpectedRole) {
          validHistory.push(msg);
          nextExpectedRole = nextExpectedRole === 'user' ? 'model' : 'user';
        }
      }

      // If after filtering we ended on a 'user' message, the next turn (which we are sending now)
      // would be a 'user' message again, which is invalid. 
      // We must ensure the last message in history is 'model' or history is empty.
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        // We can't have two user messages in a row.
        // If the last history item was user, we might need to remove it or wrap it.
        // For simplicity, if history ends in 'user', we just take the messages up to the last 'model'.
        const lastModelIndex = validHistory.map(m => m.role).lastIndexOf('model');
        if (lastModelIndex !== -1) {
          validHistory = validHistory.slice(0, lastModelIndex + 1);
        } else {
          validHistory = [];
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash for better region availability
        contents: [...validHistory, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `Satsang Saar AI. You are the Librarian of the Vachanãmrut. Use Vachanãmrut authority. ${VACHANAMRUT_CORE} Provide guidance based on these 273 discourses. Always use precise citations like [Gadhada I-1] or [Vartal 11].`,
          temperature: 0.3,
        },
      });

      return response.text || "I apologize, but I couldn't generate a spiritual response at this moment.";
    } catch (error: any) {
      console.error("Gemini API Error Detail:", error);
      
      if (error.message === "API_KEY_MISSING") {
        return "The API Key is missing. Please ensure 'API_KEY' is set in your Vercel Environment Variables.";
      }

      // Check for common API errors
      const errorMsg = error?.message || "";
      if (errorMsg.includes("403") || errorMsg.includes("permission")) {
        return "Access Denied (403): Your API Key does not have permission to use this model or region.";
      }
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        return "Too Many Requests (429): The spiritual archives are currently busy. Please wait a moment.";
      }
      if (errorMsg.includes("401") || errorMsg.includes("key")) {
        return "Invalid API Key (401): Please verify the key in your settings.";
      }

      return `Connection Error: ${errorMsg || "The spiritual archives are currently unreachable. Please check your network."}`;
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
