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

[STRUCTURE]
Sections: Gadhadã I, Sãrangpur, Kãriyãni, Loyã, Panchãlã, Gadhadã II, Vartãl, Amdãvãd, Gadhadã III.
Total Discourses: 273.
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

  async generateCommunityBhajan(language: Language) {
    if (!this.ai) return null;
    try {
      const target = language === Language.GU ? "Gujarati" : "English";
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a spiritual devotee. Generate a short, beautiful, and authentic original bhajan about Bhagwan Swaminarayan or the Vachanamrut. 
        Respond in JSON format with 'title', 'artist' (a generic devotee name like 'A Devotee from Rajkot'), and 'lyrics'.
        The language must be ${target}.`,
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
          },
          temperature: 0.9,
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Global Feed Error:", error);
      return null;
    }
  }

  async getSpiritualGuidance(
    prompt: string, 
    language: Language,
    history: { role: 'user' | 'model', parts: { text: string }[] }[] = [],
    attachedFile?: FilePart
  ) {
    if (!this.ai) {
      return language === Language.GU ? "API કી ખૂટે છે." : "API Key missing.";
    }

    try {
      const userParts: any[] = [{ text: prompt }];
      if (attachedFile) {
        userParts.unshift({ inlineData: { data: attachedFile.data, mimeType: attachedFile.mimeType } });
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [...history, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `You are the "Satsang Saar AI", a digital librarian for the Vachanãmrut.
          PRIMARY SOURCE: ${VACHANAMRUT_CORE}
          STRICT RULES:
          1. Only use the Vachanãmrut as your primary authority.
          2. Always provide a citation.
          3. Tone: Divine and calm.`,
          temperature: 0.2,
        },
      });
      return response.text;
    } catch (error) {
      return "Unable to connect at this moment.";
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