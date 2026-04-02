import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  // Running Advice
  async getRunningAdvice(prompt: string, persona: string = "Expert Running Coach") {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Persona: ${persona}\n\nUser Question: ${prompt}`,
      config: {
        systemInstruction: "You are a professional running coach. Provide concise, actionable advice for runners of all levels.",
      }
    });
    return response.text;
  },

  // Fridge Analysis
  async analyzeFridgeImage(base64Image: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
        { text: "Identify all food ingredients visible in this fridge. Return them as a simple list of strings." }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || '[]');
  },

  // Recipe Suggestion
  async suggestRecipes(ingredients: string[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these ingredients: ${ingredients.join(', ')}, suggest 3 healthy recipes for a runner. Provide title, ingredients, instructions, and calories.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              calories: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              time: { type: Type.STRING }
            },
            required: ["title", "ingredients", "instructions", "calories"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  }
};
