
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
  // Use a getter to ensure GoogleGenAI is initialized correctly using process.env.API_KEY
  private get ai() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  async generateCommunityContent(language: Language) {
    const aiClient = this.ai;
    if (!aiClient) return null;
    try {
      const target = language === Language.GU ? "Gujarati" : "English";
      const response = await aiClient.models.generateContent({
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
      // Extract generated text directly from response.text property
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("Gemini generateCommunityContent error:", error);
      return null;
    }
  }

  async getSpiritualGuidance(prompt: string, language: Language, history: any[] = [], attachedFile?: FilePart) {
    const aiClient = this.ai;
    if (!aiClient) return "API Key missing.";
    try {
      // Correctly build user parts to include prompt text and potential file data
      const userParts: any[] = [{ text: prompt }];
      if (attachedFile) {
        userParts.push({
          inlineData: {
            data: attachedFile.data,
            mimeType: attachedFile.mimeType,
          },
        });
      }

      const response = await aiClient.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: [...history, { role: 'user', parts: userParts }],
        config: {
          systemInstruction: `Satsang Saar AI. Use Vachanãmrut authority. ${VACHANAMRUT_CORE} Provide guidance based on these discourses.`,
          temperature: 0.2,
        },
      });
      // Extract generated text directly from response.text property
      return response.text || "I apologize, but I couldn't generate a response.";
    } catch (error) {
      console.error("Gemini getSpiritualGuidance error:", error);
      return "Unable to connect to the spiritual advisor at this time.";
    }
  }

  async transliterateBhajan(text: string, targetScript: 'Latin' | 'Gujarati') {
    const aiClient = this.ai;
    if (!aiClient) return null;
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Transliterate the following text into ${targetScript} script: ${text}`,
        config: { temperature: 0.1 }
      });
      // Extract generated text directly from response.text property
      return response.text || null;
    } catch (error) {
      console.error("Gemini transliterateBhajan error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
