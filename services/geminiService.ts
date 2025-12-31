import { GoogleGenAI } from "@google/genai";
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

[PHILOSOPHY]
- Concept of Akshar-Purushottam Upasana.
- The path to liberation (Moksha) through Dharma, Gnan, Vairagya, and Bhakti.
- The importance of the manifest Satpurush as the gateway to God.
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
    } else {
      console.warn("API_KEY not found in process.env. Ensure it's defined in Vite config.");
    }
  }

  async getSpiritualGuidance(
    prompt: string, 
    language: Language,
    history: { role: 'user' | 'model', parts: { text: string }[] }[] = [],
    attachedFile?: FilePart
  ) {
    if (!this.ai) {
      return language === Language.GU 
        ? "ક્ષમા કરશો, અત્યારે જોડાણ થઈ શકતું નથી (API કી ખૂટે છે)."
        : "I am unable to connect to the divine volumes at this moment (API Key missing).";
    }

    try {
      const userParts: any[] = [{ text: prompt }];
      
      if (attachedFile) {
        userParts.unshift({
          inlineData: {
            data: attachedFile.data,
            mimeType: attachedFile.mimeType
          }
        });
      }

      const langInstruction = language === Language.GU 
        ? "Respond strictly in GUJARATI. Cite using [વિભાગ-નંબર]."
        : "Respond strictly in ENGLISH. Cite using [Section-Number].";

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [
            ...history,
            { role: 'user', parts: userParts }
        ],
        config: {
          systemInstruction: `You are the "Satsang Saar AI", a digital librarian for the Vachanãmrut.
          
          PRIMARY SOURCE: ${VACHANAMRUT_CORE}
          
          STRICT RULES:
          1. Only use the Vachanãmrut as your primary authority.
          2. Always provide a citation at the end of each paragraph.
          3. Use a respectful, divine, and calm tone.
          4. If a user asks for something unrelated to spiritual life or the Vachanãmrut, politely guide them back to the spiritual path.
          
          ${langInstruction}`,
          temperature: 0.2,
        },
      });

      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return language === Language.GU 
        ? "ક્ષમા કરશો, અત્યારે જોડાણ થઈ શકતું નથી."
        : "I am unable to connect to the divine volumes at this moment. Please try again.";
    }
  }

  async translateBhajan(text: string, targetLanguage: Language) {
    if (!this.ai) return null;
    try {
      const target = targetLanguage === Language.GU ? "Gujarati" : "English";
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the following sacred bhajan into poetic ${target}. Maintain the verse structure (double line breaks between verses). Keep it spiritual and respectful.\n\nText:\n${text}`,
        config: {
          temperature: 0.3,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Translation Error:", error);
      return null;
    }
  }

  async transliterateBhajan(text: string, targetScript: 'Latin' | 'Gujarati') {
    if (!this.ai) return null;
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Transliterate the following bhajan text into ${targetScript} script. This is NOT a translation of meaning, only a change of the writing script so someone can recite it. If original is English, change to Gujarati characters. If original is Gujarati, change to Romanized English characters. Maintain verse structure.\n\nText:\n${text}`,
        config: {
          temperature: 0.1,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Transliteration Error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();