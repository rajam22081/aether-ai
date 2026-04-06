import { GoogleGenAI } from "@google/genai";
import { Message, ModelProvider } from "../types";

const _gemKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = _gemKey ? new GoogleGenAI({ apiKey: _gemKey }) : null;

export async function orchestrateResponse(
  messages: Message[],
  context: "general" | "agent" = "general"
): Promise<{ content: string; model: string; provider: ModelProvider }> {
  const lastMessage = messages[messages.length - 1].content;

  // 1. Analyze complexity to choose model
  // In a real multi-LLM setup, we'd check process.env for other keys.
  // For now, we use Gemini 3.1 Flash for light and 3.1 Pro for heavy.
  
  const isHeavy = lastMessage.length > 300 || 
                  /analyze|research|complex|code|math|debate|synthesis/i.test(lastMessage);

  const modelName = isHeavy ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: context === "agent" 
          ? "You are a specialized guide for mindfulness and inner peace. Your voice is soft, patient, and deeply calming. Help the user find stillness, improve their sleep, or build positive habits with gentle, meditative guidance."
          : "You are Aether, a companion for stillness and meditative reflection. Your tone is warm, muted, and exceptionally calm. Help the user breathe, untangle their heart, and find peace in the present moment. Focus on calmness, sleep, and positive habit formation."
      }
    });

    return {
      content: response.text || "I encountered an issue generating a response.",
      model: modelName,
      provider: 'gemini'
    };
  } catch (error) {
    console.error("LLM Error:", error);
    return {
      content: "I'm sorry, I'm having trouble connecting to the neural network right now.",
      model: "error",
      provider: 'gemini'
    };
  }
}
