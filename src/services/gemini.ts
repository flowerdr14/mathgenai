import { GoogleGenAI, Type } from "@google/genai";

export interface MathProblem {
  id: string;
  question: string;
  solution: string;
  explanation: string;
  difficulty: string;
  topic: string;
  schoolLevel?: string;
  grade?: string;
  semester?: string;
  mainUnit?: string;
  subUnit?: string;
  createdAt?: string;
}

export const generateMathProblems = async (params: {
  topic: string;
  difficulty: string;
  gradeLevel: string;
  semester: string;
  unit: string;
  subUnit: string;
  count: number;
}): Promise<MathProblem[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. AI Studio 설정에서 API 키를 확인해주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `다음 조건에 맞는 수학 문제 ${params.count}개를 생성해주세요.
대상: ${params.gradeLevel} (${params.semester})
대단원: ${params.unit}
소단원: ${params.subUnit} (포괄 주제: ${params.topic})
난이도: ${params.difficulty}

응답은 반드시 JSON 형식이어야 하며, 모든 텍스트(문제명, 문제, 정답, 해설 등)는 **한국어**로 작성되어야 합니다.
수식은 LaTeX 형식을 사용해주세요 (예: $x^2 + 2x + 1 = 0$).

각 문제 객체는 다음 필드를 포함해야 합니다:
- question: 수학 문제 (LaTeX 수식 포함 가능)
- solution: 최종 정답
- explanation: 단계별 상세 풀이 과정
- topic: 세부 주제명
- difficulty: 난이도

문제는 수학적으로 정확해야 하며, 지정된 학년 수준과 난이도에 적합해야 합니다.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              solution: { type: Type.STRING },
              explanation: { type: Type.STRING },
              topic: { type: Type.STRING },
              difficulty: { type: Type.STRING },
            },
            required: ["question", "solution", "explanation", "topic", "difficulty"],
          },
        },
      },
    });

    const problemsRaw = response.text;
    if (!problemsRaw) {
      throw new Error("Gemini로부터 응답을 받지 못했습니다.");
    }
    
    const problems = JSON.parse(problemsRaw);
    return problems.map((p: any, index: number) => ({
      ...p,
      id: p.id || `problem-${Date.now()}-${index}`,
    }));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
