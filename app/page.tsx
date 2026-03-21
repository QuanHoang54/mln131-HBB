import { HeroSection } from "@/components/hero-section";
import { StickyNavigation } from "@/components/sticky-navigation";
import { ContentSection } from "@/components/content-section";
import { MinigameSection } from "@/components/minigame-section";
import { AppendixSection } from "@/components/appendix-section";
import { Footer } from "@/components/footer";
import { BackgroundSlideshow } from "@/components/background-slideshow";

/**
 * Trang web một trang về Chủ nghĩa xã hội khoa học
 * 
 * CẤU TRÚC:
 * 1. HeroSection - Trang chủ với tiêu đề và giới thiệu
 * 2. StickyNavigation - Menu điều hướng cố định (hiển thị khi ở phần nội dung)
 * 3. ContentSection - Nội dung chính của bài thuyết trình
 * 4. AppendixSection - Phụ lục với tài liệu tham khảo và câu hỏi thảo luận
 * 5. Footer - Chân trang
 * 
 * HƯỚNG DẪN CHỈNH SỬA:
 * - Để thay đổi tiêu đề chủ đề: Sửa trong components/hero-section.tsx
 * - Để thay đổi nội dung bài học: Sửa trong components/content-section.tsx
 * - Để thay đổi tài liệu tham khảo: Sửa trong components/appendix-section.tsx
 * - Để thay đổi menu điều hướng: Sửa trong components/sticky-navigation.tsx
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Background slideshow cố định cho toàn trang */}
      <BackgroundSlideshow />
      
      {/* Menu điều hướng cố định - chỉ hiển thị khi ở phần nội dung */}
      <StickyNavigation />
      
      {/* Phần 1: Trang chủ - Hero Section */}
      <HeroSection />
      
      {/* Phần 2: Nội dung chính */}
      <ContentSection />

      {/* Phần 3: Minigame */}
      <MinigameSection />
      
      {/* Phần 4: Phụ lục */}
      <AppendixSection />
      
      {/* Chân trang */}
      <Footer />
    </main>
  );
}
