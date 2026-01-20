
import { GoogleGenAI, Type } from "@google/genai";

// Helper to get API key from environment variable (secure) or localStorage fallback (dev only)
const getApiKey = (): string => {
  // Priority 1: Vite environment variable (recommended for production)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;

  // Priority 2: localStorage fallback (for development/demo purposes only)
  // WARNING: localStorage is not secure for production use
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey) return localKey;

  return '';
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
  
  // 1. Missing API Key: Use Mock Data (Demo Mode)
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
    if (!text) throw new Error("Empty response from Gemini API");
    return JSON.parse(text) as AiAnalysisResult;

  } catch (error: unknown) {
    console.error("Gemini Analysis Failed", error);

    // 2. API Errors: Return specific error reasoning instead of Mock Data
    let errorMessage = "AI Analysis failed due to an unknown error.";

    const errString = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (errString.includes('403') || errString.includes('key') || errString.includes('permission')) {
      errorMessage = "Error: Invalid API Key. Please update it in Workflow Config.";
    } else if (errString.includes('429') || errString.includes('quota') || errString.includes('resource exhausted')) {
      errorMessage = "Error: API Rate Limit Exceeded. Please try again later.";
    } else if (errString.includes('fetch') || errString.includes('network')) {
      errorMessage = "Error: Network connection failed. Please check your internet.";
    } else if (errString.includes('503') || errString.includes('overloaded')) {
      errorMessage = "Error: Gemini model is overloaded. Please retry.";
    }

    return {
      score: 0,
      isRelevant: false,
      reasoning: errorMessage
    };
  }
};

export const generateDraftEmail = async (leadName: string, company: string, postContent: string, myName: string = "LinkScout User"): Promise<string> => {
  const ai = createAI();
  
  if (!ai) {
    return `Subject: Regarding your post about automation\n\nHi ${leadName.split(' ')[0]},\n\nI saw your post on LinkedIn about automation challenges at ${company}. We help companies streamline exactly that.\n\nBest,\n${myName}\n\n(Note: This is a template. Add a Gemini API Key to generate real AI drafts.)`;
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

    if (!response.text) throw new Error("Empty response from Gemini API");
    return response.text;

  } catch (error: unknown) {
    console.error("Gemini Email Gen Failed", error);

    const errString = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (errString.includes('403') || errString.includes('key')) {
      return "Error: Invalid API Key. Please check your Workflow Config.";
    }
    if (errString.includes('429')) {
      return "Error: Rate Limit Exceeded. Please wait a moment.";
    }
    
    return "Error: Failed to generate draft. Please check your network connection and API key.";
  }
}

const mockAnalysis = (content: string, keywords: string[]): AiAnalysisResult => {
  // Simple heuristic fallback ONLY if API Key is missing entirely
  const hasKeyword = keywords.some(k => content.toLowerCase().includes(k.toLowerCase()));
  return {
    isRelevant: hasKeyword,
    score: hasKeyword ? 85 : 20,
    reasoning: hasKeyword 
      ? "Demo Mode: Post contains target keywords. (Add API Key for real analysis)" 
      : "Demo Mode: Post does not contain relevant keywords. (Add API Key for real analysis)",
  };
};
