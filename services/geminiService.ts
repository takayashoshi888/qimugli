import { GoogleGenAI } from "@google/genai";
import { WorkRecord } from "../types";

// Safe initialization: Check if process is defined to avoid "process is not defined" error in browser
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error
  }
  return undefined;
};

const apiKey = getApiKey() || 'dummy_key'; 
const ai = new GoogleGenAI({ apiKey });

export const generateInsightReport = async (records: WorkRecord[]): Promise<string> => {
  if (apiKey === 'dummy_key') {
    return "API Key 未配置。无法生成 AI 智能分析报告。请在环境配置中添加 API_KEY。";
  }

  try {
    const dataSummary = JSON.stringify(records.slice(0, 50)); // Limit context size
    
    const prompt = `
      作为一个高级数据分析师，请根据以下现场工作记录(JSON格式)生成一份简要的中文分析报告。
      重点关注：
      1. 总费用支出的主要构成。
      2. 出勤人员最多的现场。
      3. 任何异常或值得注意的趋势。
      4. 给管理层的建议。
      
      数据:
      ${dataSummary}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成报告。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "生成报告时发生错误，请稍后重试。";
  }
};