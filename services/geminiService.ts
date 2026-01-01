
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

// Initialize the AI client directly using the environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class GeminiService {
  async generateCommunityContent(language: Language) {
    try {
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
      // Correctly build user parts
      const userParts: any[] = [{ text: prompt }];
      if (attachedFile) {
        userParts.push({
          inlineData: {
            data: attachedFile.data,
            mimeType: attachedFile.mimeType,
          },
        });
      }

      // Gemini API history MUST start with a 'user' role message.
      // We filter out any initial 'model' greetings from the history array.
      const validHistory = history.filter((msg, index) => {
        if (index === 0 && msg.role === 'model') return false;
        return true;
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [...validHistory, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `Satsang Saar AI. You are the Librarian of the Vachanãmrut. Use Vachanãmrut authority. ${VACHANAMRUT_CORE} Provide guidance based on these 273 discourses. Always use precise citations.`,
          temperature: 0.3,
        },
      });

      return response.text || "I apologize, but I couldn't generate a spiritual response at this moment.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "The connection to the spiritual archives was interrupted. Please ensure your environment is correctly configured.";
    }
  }

  async transliterateBhajan(text: string, targetScript: 'Latin' | 'Gujarati') {
    try {
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
