
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
    // Accessing process.env.API_KEY directly as per guidelines.
    // If the error 401 persists, it indicates the key itself is invalid 
    // or not being injected correctly by the hosting environment.
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

      // History Validation: Strict user -> model alternation
      const validHistory = [];
      let nextRole = 'user';
      
      for (const turn of history) {
        if (turn.role === nextRole) {
          validHistory.push({
            role: turn.role,
            parts: turn.parts || [{ text: turn.text }]
          });
          nextRole = nextRole === 'user' ? 'model' : 'user';
        }
      }

      // Ensure history ends on model to alternate with our current user turn
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

      return response.text || "The model returned an empty guidance. Please rephrase your query.";
    } catch (error: any) {
      console.error("Satsang AI Error:", error);
      const msg = error?.message || "";
      
      if (msg.includes("401")) {
        return "Unauthorized (401): The connection to the spiritual archives (API Key) is invalid. Please check your environment configuration.";
      }
      if (msg.includes("429")) {
        return "Too Many Requests (429): Many devotees are consulting the Guru right now. Please wait a moment.";
      }
      if (msg.includes("API_KEY_INVALID")) {
        return "The provided API Key is not authorized for this service.";
      }

      return `Spiritual archives are currently unreachable. (Details: ${msg || "Unknown error"})`;
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
