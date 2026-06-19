"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Product = {
  name: string;
  category: string;
  price: string;
  image: string;
};

const bestSellerProducts: Product[] = [
  {
    name: "Premium Avocado",
    category: "Fruits",
    price: "$9.99",
    image:
      "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Fresh Orange Pack",
    category: "Fruits",
    price: "$7.49",
    image:
      "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Organic Tomato",
    category: "Vegetables",
    price: "$5.20",
    image:
      "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Green Salad Box",
    category: "Healthy",
    price: "$6.80",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Blueberry Mix",
    category: "Fruits",
    price: "$8.20",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=800&q=80",
  },
];

export default function BestSellerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const setWidthRef = useRef<number>(0);
  const cardWidthRef = useRef<number>(0);
  const gapRef = useRef<number>(24);

  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const lastDragXRef = useRef(0);
  const lastDragTsRef = useRef(0);

  const velocityRef = useRef(0);
  const targetSpeedRef = useRef(32);
  const currentSpeedRef = useRef(32);
  const pointerIdRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  const parallaxTargetXRef = useRef(0);
  const parallaxTargetYRef = useRef(0);
  const parallaxXRef = useRef(0);
  const parallaxYRef = useRef(0);

  const [isHovered, setIsHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sliderItems = useMemo(
    () => [...bestSellerProducts, ...bestSellerProducts, ...bestSellerProducts],
    []
  );

  const getItemsPerView = () => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth < 640) return 1.15;
    if (window.innerWidth < 1024) return 2.35;
    return 4.25;
  };

  const applyTrackTransform = (x: number) => {
    if (!trackRef.current) return;
    trackRef.current.style.transform = `translate3d(${x}px,0,0)`;
  };

  const updateFocusStyles = () => {
    if (!viewportRef.current || !trackRef.current) return;
    const children = Array.from(trackRef.current.children) as HTMLElement[];
    if (!children.length) return;

    const viewportWidth = viewportRef.current.clientWidth;
    const centerX = viewportWidth / 2;
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestIndex = 0;

    children.forEach((child, index) => {
      const itemCenter = index * (cardWidthRef.current + gapRef.current) + cardWidthRef.current / 2 + offsetRef.current;
      const distance = Math.abs(centerX - itemCenter);
      const normalized = Math.min(distance / (viewportWidth * 0.7), 1);
      const scale = 1 - normalized * 0.12;
      const opacity = 1 - normalized * 0.45;
      const brightness = 1 - normalized * 0.08;

      child.style.opacity = `${opacity}`;
      child.style.transform = `scale(${scale})`;
      child.style.filter = `brightness(${brightness})`;

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index % bestSellerProducts.length;
      }
    });

    setActiveIndex(bestIndex);
  };

  const clampInfiniteOffset = () => {
    if (!setWidthRef.current) return;
    if (offsetRef.current <= -2 * setWidthRef.current) offsetRef.current += setWidthRef.current;
    if (offsetRef.current >= -setWidthRef.current) offsetRef.current -= setWidthRef.current;
  };

  const recalcLayout = () => {
    if (!viewportRef.current || !trackRef.current) return;
    const itemsPerView = getItemsPerView();
    const viewportWidth = viewportRef.current.clientWidth;
    const cardWidth = (viewportWidth - gapRef.current * (itemsPerView - 1)) / itemsPerView;
    const setWidth = cardWidth * bestSellerProducts.length + gapRef.current * (bestSellerProducts.length - 1);

    cardWidthRef.current = cardWidth;
    setWidthRef.current = setWidth;
    trackRef.current.style.setProperty("--card-width", `${cardWidth}px`);

    if (offsetRef.current === 0) {
      offsetRef.current = -setWidth;
    }

    applyTrackTransform(offsetRef.current);
    updateFocusStyles();
  };

  const jumpByCard = (direction: "left" | "right") => {
    const delta = cardWidthRef.current + gapRef.current;
    offsetRef.current += direction === "left" ? delta : -delta;
    velocityRef.current = direction === "left" ? 0.15 : -0.15;
    clampInfiniteOffset();
    applyTrackTransform(offsetRef.current);
    updateFocusStyles();
  };

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    recalcLayout();

    const onResize = () => recalcLayout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    targetSpeedRef.current = isHovered || reduceMotionRef.current ? 0 : 32;
  }, [isHovered]);

  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;

      currentSpeedRef.current += (targetSpeedRef.current - currentSpeedRef.current) * 0.06;

      if (!draggingRef.current && setWidthRef.current > 0) {
        if (!reduceMotionRef.current) {
          offsetRef.current -= (currentSpeedRef.current * dt) / 1000;
        }

        if (Math.abs(velocityRef.current) > 0.01) {
          offsetRef.current += velocityRef.current * dt;
          velocityRef.current *= 0.93;
        } else {
          velocityRef.current = 0;
        }

        clampInfiniteOffset();
        applyTrackTransform(offsetRef.current);
        updateFocusStyles();
      }

      if (backgroundRef.current) {
        const damp = reduceMotionRef.current ? 0 : 0.08;
        parallaxXRef.current += (parallaxTargetXRef.current - parallaxXRef.current) * damp;
        parallaxYRef.current += (parallaxTargetYRef.current - parallaxYRef.current) * damp;
        backgroundRef.current.style.setProperty("--mx", `${parallaxXRef.current}px`);
        backgroundRef.current.style.setProperty("--my", `${parallaxYRef.current}px`);
      }

      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Top picks</p>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Best Seller Products</h2>
        </div>
        <p className="hidden text-sm text-slate-500 md:block">Focused: {bestSellerProducts[activeIndex]?.name}</p>
      </div>

      <div
        className="group relative overflow-hidden rounded-3xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={(event) => {
          if (reduceMotionRef.current) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          parallaxTargetXRef.current = x * 0.05;
          parallaxTargetYRef.current = y * 0.05;
        }}
      >
        <div ref={backgroundRef} className="premium-slider-bg absolute inset-0 -z-10" />
        <button
          type="button"
          aria-label="Scroll products left"
          onClick={() => jumpByCard("left")}
          className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/60 bg-white/70 p-3 text-lg font-bold text-slate-700 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white md:left-4 md:flex md:group-hover:opacity-100"
        >
          ←
        </button>

        <div ref={viewportRef} className="overflow-hidden px-4 py-4 md:px-12">
          <div
            ref={trackRef}
            className="flex gap-6 [will-change:transform] touch-pan-y"
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              pointerIdRef.current = event.pointerId;
              draggingRef.current = true;
              dragStartXRef.current = event.clientX;
              dragStartOffsetRef.current = offsetRef.current;
              lastDragXRef.current = event.clientX;
              lastDragTsRef.current = performance.now();
              velocityRef.current = 0;
            }}
            onPointerMove={(event) => {
              if (!draggingRef.current) return;
              offsetRef.current = dragStartOffsetRef.current + (event.clientX - dragStartXRef.current);

              const now = performance.now();
              const dt = Math.max(now - lastDragTsRef.current, 1);
              velocityRef.current = (event.clientX - lastDragXRef.current) / dt;
              lastDragXRef.current = event.clientX;
              lastDragTsRef.current = now;

              clampInfiniteOffset();
              applyTrackTransform(offsetRef.current);
              updateFocusStyles();
            }}
            onPointerUp={(event) => {
              if (pointerIdRef.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              draggingRef.current = false;
            }}
            onPointerCancel={(event) => {
              if (pointerIdRef.current === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
              draggingRef.current = false;
            }}
            onLostPointerCapture={() => {
              draggingRef.current = false;
            }}
          >
            {sliderItems.map((product, index) => (
              <article
                key={`${product.name}-${index}`}
                className="w-[var(--card-width)] shrink-0 py-2 transition-[transform,opacity,filter] duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
              >
                <div
                  className="group/card relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_6px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-400 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_22px_48px_rgba(15,23,42,0.18)]"
                >
                  <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      loading="lazy"
                      className="object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 delay-75 group-hover/card:opacity-100" />
                    <div className="absolute bottom-3 left-3 right-3 flex translate-y-2 items-center justify-center gap-2 opacity-0 transition-all duration-300 delay-100 group-hover/card:translate-y-0 group-hover/card:opacity-100">
                      <button className="rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5">
                        View
                      </button>
                      <button className="rounded-xl bg-[#225A3D] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1b4a32]">
                        Add to cart
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{product.category}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                    <p className="text-base font-bold text-blue-700">{product.price}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <button
          type="button"
          aria-label="Scroll products right"
          onClick={() => jumpByCard("right")}
          className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-white/60 bg-white/70 p-3 text-lg font-bold text-slate-700 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white md:right-4 md:flex md:group-hover:opacity-100"
        >
          →
        </button>
      </div>

      <style jsx>{`
        .premium-slider-bg {
          --mx: 0px;
          --my: 0px;
          background:
            radial-gradient(50% 60% at 10% 38%, rgba(56, 189, 248, 0.16), transparent 72%),
            radial-gradient(46% 52% at 90% 68%, rgba(251, 146, 60, 0.12), transparent 72%),
            linear-gradient(125deg, rgba(15, 23, 42, 0.03), rgba(59, 130, 246, 0.03));
          filter: saturate(112%);
        }

        .premium-slider-bg::before,
        .premium-slider-bg::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          will-change: transform;
        }

        .premium-slider-bg::before {
          width: 360px;
          height: 360px;
          top: -120px;
          left: -90px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.16), transparent 70%);
          transform: translate3d(var(--mx), var(--my), 0);
          animation: bgFloatA 14s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
        }

        .premium-slider-bg::after {
          width: 300px;
          height: 300px;
          bottom: -110px;
          right: -70px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.14), transparent 72%);
          transform: translate3d(calc(var(--mx) * -0.7), calc(var(--my) * -0.7), 0);
          animation: bgFloatB 16s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;
        }

        @keyframes bgFloatA {
          0% {
            transform: translate3d(calc(var(--mx) - 8px), calc(var(--my) - 10px), 0);
          }
          100% {
            transform: translate3d(calc(var(--mx) + 10px), calc(var(--my) + 8px), 0);
          }
        }

        @keyframes bgFloatB {
          0% {
            transform: translate3d(calc(var(--mx) * -0.7 - 8px), calc(var(--my) * -0.7 - 8px), 0);
          }
          100% {
            transform: translate3d(calc(var(--mx) * -0.7 + 9px), calc(var(--my) * -0.7 + 9px), 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .premium-slider-bg::before,
          .premium-slider-bg::after {
            animation: none;
          }
        }

      `}</style>
    </section>
  );
}
