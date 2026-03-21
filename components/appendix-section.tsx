"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookMarked, Users, Bot, Workflow, Table, FileCheck, ArrowRight } from "lucide-react";
import { AnimatedSection, AnimatedCard, AnimatedProgress, StaggerContainer, StaggerItem } from "@/components/animated-section";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const references = [
  {
    title: "Giáo trình học phần Chủ nghĩa Khoa Học Xã CNXHKH (Không chuyên)",
    url: "https://www.slideshare.net/slideshow/tailieuvnucom-gio-trnh-ch-ngha-x-hi-khoa-hc-cnxhkh-khng-chuynpdf/266991331",
  },
  {
    title: "Bảo đảm quyền của người dân tộc thiểu số ở Việt Nam hiện nay",
    url: "https://danchuphapluat.vn/bao-dam-quyen-cua-nguoi-dan-toc-thieu-so-o-viet-nam-hien-nay-3178.html",
  },
  {
    title: "Quyết định số 1719/QĐ-TTg của Thủ tướng Chính phủ: Phê duyệt Chương trình mục tiêu quốc gia phát triển kinh tế - xã hội vùng đồng bào dân tộc thiểu số và miền núi giai đoạn 2021 - 2030, giai đoạn I: từ năm 2021 đến năm 2025",
    url: "https://vanban.chinhphu.vn/?pageid=27160&docid=204285",
  },
];

const aiUsageTracker = [
  {
    feature: "Nội dung lý luận (các section 1–6)",
    tool: "NotebookLM + Claude AI",
    purpose: "Tóm tắt, biên soạn nội dung từ giáo trình và slide bài giảng",
    percentage: 40,
  },
  {
    feature: "Giao diện website (React/Next.js)",
    tool: "Claude AI (v0.dev)",
    purpose: "Sinh mã nguồn giao diện theo prompt của sinh viên",
    percentage: 85,
  },
  {
    feature: "Minigame trắc nghiệm",
    tool: "Claude AI",
    purpose: "Tạo ngân hàng câu hỏi và logic chấm điểm",
    percentage: 60,
  },
  {
    feature: "Sơ đồ workflow",
    tool: "Claude AI",
    purpose: "Lên ý tưởng và mô tả mô hình làm việc",
    percentage: 30,
  },
];

const teamMembers = [
  { name: "Bùi Minh Hiếu", role: "Leader", studentId: "SE184406" },
  { name: "Hồ Lê Bình", role: "Member", studentId: "SE183564" },
  { name: "Nguyễn Trần Gia Bảo", role: "Member", studentId: "SE181937" },
  { name: "QuanClaude_Opus_4.6", role: "Special Member", studentId: "" },
];

const workflowSteps = [
  {
    id: "student",
    icon: "SV",
    title: "Người dùng (Sinh viên)",
    description: "Lên ý tưởng kịch bản, cung cấp tài liệu gốc, định hướng sản phẩm và chịu trách nhiệm kiểm duyệt cuối cùng.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "notebooklm",
    icon: "NLM",
    title: "NotebookLM",
    description: "Cố vấn nội dung, tóm tắt tài liệu và biên soạn nội dung.",
    color: "bg-green-100 text-green-600",
  },
  {
    id: "claude",
    icon: "AI",
    title: "Claude AI",
    description: "Lập trình viên. Thực hiện hóa ý tưởng, viết mã nguồn React/Next.js theo prompt.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "reference",
    icon: "Ref",
    title: "Nguồn kiểm chứng",
    description: "Dữ liệu gốc và chân lý đối chiếu. Kiểm tra lại đáp án theo giáo trình.",
    color: "bg-orange-100 text-orange-600",
  },
];

function AnimatedWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {workflowSteps.map((step, index) => (
        <motion.div
          key={step.id}
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: index * 0.15, duration: 0.5 }}
        >
          {/* Connection arrow */}
          {index < workflowSteps.length - 1 && (
            <motion.div 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden lg:block"
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.15 + 0.3 }}
            >
              <motion.div
                animate={{ 
                  x: activeStep === index ? [0, 5, 0] : 0,
                  color: activeStep === index ? "#eab308" : "#9ca3af"
                }}
                transition={{ 
                  x: { repeat: Infinity, duration: 0.8 },
                  color: { duration: 0.3 }
                }}
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            </motion.div>
          )}
          
          <motion.div
            className="bg-background border border-border rounded-lg p-4 text-center h-full"
            animate={{
              borderColor: activeStep === index ? "rgba(234, 179, 8, 0.8)" : "rgba(0,0,0,0.1)",
              boxShadow: activeStep === index 
                ? "0 0 20px rgba(234, 179, 8, 0.3), 0 0 40px rgba(234, 179, 8, 0.1)" 
                : "none",
            }}
            transition={{ duration: 0.3 }}
            whileHover={{ 
              scale: 1.03,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
          >
            <motion.div 
              className={`w-10 h-10 mx-auto mb-2 rounded-full ${step.color} flex items-center justify-center font-bold text-sm`}
              animate={{
                scale: activeStep === index ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: activeStep === index ? Infinity : 0 }}
            >
              {step.icon}
            </motion.div>
            <h5 className="font-medium text-sm text-foreground mb-1">{step.title}</h5>
            <p className="text-xs text-muted-foreground">{step.description}</p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export function AppendixSection() {
  return (
    <section id="phu-luc" className="py-20 px-6 bg-black/70 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-yellow-400 font-medium mb-4">
            Phụ lục
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4">
            Tài liệu bổ sung
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Các tài liệu tham khảo, báo cáo minh bạch AI và thông tin bổ sung 
            liên quan đến nội dung bài thuyết trình về vấn đề dân tộc.
          </p>
        </AnimatedSection>

        {/* Main content grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Tài liệu tham khảo */}
          <AnimatedSection delay={0.1}>
            <AnimatedCard>
              <Card className="h-full border-border/50 shadow-sm bg-card/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif text-lg">
                    <motion.div 
                      className="p-2 rounded-lg bg-primary/10 text-primary"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <BookMarked className="w-5 h-5" />
                    </motion.div>
                    Tài liệu tham khảo
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  <StaggerContainer className="space-y-3" staggerDelay={0.05}>
                    {references.map((ref, index) => (
                      <StaggerItem key={index}>
                        <motion.li
                          data-reference-index={index + 1}
                          className="pb-3 border-b border-border/30 last:border-0 last:pb-0 list-none transition-all duration-300"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <a 
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-foreground hover:text-primary transition-colors leading-relaxed block group"
                          >
                            <span className="relative">
                              [{index + 1}] {ref.title}
                              <motion.span 
                                className="absolute -bottom-0.5 left-0 h-px bg-primary origin-left"
                                initial={{ scaleX: 0 }}
                                whileHover={{ scaleX: 1 }}
                                transition={{ duration: 0.3 }}
                              />
                            </span>
                          </a>
                        </motion.li>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </CardContent>
              </Card>
            </AnimatedCard>
          </AnimatedSection>

          {/* Thông tin nhóm thực hiện */}
          <AnimatedSection delay={0.2}>
            <AnimatedCard>
              <Card className="h-full border-border/50 shadow-sm bg-card/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-serif text-lg">
                    <motion.div 
                      className="p-2 rounded-lg bg-primary/10 text-primary"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Users className="w-5 h-5" />
                    </motion.div>
                    Thông tin nhóm thực hiện
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Lớp: IA1807</p>
                      <p>Môn: MLN131</p>
                      <p>Giảng viên: BinhNV26</p>
                    </div>
                    <StaggerContainer className="space-y-3" staggerDelay={0.1}>
                      {teamMembers.map((member, index) => (
                        <StaggerItem key={index}>
                          <motion.div
                            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                            whileHover={{ 
                              backgroundColor: "rgba(0,0,0,0.02)",
                              x: 5
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.role}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {member.studentId}
                            </span>
                          </motion.div>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>
          </AnimatedSection>
        </div>

        {/* AI Usage Section - Full width */}
        <AnimatedSection delay={0.3} className="mt-8">
          <AnimatedCard>
            <Card className="border-border/50 shadow-sm bg-card/95 backdrop-blur-sm">
              <CardHeader className="border-b border-border/30">
                <CardTitle className="flex items-center gap-3 font-serif text-xl">
                  <motion.div 
                    className="p-2 rounded-lg bg-accent/10 text-accent"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Bot className="w-6 h-6" />
                  </motion.div>
                  AI Usage - Báo cáo minh bạch liêm chính học thuật
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* 1. Lời cam kết liêm chính học thuật */}
                <AnimatedSection delay={0.1}>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                    <motion.span 
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm"
                      whileHover={{ scale: 1.2 }}
                    >
                      1
                    </motion.span>
                    Lời cam kết liêm chính học thuật
                  </h4>
                  <div 
                    className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary hover:translate-x-1 hover:shadow-md transition-all duration-200"
                  >
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      "Nhóm thực hiện dự án cam kết: Trí tuệ nhân tạo (AI) chỉ đóng vai trò công cụ hỗ trợ (lên ý tưởng sơ đồ, khởi tạo mã nguồn, soạn ngân hàng câu hỏi). AI không thay thế hoàn toàn năng lực tư duy và quá trình làm việc của sinh viên. Toàn bộ nội dung và mã nguồn cuối cùng đều đã được sinh viên trực tiếp kiểm duyệt, đối chiếu và tinh chỉnh."
                    </p>
                  </div>
                </AnimatedSection>

                {/* 2. Mô hình làm việc (Workflow) */}
                <AnimatedSection delay={0.2}>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                    <motion.span 
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm"
                      whileHover={{ scale: 1.2 }}
                    >
                      2
                    </motion.span>
                    <Workflow className="w-4 h-4" />
                    Mô hình làm việc (Workflow)
                  </h4>
                  <AnimatedWorkflow />
                </AnimatedSection>

                {/* 3. Bảng sử dụng minh bạch AI */}
                <AnimatedSection delay={0.3}>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                    <motion.span 
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm"
                      whileHover={{ scale: 1.2 }}
                    >
                      3
                    </motion.span>
                    <Table className="w-4 h-4" />
                    Bảng sử dụng minh bạch AI (AI Usage Tracker)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-foreground border-b border-border">Tính năng</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground border-b border-border">Công cụ AI</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground border-b border-border">Mục đích</th>
                          <th className="px-4 py-3 text-left font-medium text-foreground border-b border-border w-32">Mức độ hỗ trợ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiUsageTracker.map((item, index) => (
                          <motion.tr 
                            key={index} 
                            className="border-b border-border/50 last:border-0"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                          >
                            <td className="px-4 py-3 text-foreground">{item.feature}</td>
                            <td className="px-4 py-3 text-muted-foreground">{item.tool}</td>
                            <td className="px-4 py-3 text-muted-foreground">{item.purpose}</td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    <AnimatedCounter value={item.percentage} />%
                                  </span>
                                </div>
                                <AnimatedProgress 
                                  value={item.percentage} 
                                  className="h-1.5"
                                  barClassName={
                                    item.percentage > 70 ? "bg-purple-500" :
                                    item.percentage > 40 ? "bg-blue-500" :
                                    "bg-green-500"
                                  }
                                />
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AnimatedSection>

                {/* 4. Nguồn tài liệu kiểm chứng */}
                <AnimatedSection delay={0.4}>
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                    <motion.span 
                      className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm"
                      whileHover={{ scale: 1.2 }}
                    >
                      4
                    </motion.span>
                    <FileCheck className="w-4 h-4" />
                    Nguồn tài liệu kiểm chứng
                  </h4>
                  <motion.div 
                    className="bg-muted/50 rounded-lg p-4"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                      Tất cả thông tin do AI sinh ra (đặc biệt là nội dung lý luận) đều được sinh viên đối chiếu <strong><AnimatedCounter value={100} />%</strong> với tài liệu chính thống:
                    </p>
                    <StaggerContainer className="space-y-2" staggerDelay={0.1}>
                      <StaggerItem>
                        <motion.li 
                          className="flex items-start gap-2 text-sm text-muted-foreground list-none"
                          whileHover={{ x: 5 }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span><strong>Giáo trình Chủ nghĩa xã hội khoa học</strong> (Dành cho bậc đại học - Không chuyên lý luận chính trị) - Xuất bản năm 2019.</span>
                        </motion.li>
                      </StaggerItem>
                      <StaggerItem>
                        <motion.li 
                          className="flex items-start gap-2 text-sm text-muted-foreground list-none"
                          whileHover={{ x: 5 }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span><strong>Các slide bài giảng</strong> của giảng viên phụ trách môn học.</span>
                        </motion.li>
                      </StaggerItem>
                    </StaggerContainer>
                  </motion.div>
                </AnimatedSection>
              </CardContent>
            </Card>
          </AnimatedCard>
        </AnimatedSection>
      </div>
    </section>
  );
}
