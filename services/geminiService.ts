
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
    // Standard initialization per guidelines.
    // Assuming process.env.API_KEY is provided by the environment.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

      // Ensure history ends on 'model' to alternate with the new 'user' message
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        validHistory.pop();
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [...validHistory, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `Satsang Saar AI. You are the Librarian of the Vachanãmrut. Use Vachanãmrut authority. ${VACHANAMRUT_CORE} Provide guidance based on these 273 discourses. Always use precise citations like [Gadhada I-1] or [Vartal 11].`,
          temperature: 0.3,
        },
      });

      return response.text || "I apologize, but I couldn't generate a spiritual response at this moment.";
    } catch (error: any) {
      console.error("Gemini API Error Detail:", error);
      
      const errorMsg = error?.message || "";
      
      // Handle known API response errors gracefully
      if (errorMsg.includes("403") || errorMsg.includes("permission")) {
        return "Access Denied: The spiritual archives are currently restricted in this region or for this key.";
      }
      if (errorMsg.includes("429") || errorMsg.includes("quota")) {
        return "The archives are currently receiving too many requests. Please pause for a moment.";
      }
      if (errorMsg.includes("401") || errorMsg.includes("API key not valid")) {
        return "The spiritual connection is unverified. Please check the environment configuration (API Key).";
      }

      return "I am currently unable to consult the archives. Please verify your connection and try again.";
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
