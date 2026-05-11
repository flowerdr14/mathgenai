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
  try {
    const response = await fetch("/api/generate-problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "문제 생성에 실패했습니다.");
    }

    return result.map((p: any, index: number) => ({
      ...p,
      id: p.id || `problem-${Date.now()}-${index}`,
    }));
  } catch (error: any) {
    console.error("Generate API Error:", error);
    throw error;
  }
};
