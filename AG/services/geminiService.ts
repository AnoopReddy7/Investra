
import { GoogleGenAI } from "@google/genai";
import { apiService } from "./apiService";

// Helper to get a fresh AI instance
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.includes('YOUR_KEY')) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

// Fallback logic for UI stability
const getFallbackResponse = (query: string, context: any): string => {
  const q = query.toLowerCase();
  const financials = context?.financials || {};
  const balance = context?.userProfile?.balance || 0;
  const currency = (val: number) => val?.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }) || '₹0';

  if (q.includes('hello') || q.includes('hi')) return "Hello! I'm in **offline mode** because the API key isn't reaching the app correctly. Check your `vite.config.ts`.";
  
  return `I'm having trouble connecting to the AI brain right now. \n\nHowever, I can see your current local balance is **${currency(balance)}**.`;
};

/**
 * analyzeBankStatement: Uses Gemini Vision to extract the REAL balance
 */
export const analyzeBankStatement = async (base64Data: string, mimeType: string): Promise<{ balance: number; currency: string }> => {
  try {
    const ai = getAI();
    // Use the latest flash model for best OCR performance
    const model = 'gemini-3-flash-preview';
    
    const prompt = `
      CRITICAL TASK: Extract the Final Closing Balance from this bank statement.
      
      RULES:
      1. Look for "Closing Balance", "Available Balance", "Net Balance", or the very last numerical entry in the "Balance" column.
      2. Ignore "Total Credits" or "Total Debits".
      3. Return ONLY a valid JSON object. 
      4. Format: {"balance": 12345.67, "currency": "INR"}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } }, 
          { text: prompt }
        ]
      },
      config: { 
        temperature: 0.1, // High precision
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text || "";
    
    // Robust parsing: extract JSON even if AI adds extra text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Clean currency formatting if AI returned a string (e.g., "12,500.00")
    const cleanBalance = typeof result.balance === 'string' 
      ? parseFloat(result.balance.replace(/[^0-9.]/g, ''))
      : result.balance;

    if (isNaN(cleanBalance)) throw new Error("Balance is not a number");

    return {
      balance: cleanBalance,
      currency: result.currency || 'INR'
    };
  } catch (error) {
    console.error("AI Statement Analysis Failed:", error);
    // Return 0 so the user knows extraction failed rather than seeing a fake number
    return { balance: 0, currency: 'INR' };
  }
};

/**
 * chatWithFinancialAssistant: Main Chat Logic
 */
export const chatWithFinancialAssistant = async (message: string, history: any[]): Promise<string> => {
  let context: any = {};
  try {
      context = await apiService.getFinancialContext();
  } catch (e) {}

  try {
    const ai = getAI();
    const contextString = JSON.stringify(context || {});

    const systemInstruction = `
      You are INVESTRA Assist, a high-end financial advisor.
      USER DATA: ${contextString}
      INSTRUCTIONS: Always use INR (₹). Be specific about the user's balance. 
      Current user balance is: ${context?.userProfile?.balance || 'Unknown'}.
    `;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview', 
      config: { systemInstruction },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I processed that, but had no text output.";

  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return getFallbackResponse(message, context);
  }
};

export const getFinancialAdvice = async (userContext: any): Promise<string> => {
   try {
     const ai = getAI();
     const prompt = `Context: ${JSON.stringify(userContext)}. Give one short, actionable financial tip based on their balance and goals.`;
     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: prompt
     });
     return response.text || "Track your spending to build wealth.";
   } catch (e) {
     return "Review your high-interest debts first.";
   }
};
