import { GoogleGenAI, Type } from "@google/genai";

// NOTE: In a production app, never expose API keys on the client side.
// This is a demo/prototype "Control Panel" running locally or on a secure VPS dashboard.
const apiKey = process.env.API_KEY || ''; 

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface AiAnalysisResult {
  score: number;
  reasoning: string;
  isRelevant: boolean;
}

export const analyzePostWithGemini = async (postContent: string, keywords: string[], negativeKeywords: string[]): Promise<AiAnalysisResult> => {
  if (!ai) {
    console.warn("No API Key provided. Returning mock analysis.");
    return mockAnalysis(postContent, keywords);
  }

  try {
    const prompt = `
      You are an expert lead qualification bot. 
      Analyze the following LinkedIn post content to determine if it is a high-quality lead.
      
      TARGET KEYWORDS (Look for these): ${keywords.join(', ')}.
      NEGATIVE KEYWORDS (Disqualify if present/implied): ${negativeKeywords.join(', ')}.

      Post Content: "${postContent}"

      Instructions:
      1. If the post contains negative keywords or implies the user is SELLING something rather than BUYING, score it low.
      2. If the user is looking for a job (candidate) rather than looking to hire (employer), mark as irrelevant.
      3. Determine a relevance score (0-100).
      
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            isRelevant: { type: Type.BOOLEAN },
          },
          required: ["score", "reasoning", "isRelevant"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AiAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return mockAnalysis(postContent, keywords);
  }
};

const mockAnalysis = (content: string, keywords: string[]): AiAnalysisResult => {
  // Simple heuristic fallback if API fails or is missing
  const hasKeyword = keywords.some(k => content.toLowerCase().includes(k.toLowerCase()));
  return {
    isRelevant: hasKeyword,
    score: hasKeyword ? 85 : 20,
    reasoning: hasKeyword 
      ? "Post contains target keywords and appears to be a direct request." 
      : "Post does not contain relevant keywords.",
  };
};