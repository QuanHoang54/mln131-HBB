"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";
import { AnimatedSection, AnimatedCard } from "@/components/animated-section";
import { motion, AnimatePresence } from "framer-motion";

const quizQuestions = [
  {
    question: "Theo Cương lĩnh dân tộc của V.I. Lênin, quyền nào là quyền cơ bản của các dân tộc?",
    options: [
      "Quyền bình đẳng dân tộc",
      "Quyền kinh tế",
      "Quyền văn hóa",
      "Quyền giáo dục",
    ],
    correctAnswer: 0,
  },
  {
    question: "Việt Nam có bao nhiêu dân tộc cùng sinh sống?",
    options: ["52 dân tộc", "53 dân tộc", "54 dân tộc", "55 dân tộc"],
    correctAnswer: 2,
  },
  {
    question: "Chương trình mục tiêu quốc gia 1719 có giai đoạn thực hiện từ năm nào đến năm nào?",
    options: ["2020-2025", "2021-2030", "2022-2030", "2021-2025"],
    correctAnswer: 1,
  },
  {
    question: "Tỷ lệ đại biểu dân tộc thiểu số trong Quốc hội khóa XV là bao nhiêu?",
    options: ["15%", "17.84%", "20%", "25%"],
    correctAnswer: 1,
  },
  {
    question: "Nguyên tắc nào KHÔNG thuộc Cương lĩnh dân tộc của V.I. Lênin?",
    options: [
      "Quyền bình đẳng dân tộc",
      "Quyền tự quyết dân tộc",
      "Quyền kinh tế tư nhân",
      "Liên hiệp công nhân các dân tộc",
    ],
    correctAnswer: 2,
  },
];

export function MinigameSection() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;
    
    setSelectedAnswer(answerIndex);
    setAnswered(true);
    setShowResult(true);

    if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswered(false);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setGameComplete(false);
    setAnswered(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / quizQuestions.length) * 100;
    if (percentage === 100) return "Xuất sắc! Bạn đã trả lời đúng tất cả câu hỏi!";
    if (percentage >= 80) return "Tuyệt vời! Bạn nắm vững kiến thức rất tốt!";
    if (percentage >= 60) return "Khá tốt! Hãy ôn lại một chút nữa nhé!";
    if (percentage >= 40) return "Cần cố gắng thêm! Hãy đọc lại nội dung bài học.";
    return "Hãy ôn tập lại bài học và thử lại nhé!";
  };

  return (
    <section id="minigame" className="py-20 px-6 bg-black/70 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/20 text-yellow-400 mb-4"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-sm font-medium">Minigame</span>
          </motion.div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
            Kiểm tra kiến thức
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Trả lời các câu hỏi trắc nghiệm để kiểm tra mức độ hiểu biết của bạn về vấn đề dân tộc tại Việt Nam.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <AnimatedCard>
            <Card className="border-border/50 shadow-lg bg-card/95 backdrop-blur-sm">
              <CardHeader className="border-b border-border/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-serif text-lg">
                    {gameComplete ? "Kết quả" : `Câu hỏi ${currentQuestion + 1}/${quizQuestions.length}`}
                  </CardTitle>
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    animate={{ scale: score > 0 ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Trophy className="w-4 h-4 text-primary" />
                    <span>Điểm: {score}/{quizQuestions.length}</span>
                  </motion.div>
                </div>
                
                {/* Progress bar */}
                {!gameComplete && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <AnimatePresence mode="wait">
                  {gameComplete ? (
                    <motion.div 
                      key="result"
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.div 
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      >
                        <Trophy className="w-10 h-10 text-primary" />
                      </motion.div>
                      <motion.h3 
                        className="text-2xl font-semibold text-foreground mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {score}/{quizQuestions.length} câu đúng
                      </motion.h3>
                      <motion.p 
                        className="text-muted-foreground mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {getScoreMessage()}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Button 
                          onClick={resetGame} 
                          className="gap-2"
                          asChild
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <RotateCcw className="w-4 h-4" />
                            Chơi lại
                          </motion.button>
                        </Button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`question-${currentQuestion}`}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-lg font-medium text-foreground mb-6">
                        {quizQuestions[currentQuestion].question}
                      </p>
                      <div className="space-y-3 mb-6">
                        {quizQuestions[currentQuestion].options.map((option, index) => {
                          const isCorrect = index === quizQuestions[currentQuestion].correctAnswer;
                          const isSelected = selectedAnswer === index;
                          
                          return (
                            <motion.button
                              key={index}
                              onClick={() => handleAnswerSelect(index)}
                              disabled={answered}
                              className={cn(
                                "w-full p-4 text-left rounded-lg border transition-all",
                                !answered && "cursor-pointer",
                                answered && isCorrect && "border-green-500 bg-green-50",
                                answered && isSelected && !isCorrect && "border-red-500 bg-red-50",
                                answered && !isSelected && !isCorrect && "opacity-50",
                                !answered && "hover:border-primary/50 hover:bg-primary/5",
                                !answered && isSelected && "border-primary bg-primary/5"
                              )}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={!answered ? { scale: 1.02, x: 5 } : {}}
                              whileTap={!answered ? { scale: 0.98 } : {}}
                            >
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-sm",
                                  answered && isCorrect && "text-green-700 font-medium",
                                  answered && isSelected && !isCorrect && "text-red-700"
                                )}>
                                  {option}
                                </span>
                                <AnimatePresence>
                                  {showResult && isCorrect && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: "spring", stiffness: 500 }}
                                    >
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    </motion.div>
                                  )}
                                  {showResult && isSelected && !isCorrect && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      exit={{ scale: 0 }}
                                      transition={{ type: "spring", stiffness: 500 }}
                                    >
                                      <XCircle className="w-5 h-5 text-red-500" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                      <AnimatePresence>
                        {showResult && (
                          <motion.div 
                            className="flex justify-end"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Button 
                              onClick={handleNextQuestion}
                              asChild
                            >
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {currentQuestion < quizQuestions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                              </motion.button>
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </AnimatedCard>
        </AnimatedSection>
      </div>
    </section>
  );
}
