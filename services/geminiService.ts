
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const categorizeQuestion = async (questionText: string) => {
  try {
    const prompt = `Categorize this teacher feedback question into exactly one of these categories: [Pedagogy, Classroom Management, Emotional Support, Punctuality, Subject Knowledge]. 
    Question: "${questionText}"
    Return ONLY the category name.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "General";
  } catch (error) {
    return "General";
  }
};

export const generateTeacherInsights = async (teacherName: string, records: any[]) => {
  try {
    const prompt = `Analyze these feedback scores for teacher "${teacherName}".
    Data: ${JSON.stringify(records)}
    Provide a 2-sentence summary of overall sentiment and the highest scoring area.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "No insights available yet.";
  } catch (error) {
    return "AI Insights currently unavailable.";
  }
};
