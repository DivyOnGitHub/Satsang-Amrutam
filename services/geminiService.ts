
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
`;

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey });
      } catch (e) {
        console.error("Failed to initialize Gemini AI:", e);
      }
    }
  }

  async generateCommunityContent(language: Language) {
    if (!this.ai) return null;
    try {
      const target = language === Language.GU ? "Gujarati" : "English";
      const response = await this.ai.models.generateContent({
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
      return JSON.parse(response.text);
    } catch (error) {
      return null;
    }
  }

  async getSpiritualGuidance(prompt: string, language: Language, history: any[] = [], attachedFile?: FilePart) {
    if (!this.ai) return "API Key missing.";
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: `Satsang Saar AI. Use Vachanãmrut authority.`,
          temperature: 0.2,
        },
      });
      return response.text;
    } catch (error) {
      return "Unable to connect.";
    }
  }

  async transliterateBhajan(text: string, targetScript: 'Latin' | 'Gujarati') {
    if (!this.ai) return null;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Transliterate into ${targetScript}: ${text}`,
        config: { temperature: 0.1 }
      });
      return response.text;
    } catch (error) {
      return null;
    }
  }
}

export const geminiService = new GeminiService();
