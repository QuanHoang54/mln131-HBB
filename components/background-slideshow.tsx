"use client";

import { useEffect, useState } from "react";

const backgroundImages = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Hb2oD4KVc8CGN4HoOgNYblNF2ibIjd.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YdtAp4etpDfCBus9ShCJOtcVVzZ007.png",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image.png-aoSt2brRI4gMLmAhXZBVk45q44n0uB.jpeg",
];

export function BackgroundSlideshow() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: index === currentImageIndex ? 1 : 0,
          }}
        />
      ))}
      {/* Dark overlay for text contrast */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
