
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeStatement = async (
  input: string | { data: string; mimeType: string }
): Promise<AnalysisResult> => {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an expert financial analyst. Your task is to extract all transactions from the provided bank or credit card statement.
    Categorize each transaction into one of these buckets: ${Object.values(Category).join(', ')}.
    
    Rules:
    1. Extract the Date, Merchant/Description, and Amount.
    2. Convert amounts to positive numbers (expenses).
    3. Treat the currency as INR (Indian Rupee).
    4. Ignore credit/payment transactions unless they are refunds (return as negative if refund).
    5. Categorize based on merchant names (e.g., Uber/Ola -> Travel, Swiggy/Zomato -> Food, Amazon/Flipkart -> Shopping).
    6. Return valid JSON only.
    7. "id" should be a unique string.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      transactions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO 8601 format date (YYYY-MM-DD) if available" },
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: Object.values(Category) },
            originalDescription: { type: Type.STRING }
          },
          required: ["id", "date", "merchant", "amount", "category"]
        }
      },
      totalAmount: { type: Type.NUMBER },
      currency: { type: Type.STRING }
    },
    required: ["transactions", "totalAmount"]
  };

  const prompt = typeof input === 'string' 
    ? `Analyze this Indian bank statement text: \n\n${input}`
    : {
        parts: [
          { text: "Extract transactions from this Indian bank statement image and categorize them into INR values." },
          { inlineData: input }
        ]
      };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: typeof prompt === 'string' ? prompt : [prompt],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const result = JSON.parse(response.text);
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze statement. Please ensure the input is clear.");
  }
};
