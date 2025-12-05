
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get API key (Environment Variable OR LocalStorage for User Override)
const getApiKey = () => {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey) return localKey;
  return process.env.API_KEY || '';
}

const createAI = () => {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export interface AiAnalysisResult {
  score: number;
  reasoning: string;
  isRelevant: boolean;
}

export const analyzePostWithGemini = async (postContent: string, keywords: string[], negativeKeywords: string[]): Promise<AiAnalysisResult> => {
  const ai = createAI();
  
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

export const generateDraftEmail = async (leadName: string, company: string, postContent: string, myName: string = "LinkScout User"): Promise<string> => {
  const ai = createAI();
  
  if (!ai) {
    return `Subject: Regarding your post about automation\n\nHi ${leadName.split(' ')[0]},\n\nI saw your post on LinkedIn about automation challenges at ${company}. We help companies streamline exactly that.\n\nBest,\n${myName}`;
  }

  try {
    const prompt = `
      Write a short, cold outreach email to a prospect found on LinkedIn.
      
      Prospect Name: ${leadName}
      Company: ${company}
      Context (Their LinkedIn Post): "${postContent}"
      My Name: ${myName}
      
      Guidelines:
      1. Keep it under 100 words.
      2. Reference their specific problem from the post (Personalization).
      3. Casual but professional tone.
      4. Include a Subject Line.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Error generating draft.";
  } catch (error) {
    console.error("Gemini Email Gen Failed", error);
    return "Error generating email draft. Please check API key.";
  }
}

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
