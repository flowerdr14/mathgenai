import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for problem generation
  app.post("/api/generate-problems", async (req, res) => {
    try {
      const { params } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("GEMINI_API_KEY is not set in the environment.");
        return res.status(500).json({ 
          error: "서버 설정 문제: GEMINI_API_KEY가 설정되지 않았습니다." 
        });
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

      const response = await ai.models.generateContent({ 
        model: "gemini-3.1-pro-preview",
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
      res.json(problems);
    } catch (error: any) {
      console.error("Gemini API Error (Server):", error);
      
      let clientMessage = "문제 생성 중 서버 오류가 발생했습니다.";
      if (error.message?.includes("API key not valid") || error.message?.includes("INVALID_ARGUMENT")) {
        clientMessage = "서버의 API 키 설정이 올바르지 않습니다.";
      } else if (error.message?.includes("quota") || error.message?.includes("429")) {
        clientMessage = "API 호출 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.";
      }
      
      res.status(500).json({ error: clientMessage, details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
