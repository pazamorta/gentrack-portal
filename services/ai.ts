
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface GenerateContentRequest {
    prompt?: string;
    image?: {
        mimeType: string;
        data: string; // base64
    };
    media?: {
        mimeType: string;
        data: string; // base64
    };
    model?: string;
    systemInstruction?: string;
    responseModalities?: any[]; 
    speechConfig?: any;
}

export interface GenerateContentResponse {
    text: string;
    candidates?: any[];
    error?: string;
}

export const aiService = {
    /**
     * Generate content using Gemini via the secure backend proxy
     */
    generateContent: async (request: GenerateContentRequest): Promise<GenerateContentResponse> => {
        try {
            const response = await fetch(`${API_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }
};
