import { 
  Calculator, 
  Settings, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  LayoutDashboard,
  History,
  ClipboardList,
  Search,
  Filter,
  Moon,
  Sun,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { generateMathProblems, MathProblem } from "./services/gemini";
import { KOREAN_CURRICULUM } from "./lib/curriculum";

const DIFFICULTIES = ["쉬움", "보통", "어려움", "전문가"];

export default function App() {
  const [schoolLevel, setSchoolLevel] = useState("중학교");
  const [grade, setGrade] = useState("1학년");
  const [semester, setSemester] = useState("1학기");
  const [mainUnit, setMainUnit] = useState("");
  const [subUnit, setSubUnit] = useState("");
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1]);
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [customProblems, setCustomProblems] = useState<MathProblem[]>([]);
  const [revealedSolutions, setRevealedSolutions] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<WorksheetHistory[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Worksheet history type
  interface WorksheetHistory {
    id: string;
    problems: MathProblem[];
    metadata: {
      schoolLevel: string;
      grade: string;
      semester: string;
      mainUnit: string;
      subUnit: string;
      createdAt: string;
      difficulty: string;
    };
  }
  const [newProblem, setNewProblem] = useState({
    question: "",
    solution: "",
    explanation: ""
  });

  // Derived options
  const schoolLevels = Object.keys(KOREAN_CURRICULUM);
  const grades = schoolLevel ? Object.keys(KOREAN_CURRICULUM[schoolLevel] || {}) : [];
  const semesters = (schoolLevel && grade) ? Object.keys(KOREAN_CURRICULUM[schoolLevel]?.[grade] || {}) : [];
  const mainUnits = (schoolLevel && grade && semester) ? KOREAN_CURRICULUM[schoolLevel]?.[grade]?.[semester] || [] : [];
  const selectedMainUnitObj = mainUnits.find(u => u.name === mainUnit);
  const subUnits = selectedMainUnitObj ? selectedMainUnitObj.subUnits : [];

  // Initialize selections when parents change
  useEffect(() => {
    const validGrades = schoolLevel ? Object.keys(KOREAN_CURRICULUM[schoolLevel] || {}) : [];
    if (validGrades.length > 0) {
      if (!validGrades.includes(grade)) {
        setGrade(validGrades[0]);
      }
    }
  }, [schoolLevel, grade]);

  useEffect(() => {
    const validSemesters = (schoolLevel && grade) ? Object.keys(KOREAN_CURRICULUM[schoolLevel]?.[grade] || {}) : [];
    if (validSemesters.length > 0) {
      if (!validSemesters.includes(semester)) {
        setSemester(validSemesters[0]);
      }
    }
  }, [schoolLevel, grade, semester]);

  useEffect(() => {
    const validMainUnits = (schoolLevel && grade && semester) ? KOREAN_CURRICULUM[schoolLevel]?.[grade]?.[semester] || [] : [];
    if (validMainUnits.length > 0) {
      if (!validMainUnits.find(u => u.name === mainUnit)) {
        setMainUnit(validMainUnits[0].name);
      }
    } else {
      setMainUnit("");
    }
  }, [schoolLevel, grade, semester, mainUnit]);

  useEffect(() => {
    const selectedObj = (schoolLevel && grade && semester) ? (KOREAN_CURRICULUM[schoolLevel]?.[grade]?.[semester] || []).find(u => u.name === mainUnit) : null;
    const validSubUnits = selectedObj ? selectedObj.subUnits : [];
    if (validSubUnits.length > 0) {
      if (!validSubUnits.includes(subUnit)) {
        setSubUnit(validSubUnits[0]);
      }
    } else {
      setSubUnit("");
    }
  }, [schoolLevel, grade, semester, mainUnit, subUnit]);

  useEffect(() => {
    const saved = localStorage.getItem("my-math-problems");
    if (saved) {
      setCustomProblems(JSON.parse(saved));
    }
    const savedTheme = localStorage.getItem("math-ai-theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedHistory = localStorage.getItem("math-ai-history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToLocal = (probs: MathProblem[]) => {
    localStorage.setItem("my-math-problems", JSON.stringify(probs));
  };

  const saveHistoryToLocal = (historyList: WorksheetHistory[]) => {
    localStorage.setItem("math-ai-history", JSON.stringify(historyList));
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("math-ai-theme", newTheme);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const gpts = await generateMathProblems({
        topic: mainUnit,
        gradeLevel: `${schoolLevel} ${grade}`,
        semester,
        unit: mainUnit,
        subUnit: subUnit || mainUnit,
        difficulty,
        count,
      });
      
      const newProblems = gpts.map(p => ({
        ...p,
        schoolLevel,
        grade,
        semester,
        mainUnit,
        subUnit: subUnit || mainUnit,
        createdAt: new Date().toISOString()
      }));
      
      setProblems(newProblems);
      setRevealedSolutions({});

      // Save to history
      const newHistoryItem: WorksheetHistory = {
        id: `history-${Date.now()}`,
        problems: newProblems,
        metadata: {
          schoolLevel,
          grade,
          semester,
          mainUnit,
          subUnit: subUnit || mainUnit,
          createdAt: new Date().toISOString(),
          difficulty
        }
      };
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      saveHistoryToLocal(updatedHistory);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Grouped problems by difficulty for rendering
  const groupedProblems = DIFFICULTIES.reduce((acc, diff) => {
    const filtered = problems.filter(p => {
       return p.difficulty.includes(diff) || diff.includes(p.difficulty);
    });
    if (filtered.length > 0) acc[diff] = filtered;
    return acc;
  }, {} as Record<string, MathProblem[]>);

  const otherProblems = problems.filter(p => !DIFFICULTIES.some(diff => p.difficulty.includes(diff) || diff.includes(p.difficulty)));
  if (otherProblems.length > 0) groupedProblems["기타"] = otherProblems;

  const addCustomProblem = () => {
    if (!newProblem.question || !newProblem.solution) return;
    
    const problem: MathProblem = {
      id: `custom-${Date.now()}`,
      question: newProblem.question,
      solution: newProblem.solution,
      explanation: newProblem.explanation,
      topic: "내가 만든 문제",
      difficulty: "사용자정의",
      schoolLevel,
      grade,
      semester,
      mainUnit,
      subUnit: subUnit || mainUnit,
      createdAt: new Date().toISOString()
    };

    const updated = [problem, ...customProblems];
    setCustomProblems(updated);
    saveToLocal(updated);
    setNewProblem({ question: "", solution: "", explanation: "" });
  };

  const deleteCustomProblem = (id: string) => {
    const updated = customProblems.filter(p => p.id !== id);
    setCustomProblems(updated);
    saveToLocal(updated);
  };

   const deleteHistoryItem = (id: string) => {
     const updated = history.filter(h => h.id !== id);
     setHistory(updated);
     saveHistoryToLocal(updated);
   };

   const loadHistoryItem = (item: WorksheetHistory) => {
     setProblems(item.problems);
     setSchoolLevel(item.metadata.schoolLevel);
     setGrade(item.metadata.grade);
     setSemester(item.metadata.semester);
     setMainUnit(item.metadata.mainUnit);
     setSubUnit(item.metadata.subUnit);
     setRevealedSolutions({});
   };

  const toggleSolution = (id: string) => {
    setRevealedSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExport = (targetProblems: MathProblem[]) => {
    const text = targetProblems.map((p, i) => 
      `문제 ${i + 1}:\n${p.question}\n\n정답:\n${p.solution}\n\n풀이:\n${p.explanation}\n\n${'-'.repeat(40)}`
    ).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `math-problems-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex h-screen w-full flex-col font-sans ${theme === "dark" ? "bg-slate-950 text-slate-50 dark" : "bg-slate-100 text-slate-900"} overflow-hidden`}>
      <nav className={`h-16 flex-shrink-0 border-b px-8 flex items-center justify-between no-print ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-indigo-600">
            <div className="h-4 w-4 rotate-45 border-2 border-white"></div>
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">
            MATH<span className="text-indigo-600">GEN</span> AI 3.1
          </span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
          <span className="flex h-16 items-center border-b-2 border-indigo-600 text-indigo-600 cursor-default">대시보드</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PLUS PRO 3.1</p>
            <p className="text-sm font-semibold italic text-slate-600 dark:text-slate-400">USER123</p>
          </div>
          <div className="h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            <Calculator className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </nav>

      <main className="flex flex-1 overflow-hidden">
        <aside className={`hidden w-80 flex-shrink-0 border-r p-6 md:flex flex-col gap-6 overflow-y-auto no-print ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div>
            <label className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              커리큘럼 설정
            </label>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">학교급</Label>
                <Select value={schoolLevel} onValueChange={setSchoolLevel}>
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-9 p-2 text-sm hover:bg-slate-100 transition-colors">
                    <SelectValue placeholder="학교 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolLevels.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">학년</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-9 p-2 text-sm hover:bg-slate-100 transition-colors">
                      <SelectValue placeholder="학년" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500">학기/분류</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-9 p-2 text-sm hover:bg-slate-100 transition-colors">
                      <SelectValue placeholder="학기" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">대단원</Label>
                <Select value={mainUnit} onValueChange={setMainUnit}>
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-9 p-2 text-sm hover:bg-slate-100 transition-colors">
                    <SelectValue placeholder="대단원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainUnits.map((u) => (
                      <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">소단원</Label>
                <Select value={subUnit} onValueChange={setSubUnit}>
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50 h-9 p-2 text-sm hover:bg-slate-100 transition-colors">
                    <SelectValue placeholder="소단원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {subUnits.map((su) => (
                      <SelectItem key={su} value={su}>{su}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">목표 난이도</Label>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  {DIFFICULTIES.map((d) => {
                    const isSelected = d === difficulty;
                    return (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 rounded py-1.5 text-[10px] font-bold transition-all ${
                          isSelected 
                            ? "bg-white text-slate-900 shadow-sm border border-slate-100" 
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              출력 옵션
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">생성 문항 수 (1~100)</span>
                <Input 
                  type="number" 
                  value={count} 
                  onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 h-8 text-xs font-bold text-center bg-indigo-50 border-none text-indigo-700"
                />
              </div>
              <Slider 
                value={[count]} 
                min={1} 
                max={100} 
                step={1} 
                onValueChange={(val) => setCount(val[0])} 
                className="cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="mb-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              애플리케이션 설정
            </label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">테마 설정</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleTheme}
                  className="h-8 text-[10px] gap-2"
                >
                  {theme === "light" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                  {theme === "light" ? "다크 모드" : "라이트 모드"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">개별 문항 추가</p>
                <div className="space-y-4">
                   <Input 
                    placeholder="여기에 직접 문제 입력..." 
                    value={newProblem.question}
                    onChange={(e) => setNewProblem({...newProblem, question: e.target.value})}
                    className="h-8 text-[10px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                   />
                   <Input 
                    placeholder="정답" 
                    value={newProblem.solution}
                    onChange={(e) => setNewProblem({...newProblem, solution: e.target.value})}
                    className="h-8 text-[10px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                   />
                   <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 border-dashed bg-white dark:bg-slate-800"
                    onClick={addCustomProblem}
                   >
                    <Plus className="h-3 w-3 mr-1" /> 보관함에 추가
                   </Button>
                </div>
             </div>

            <Button 
              className="h-14 w-full rounded-xl bg-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98]" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  기출 유형 생성하기
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </aside>

        <section className="flex flex-1 flex-col overflow-hidden bg-slate-50 p-6 lg:p-8">
          <Tabs defaultValue="ai" className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                  학습 워크시트
                </h2>
                <p className="text-sm text-slate-500">커리큘럼에 기반한 최적화 문항입니다.</p>
              </div>
              <TabsList className="bg-slate-200 shadow-inner p-1 no-print">
                <TabsTrigger value="ai" className="data-[state=active]:bg-white rounded-md px-6">AI 자동생성</TabsTrigger>
                <TabsTrigger value="mine" className="data-[state=active]:bg-white rounded-md px-6">내가 만든 문제</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-white rounded-md px-6">히스토리</TabsTrigger>
              </TabsList>
              <div className="flex gap-2 no-print">
                <Button variant="outline" size="sm" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold" 
                   onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" /> 인쇄하기
                </Button>
                <Button variant="outline" size="sm" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold" 
                   onClick={() => handleExport(problems)}>
                  <Download className="mr-2 h-4 w-4" /> 내보내기
                </Button>
              </div>
            </div>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full pr-4 pb-20">
                <div className="worksheet-container mx-auto w-full max-w-3xl rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 shadow-xl min-h-[900px] flex flex-col mb-10">
                  <div className="mb-8 flex justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">UNIT INFO</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        #KR-{(schoolLevel && schoolLevel[0]) || "X"}{(grade && grade[0]) || "X"}-{(semester && semester[0]) || "X"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{mainUnit || "연습 문제"}</p>
                      <p className="text-sm italic text-slate-500">{subUnit || "기본 학습"}</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {problems.length > 0 ? (
                      <div className="space-y-16">
                        {Object.entries(groupedProblems).map(([diff, diffProblems]) => (
                          <div key={diff} className="space-y-8">
                             <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-sm font-bold uppercase tracking-wider px-3">
                                   지정 난이도: {diff}
                                </Badge>
                                <div className="h-px flex-1 bg-slate-100" />
                             </div>
                             <div className="grid grid-cols-1 gap-y-12">
                               {diffProblems.map((problem, index) => (
                                 <motion.div
                                   key={problem.id}
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   className="space-y-4"
                                 >
                                   <div className="flex gap-3 font-bold text-slate-800 dark:text-slate-200">
                                     <span className="text-indigo-600">Q{index + 1}.</span>
                                     <div className="flex-1 leading-relaxed">
                                       <div className="math-render">
                                         <ReactMarkdown
                                           remarkPlugins={[remarkMath]}
                                           rehypePlugins={[rehypeKatex]}
                                         >
                                           {problem.question}
                                         </ReactMarkdown>
                                       </div>
                                     </div>
                                   </div>

                                   <div className="no-print">
                                     <div className="flex flex-col gap-4">
                                       <div className="bg-slate-50/50 p-8 rounded-sm border border-slate-100 min-h-[120px] flex items-center justify-center border-dashed">
                                         <span className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">Solution Space</span>
                                       </div>

                                       <div className="flex justify-start gap-4">
                                         <button 
                                           onClick={() => toggleSolution(problem.id)}
                                           className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors bg-indigo-50 px-2 py-1 rounded"
                                         >
                                           {revealedSolutions[problem.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                           {revealedSolutions[problem.id] ? "해설 닫기" : "정답 및 해설 열기"}
                                         </button>

                                         <button 
                                           onClick={() => {
                                             if (customProblems.length >= 150) {
                                               alert("보관함이 가득 찼습니다 (최대 150개).");
                                               return;
                                             }
                                             const updated = [problem, ...customProblems];
                                             setCustomProblems(updated);
                                             saveToLocal(updated);
                                           }}
                                           className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors bg-emerald-50 px-2 py-1 rounded"
                                         >
                                           <Plus className="h-3 w-3" />
                                           보관함 저장
                                         </button>
                                       </div>

                                       {revealedSolutions[problem.id] && (
                                         <motion.div
                                           initial={{ opacity: 0, height: 0 }}
                                           animate={{ opacity: 1, height: "auto" }}
                                           className="rounded-sm bg-slate-100/50 p-6 border-l-4 border-indigo-600 overflow-hidden"
                                         >
                                           <p className="text-[10px] font-bold text-indigo-700 mb-3 uppercase tracking-widest">Model Solution</p>
                                           <div className="text-sm prose prose-sm prose-slate max-w-none leading-relaxed">
                                             <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                               {`**정답:** ${problem.solution}\n\n**풀이:** ${problem.explanation}`}
                                             </ReactMarkdown>
                                           </div>
                                         </motion.div>
                                       )}
                                     </div>
                                   </div>
                                 </motion.div>
                               ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-40">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                          <Search className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-300">데이터 대기 중</h3>
                        <p className="text-sm text-slate-200 max-w-xs mt-3">단원을 선택하고 생성 버튼을 눌러주세요.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mine" className="flex-1 overflow-hidden m-0">
               <ScrollArea className="h-full">
                  <div className="mx-auto w-full max-w-3xl space-y-6 mb-10">
                    <Card className="bg-white border-slate-200 shadow-xl border-2 overflow-hidden rounded-sm">
                       <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                          <div className="space-y-1">
                             <CardTitle className="text-lg flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-indigo-600" />
                                개인 문항 저장소 (최대 150개)
                             </CardTitle>
                             <CardDescription className="text-xs">등록된 {customProblems.length}/150개의 문항이 있습니다.</CardDescription>
                          </div>
                       </CardHeader>
                       <CardContent className="pt-6 space-y-6">
                            {customProblems.length > 0 ? (
                               customProblems.map((problem, idx) => (
                                  <div key={problem.id} className="p-6 rounded-sm border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group bg-slate-50/30 dark:bg-slate-900/30 mb-4">
                                     <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                           <div className="flex items-center gap-2 mb-3">
                                              <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                 {problem.schoolLevel} {problem.grade}
                                              </Badge>
                                              <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                 {problem.semester}
                                              </Badge>
                                              <span className="text-[10px] text-slate-400 font-mono">
                                                 {problem.createdAt ? new Date(problem.createdAt).toLocaleDateString() : ""}
                                              </span>
                                           </div>
                                           <div className="text-[10px] text-slate-500 mb-1">
                                              {problem.mainUnit} &gt; {problem.subUnit}
                                           </div>
                                           <div className="flex gap-4">
                                              <div className="h-6 w-6 flex-shrink-0 flex items-center justify-center font-bold text-[10px] rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500">
                                                 {idx + 1}
                                              </div>
                                              <div className="font-bold text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                                                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {problem.question}
                                                 </ReactMarkdown>
                                              </div>
                                           </div>
                                        </div>
                                        <Button 
                                           variant="ghost" 
                                           size="icon" 
                                           className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all h-8 w-8"
                                           onClick={() => deleteCustomProblem(problem.id)}
                                        >
                                           <Trash2 className="h-4 w-4" />
                                        </Button>
                                     </div>
                                     
                                     <div className="no-print">
                                       <Accordion className="w-full">
                                         <AccordionItem value="solution" className="border-none">
                                           <AccordionTrigger className="py-2 text-[10px] font-bold text-indigo-600 hover:no-underline uppercase tracking-[0.2em] bg-white px-3 rounded-sm border border-slate-100 shadow-sm">
                                             정답 확인하기
                                           </AccordionTrigger>
                                           <AccordionContent className="pt-4 text-sm text-slate-600">
                                             <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-inner">
                                               <p className="font-bold text-slate-900 border-b pb-2 mb-4">정답: {problem.solution}</p>
                                               {problem.explanation && (
                                                 <div className="prose prose-sm max-w-none text-slate-500 italic">
                                                   <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                     {problem.explanation}
                                                   </ReactMarkdown>
                                                 </div>
                                               )}
                                             </div>
                                           </AccordionContent>
                                         </AccordionItem>
                                       </Accordion>
                                     </div>
                                  </div>
                               ))
                            ) : (
                               <div className="py-32 text-center flex flex-col items-center justify-center">
                                  <BookOpen className="h-12 w-12 text-slate-200 mb-4" />
                                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">목록이 비어있습니다</p>
                               </div>
                            )}
                       </CardContent>
                    </Card>
                  </div>
               </ScrollArea>
             </TabsContent>
            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
               <ScrollArea className="h-full pr-4">
                 <div className="mx-auto w-full max-w-4xl space-y-4 mb-10">
                   {history.length > 0 ? (
                     <div className="grid gap-4">
                       {history.map((item) => (
                         <Card key={item.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
                           <CardContent className="p-4 flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <div className="bg-indigo-50 dark:bg-indigo-950 p-2 rounded-lg">
                                 <History className="h-5 w-5 text-indigo-600" />
                               </div>
                               <div>
                                 <div className="flex items-center gap-2 mb-1">
                                   <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                     {item.metadata.schoolLevel}
                                   </Badge>
                                   <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                     {item.metadata.grade} · {item.metadata.semester}
                                   </Badge>
                                   <span className="text-[10px] text-slate-400 font-mono">
                                     {new Date(item.metadata.createdAt).toLocaleString()}
                                   </span>
                                 </div>
                                 <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                   {item.metadata.mainUnit} &gt; {item.metadata.subUnit}
                                 </h4>
                                 <p className="text-[10px] text-slate-500">
                                   난이도: {item.metadata.difficulty} · 문항 수: {item.problems.length}개
                                 </p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                               <Button variant="ghost" size="sm" className="h-8 text-xs bg-slate-50 dark:bg-slate-800" onClick={() => loadHistoryItem(item)}>
                                 열람하기
                               </Button>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => deleteHistoryItem(item.id)}>
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   ) : (
                     <div className="py-40 text-center flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                       <History className="h-12 w-12 text-slate-200 mb-4" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">저장된 히스토리가 없습니다</p>
                       <p className="text-xs text-slate-300 mt-2">워크시트를 생성하면 자동으로 이곳에 저장됩니다.</p>
                     </div>
                   )}
                 </div>
               </ScrollArea>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <footer className="h-8 flex-shrink-0 border-t border-slate-200 bg-white px-8 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5 text-green-600">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
            DATA SYNCED
          </span>
          <span>KR-CURRICULUM v2024.1</span>
        </div>
        <div>© 2024 NEURAL MATH SYSTEMS</div>
      </footer>
    </div>
  );
}
