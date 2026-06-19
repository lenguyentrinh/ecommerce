"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const slides = [
  {
    title: "Fresh Organic Fruits",
    subtitle: "Up to 30% off this week",
    image:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Healthy Breakfast Deals",
    subtitle: "Start your day with quality food",
    image:
      "https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Best Local Vegetables",
    subtitle: "Farm-picked and delivered fast",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function HomeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (isPaused || shouldReduceMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [isPaused, shouldReduceMotion]);

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[55vh] w-full sm:h-[65vh] lg:h-[85vh]">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image src={slide.image} alt={slide.title} fill className="object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-center px-6 text-white md:px-12">
              <p className="mb-3 text-sm uppercase tracking-[0.24em] text-orange-300">
                {slide.subtitle}
              </p>
              <h2 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
                {slide.title}
              </h2>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 w-8 rounded-full transition-colors ${
              activeIndex === index ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
