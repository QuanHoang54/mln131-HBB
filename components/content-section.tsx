"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, Users, Scale, TrendingUp, ShieldCheck, Flag, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { AnimatedSection, AnimatedCard, StaggerContainer, StaggerItem } from "@/components/animated-section";
import { motion } from "framer-motion";
import { Citation } from "@/components/citation";
import { ImageSlideshow } from "@/components/image-slideshow";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const contentSections = [
  {
    id: "ly-luan",
    icon: BookOpen,
    title: "Cơ sở lý luận về dân tộc",
    description:
      "Dân tộc là một hình thái cộng đồng người ổn định trên cơ sở kinh tế, lãnh thổ, ngôn ngữ và tâm lý. Theo quan điểm của Chủ nghĩa Mác - Lênin, trong thời kỳ quá độ, vấn đề dân tộc vẫn tồn tại lâu dài và nhạy cảm.",
    subsections: [
      {
        title: "Các dân tộc hoàn toàn bình đẳng",
        content:
          "Không có dân tộc đặc quyền, mọi dân tộc đều có quyền lợi và nghĩa vụ ngang nhau.",
      },
      {
        title: "Các dân tộc được quyền tự quyết",
        content: "Quyền tự lựa chọn con đường phát triển phù hợp với điều kiện và nguyện vọng của mỗi dân tộc.",
      },
      {
        title: "Liên hiệp công nhân tất cả các dân tộc",
        content:
          "Sự đoàn kết giai cấp vượt lên trên sự khác biệt sắc tộc để xây dựng CNXH.",
      },
    ],
  },
  {
    id: "dac-diem",
    icon: Users,
    title: "Đặc điểm dân tộc Việt Nam",
    description:
      "Để thấy được tại sao người Kinh lại có lợi thế, ta phải nhìn vào thực tế địa chính trị và các đặc điểm riêng của Việt Nam.",
    image: {
      src: "/images/ban-do-dan-toc-viet-nam.png",
      alt: "Bản đồ phân bố các dân tộc Việt Nam theo số liệu tổng điều tra dân số 1999",
      caption: "Bản đồ phân bố 54 dân tộc Việt Nam"
    },
    points: [
      { text: "Chênh lệch số dân: Người Kinh chiếm 85,7%, 53 dân tộc còn lại chỉ chiếm 14,3%. Đây là sự chênh lệch tự nhiên về nhân khẩu học.", citation: 1 },
      { text: "Cư trú xen kẽ: Các dân tộc không có lãnh thổ riêng mà sống đan xen. Điều này giúp người Kinh (với số lượng lớn) có mặt ở khắp nơi.", citation: null },
      { text: "Vị trí chiến lược của dân tộc thiểu số: Dù dân số ít, dân tộc thiểu số lại cư trú tại các vùng biên giới, hải đảo, chiếm 3/4 diện tích đất nước.", citation: 1 },
      { text: "Trình độ phát triển không đều: Do lịch sử và địa lý, trình độ kinh tế - xã hội giữa vùng thấp và vùng cao có khoảng cách rất lớn.", citation: null },
    ],
  },
  {
    id: "chinh-sach",
    icon: Scale,
    title: "Chính sách dân tộc nhất quán",
    description:
      'Nhà nước Việt Nam xác định vấn đề dân tộc là vấn đề chiến lược, lâu dài. Chính sách không phải là "áp đặt" mà là: "Bình đẳng, đoàn kết, tôn trọng, giúp nhau cùng phát triển".',
    subsections: [
      {
        title: "Về Chính trị",
        content:
          "Nhà nước bảo đảm quyền làm chủ của mọi dân tộc. Tỷ lệ đại biểu Quốc hội là người DTTS luôn cao hơn tỷ lệ dân số của họ (Khóa XV có 89 đại biểu DTTS, chiếm 17,84%, trong khi dân số họ chỉ chiếm 14,3%)",
        citation: 2,
      },
      {
        title: "Về Kinh tế",
        content:
          "Nhà nước ưu tiên đầu tư cho vùng DTTS qua các chương trình như Chương trình mục tiêu quốc gia 1719 giai đoạn 2021-2030 với ngân sách hàng trăm nghìn tỷ đồng",
        citation: 3,
      },
      {
        title: "Về Văn hóa",
        content:
          'Không phải "làm lu mờ", mà là bảo tồn sự đa dạng. Nhà nước khuyến khích các dân tộc giữ gìn tiếng nói, chữ viết và lễ hội riêng. Các chương trình truyền thanh, truyền hình bằng tiếng dân tộc (VTV5) là minh chứng cho sự tôn trọng văn hóa.',
      },
    ],
  },
  {
    id: "nguyen-nhan",
    icon: TrendingUp,
    title: "Nguyên nhân chênh lệch phát triển",
    description:
      'Sự vượt trội của người Kinh không phải do "chiếm dụng", mà là hệ quả của các yếu tố khách quan về địa lý và lịch sử.',
    columns: [
      {
        title: "Lợi thế địa lý",
        items: [
          "Người Kinh sống ở vùng giao thương thuận lợi",
          "Dễ tiếp cận công nghệ và thông tin",
          "Cơ sở hạ tầng phát triển hơn",
          "Gần các trung tâm kinh tế lớn",
        ],
      },
      {
        title: "Phương thức sản xuất",
        items: [
          "Người Kinh sớm chuyển sang kinh tế hàng hóa và dịch vụ",
          "Nhiều vùng DTTS vẫn đang trong quá trình chuyển đổi từ tự cung tự cấp",
          "Khả năng tiếp cận vốn và thị trường khác nhau",
          "Trình độ giáo dục và đào tạo chênh lệch",
        ],
      },
    ],
  },
  {
    id: "bac-bo",
    icon: ShieldCheck,
    title: 'Bác bỏ luận điểm "Chiếm dụng"',
    description:
      "Dựa trên thực tế đã phân tích, chúng ta có thể đưa ra các lập luận phản biện các quan điểm sai lệch về vấn đề dân tộc tại Việt Nam.",
    slideshow: [
      {
        src: "/images/bac-bo-1.png",
        alt: "Giáo viên dạy học cho trẻ em dân tộc thiểu số",
        caption: "Giáo dục - Đầu tư cho tương lai của đồng bào dân tộc thiểu số"
      },
      {
        src: "/images/bac-bo-2.png",
        alt: "Các hoạt động phát triển kinh tế vùng dân tộc thiểu số",
        caption: "Phát triển kinh tế - Nâng cao đời sống vùng DTTS"
      },
      {
        src: "/images/bac-bo-3.png",
        alt: "Khám chữa bệnh cho đồng bào dân tộc thiểu số",
        caption: "Y tế - Chăm sóc sức khỏe cho đồng bào DTTS"
      },
      {
        src: "/images/bac-bo-4.png",
        alt: "Lễ hội văn hóa ẩm thực dân tộc thiểu số",
        caption: "Bảo tồn và phát huy văn hóa truyền thống các dân tộc"
      }
    ],
    points: [
      "Không phải áp đặt văn hóa: Việc người DTTS sử dụng tiếng Việt (tiếng phổ thông) là nhu cầu hội nhập khách quan để giao thương và học tập, không phải sự ép buộc xóa bỏ bản sắc.",
      "Không phải chiếm dụng kinh tế: Người Kinh lên vùng cao thường mang theo vốn, kỹ thuật và thị trường, góp phần thúc đẩy kinh tế địa phương.",
      "Chênh lệch phát triển là tất yếu lịch sử: Trong thời kỳ quá độ, việc các cộng đồng phát triển với tốc độ khác nhau là bình thường.",
      "Nhà nước đang thực hiện việc điều tiết lợi ích từ vùng phát triển sang vùng kém phát triển thông qua các chính sách an sinh xã hội.",
    ],
  },
  {
    id: "ket-luan",
    icon: Flag,
    title: "Ý nghĩa đoàn kết dân tộc & Kết luận",
    description:
      "Đoàn kết dân tộc là nguồn sức mạnh để xây dựng CNXH và bảo vệ Tổ quốc. Xây dựng CNXH thành công chỉ khi mọi dân tộc đều được hưởng thành quả của sự phát triển một cách công bằng.",
    slideshow: [
      {
        src: "/images/doan-ket-dan-toc-1.png",
        alt: "Đồng bào các dân tộc diễu hành với cờ Việt Nam",
        caption: "Đồng bào các dân tộc thiểu số trong trang phục truyền thống diễu hành"
      },
      {
        src: "/images/doan-ket-dan-toc-2.jpg",
        alt: "Biểu diễn văn hóa các dân tộc",
        caption: "Chương trình nghệ thuật tôn vinh văn hóa các dân tộc Việt Nam"
      },
      {
        src: "/images/doan-ket-dan-toc-3.png",
        alt: "Bác Hồ với đồng bào dân tộc thiểu số",
        caption: "Chủ tịch Hồ Chí Minh cùng đồng bào các dân tộc thiểu số"
      }
    ],
    points: [
      'Khái niệm "chiếm dụng" là một sự nhìn nhận sai lệch, phiến diện.',
      "Sự vượt trội của dân tộc Kinh là kết quả của điều kiện khách quan.",
      "Chính sách của Đảng và Nhà nước Việt Nam luôn hướng tới sự bình đẳng thực chất.",
      'Nếu tin vào luận điểm "chiếm dụng", khối đại đoàn kết sẽ bị rạn nứt, tạo cơ hội cho các thế lực thù địch lợi dụng.',
      'Việc của chúng ta là thực hiện tốt hơn nữa tinh thần "giúp nhau cùng phát triển" để không dân tộc nào bị bỏ lại phía sau.',
    ],
  },
];

export function ContentSection() {
  const [imageZoom, setImageZoom] = useState(1);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  
  const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setImageZoom(1);

  // Scroll-to-focus behavior: highlight section when navigating via anchor
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setHighlightedSection(hash);
        // Remove highlight after 2 seconds
        setTimeout(() => setHighlightedSection(null), 2000);
      }
    };

    // Check on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <section id="noi-dung" className="py-20 px-6 bg-black/70 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.2em] text-yellow-400 font-medium mb-4">
            Nội dung chính
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-4 text-balance">
            Vấn đề dân tộc tại Việt Nam
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto leading-relaxed">
            Phân tích cơ sở lý luận, thực trạng và chính sách dân tộc của Việt Nam,
            đồng thời bác bỏ các luận điểm sai lệch về vấn đề dân tộc.
          </p>
        </AnimatedSection>

        {/* Content sections */}
        <div className="space-y-12">
          {contentSections.map((section, index) => {
            const isBacBoSection = section.id === "bac-bo";
            const isHighlighted = highlightedSection === section.id;
            
            return (
            <AnimatedSection key={section.id} id={section.id} delay={index * 0.1}>
              <AnimatedCard>
                <Card 
                  className={cn(
                    "border-border/50 shadow-sm overflow-hidden bg-card/95 backdrop-blur-sm transition-all duration-300",
                    isHighlighted && "section-focus-highlight",
                    isBacBoSection && "highlight-box-glow"
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className="p-3 rounded-lg bg-primary/10 text-primary"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <section.icon className="w-6 h-6" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Phần {index + 1}
                        </p>
                        <CardTitle className="font-serif text-xl md:text-2xl text-foreground">
                          {section.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {section.description}
                    </p>

                    {/* Render image if available */}
                    {section.image && (
                      <motion.div 
                        className="mb-6 rounded-lg overflow-hidden border border-border/50 max-w-md mx-auto"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {/* Zoom controls */}
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-muted/50 border-b border-border/30">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={imageZoom <= 0.5}
                            className="h-8 w-8 p-0"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                            {Math.round(imageZoom * 100)}%
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={imageZoom >= 3}
                            className="h-8 w-8 p-0"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetZoom}
                            className="h-8 w-8 p-0 ml-1"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Image container with zoom */}
                        <div className="overflow-auto max-h-[350px] bg-white">
                          <motion.img 
                            src={section.image.src}
                            alt={section.image.alt}
                            className="w-full h-auto object-contain cursor-grab active:cursor-grabbing"
                            style={{ 
                              transform: `scale(${imageZoom})`,
                              transformOrigin: 'center center'
                            }}
                            animate={{ scale: imageZoom }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            draggable={false}
                          />
                        </div>
                        
                        {section.image.caption && (
                          <p className="text-center text-sm text-muted-foreground py-2 bg-muted/30 border-t border-border/30">
                            {section.image.caption}
                          </p>
                        )}
                      </motion.div>
                    )}

                    {/* Render slideshow if available */}
                    {section.slideshow && (
                      <motion.div 
                        className="mb-6 max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <ImageSlideshow 
                          images={section.slideshow}
                          autoPlay={true}
                          interval={5000}
                        />
                      </motion.div>
                    )}

                    {/* Render bullet points if available */}
                    {section.points && (
                      <StaggerContainer 
                        className="space-y-3" 
                        staggerDelay={isBacBoSection ? 0.12 : 0.08}
                      >
                        {section.points.map((point, i) => {
                          const isObjectPoint = typeof point === "object" && point !== null && "text" in point;
                          const pointText = isObjectPoint ? (point as { text: string; citation: number | null }).text : point;
                          const citationNum = isObjectPoint ? (point as { text: string; citation: number | null }).citation : null;
                          
                          return (
                            <StaggerItem key={i}>
                              <motion.li 
                                className={cn(
                                  "flex items-start gap-3 list-none rounded-lg p-2 -mx-2 transition-all duration-200",
                                  isBacBoSection && "hover:bg-muted/30"
                                )}
                                whileHover={{ 
                                  x: isBacBoSection ? 8 : 5,
                                  scale: isBacBoSection ? 1.01 : 1 
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                              >
                                <motion.span 
                                  className={cn(
                                    "w-2 h-2 rounded-full mt-2 shrink-0",
                                    isBacBoSection ? "bg-primary" : "bg-accent"
                                  )}
                                  whileHover={isBacBoSection ? { scale: 1.3 } : {}}
                                />
                                <span className={cn(
                                  "text-foreground/90 transition-colors duration-200",
                                  isBacBoSection && "text-emphasis-hover"
                                )}>
                                  {pointText}
                                  {citationNum && (
                                    <Citation 
                                      number={citationNum} 
                                      shortReference="Giáo trình học phần CNXHKH (Không chuyên) - Trang 110"
                                      targetId="phu-luc"
                                    />
                                  )}
                                </span>
                              </motion.li>
                            </StaggerItem>
                          );
                        })}
                      </StaggerContainer>
                    )}

                    {/* Render accordion subsections if available */}
                    {section.subsections && (
                      <Accordion type="single" collapsible className="w-full">
                        {section.subsections.map((sub, i) => (
                          <AccordionItem
                            key={i}
                            value={`item-${i}`}
                            className="border-border/50"
                          >
                            <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline group">
                              <span className="relative">
                                {sub.title}
                                <motion.span 
                                  className="absolute -bottom-1 left-0 h-0.5 bg-primary"
                                  initial={{ width: 0 }}
                                  whileHover={{ width: "100%" }}
                                  transition={{ duration: 0.3 }}
                                />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {sub.content}
                              {sub.citation && (
                                <Citation 
                                  number={sub.citation} 
                                  shortReference={
                                    sub.citation === 2 
                                      ? "Bảo đảm quyền của người dân tộc thiểu số ở Việt Nam hiện nay" 
                                      : "Quyết định số 1719/QĐ-TTg - Chương trình MTQG vùng DTTS 2021-2030"
                                  }
                                  targetId="phu-luc"
                                />
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}

                    {/* Render two columns if available */}
                    {section.columns && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {section.columns.map((col, i) => (
                          <motion.div
                            key={i}
                            className="p-5 rounded-lg bg-muted/50 border border-border/30"
                            whileHover={{ 
                              scale: 1.02,
                              boxShadow: "0 8px 30px rgba(0,0,0,0.12)"
                            }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <span
                                className={cn(
                                  "w-3 h-3 rounded-full",
                                  i === 0 ? "bg-primary" : "bg-accent"
                                )}
                              />
                              {col.title}
                            </h4>
                            <ul className="space-y-2">
                              {col.items.map((item, j) => (
                                <motion.li
                                  key={j}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                  initial={{ opacity: 0, x: -10 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ delay: j * 0.1 }}
                                  viewport={{ once: true }}
                                >
                                  <span className="text-muted-foreground/50 mt-0.5">
                                    •
                                  </span>
                                  {item}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </AnimatedCard>
            </AnimatedSection>
          );
          })}
        </div>
      </div>
    </section>
  );
}
