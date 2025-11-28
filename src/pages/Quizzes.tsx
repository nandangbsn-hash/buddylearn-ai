import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Brain, ArrowLeft, Sparkles, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { updateStreak } from "@/lib/updateStreak";

const Quizzes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get("materialId");
  
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (materialId) {
      generateQuiz();
    }
  }, [materialId]);

  const generateQuiz = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { materialId, numQuestions: 5, difficulty: 'medium' }
      });

      if (error) throw error;
      if (data.quiz) {
        setQuiz(data.quiz);
      }
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    setAnswers([...answers, selectedAnswer]);

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      calculateScore([...answers, selectedAnswer]);
    }
  };

  const calculateScore = async (finalAnswers: number[]) => {
    let correct = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (finalAnswers[idx] === q.correct_answer) {
        correct++;
      }
    });

    setScore(correct);
    setShowResult(true);

    // Save attempt and award XP
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("quiz_attempts").insert({
        quiz_id: quiz.id,
        user_id: user.id,
        score: correct,
        total_questions: quiz.questions.length,
        answers: finalAnswers
      });

      // Award XP based on score
      const xpEarned = correct * 5;
      await awardXP(xpEarned);
      toast.success(`You earned ${xpEarned} XP!`);
    }
  };

  const awardXP = async (amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (progress) {
      const newXP = progress.total_xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      await supabase
        .from("user_progress")
        .update({
          total_xp: newXP,
          level: newLevel
        })
        .eq("user_id", user.id);

      // Update streak
      await updateStreak(user.id);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold mb-2">Generating Quiz...</h3>
            <p className="text-sm text-muted-foreground">Our AI is creating personalized questions for you</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p>No quiz available</p>
            <Button onClick={() => navigate("/materials")} className="mt-4">
              Back to Materials
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResult) {
    const percentage = (score / quiz.questions.length) * 100;
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Quiz Complete!</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-center text-3xl">Your Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-bold text-primary">
                {score}/{quiz.questions.length}
              </div>
              <div className="text-2xl text-muted-foreground">
                {percentage.toFixed(0)}%
              </div>
              <Progress value={percentage} className="h-4" />

              <div className="space-y-4 mt-8">
                {quiz.questions.map((q: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {answers[idx] === q.correct_answer ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">{q.question}</p>
                          <p className="text-sm text-muted-foreground">
                            Correct answer: {q.options[q.correct_answer]}
                          </p>
                          {q.explanation && (
                            <p className="text-sm mt-2 text-primary">{q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button onClick={() => navigate("/materials")}>
                  Back to Materials
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Quiz Time</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress.toFixed(0)}% Complete
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer?.toString()} onValueChange={(val) => setSelectedAnswer(parseInt(val))}>
              {question.options.map((option: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button onClick={handleNext} className="w-full mt-6">
              {currentQuestion < quiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Quizzes;
