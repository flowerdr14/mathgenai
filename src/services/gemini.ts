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
      body: JSON.stringify({ params }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "문제를 생성하는 중 오류가 발생했습니다.");
    }

    const problems = await response.json();
    return problems.map((p: any, index: number) => ({
      ...p,
      id: p.id || `problem-${Date.now()}-${index}`,
    }));
  } catch (error: any) {
    console.error("API Error:", error);
    throw error;
  }
};
