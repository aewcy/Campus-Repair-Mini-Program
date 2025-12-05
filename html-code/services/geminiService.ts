import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not defined in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeRepairRequest = async (description: string, category: string) => {
  const client = getClient();
  if (!client) return "无法连接AI服务，请检查API Key配置。";

  try {
    const prompt = `
      作为一个专业的维修顾问，请根据用户的描述分析维修问题。
      维修类别: ${category}
      用户描述: ${description}

      请提供以下信息：
      1. 可能的故障原因 (简短)
      2. 建议的维修方案 (简短)
      3. 预估维修难度 (低/中/高)

      请用中文回答，不要使用Markdown格式，直接输出纯文本，控制在100字以内。
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return "AI分析暂时不可用，请稍后重试。";
  }
};