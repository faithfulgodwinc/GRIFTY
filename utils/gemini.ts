import { GoogleGenerativeAI } from '@google/generative-ai';

// Access environment variable directly for Expo
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
} else {
    console.warn('Gemini API Key is missing. Please check .env file.');
}

export const generateGeminiResponse = async (prompt: string, modelName: string = 'gemini-3-flash-preview') => {
    try {
        if (!genAI) {
            if (API_KEY) {
                genAI = new GoogleGenerativeAI(API_KEY);
            } else {
                throw new Error('Gemini API Key is not configured.');
            }
        }

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating Gemini response:', error);
        // Return a friendly error message to the chat UI
        return "I'm having trouble connecting to my brain right now. Please check your internet connection or API key configuration.";
    }
};
