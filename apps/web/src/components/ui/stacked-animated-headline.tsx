"use client";

import { useEffect, useRef } from "react";
import { useGsap } from "../../hooks/use-gsap";

interface StackedAnimatedHeadlineProps {
  lines: string[];
  className?: string;
  gradientLine?: number; // Which line (0-indexed) should have the teal gradient
}

export function StackedAnimatedHeadline({
  lines,
  className = "",
  gradientLine = -1
}: StackedAnimatedHeadlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { gsap, isLoaded, error } = useGsap();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    // Clear container first
    container.innerHTML = "";

    // Create line containers
    lines.forEach((line, lineIndex) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = lineIndex === gradientLine
        ? "text-gradient-primary glow"
        : "text-gradient-primary";

      // Create word containers for each line
      const words = line.split(" ");
      words.forEach((word, wordIndex) => {
        const wordDiv = document.createElement("div");
        wordDiv.className = "inline-block overflow-hidden mr-2";

        // Create character spans
        word.split("").forEach((char, charIndex) => {
          const charSpan = document.createElement("span");
          charSpan.textContent = char;
          charSpan.className = "inline-block";
          charSpan.style.transform = "translateY(100px)";
          charSpan.style.opacity = "0";
          wordDiv.appendChild(charSpan);
        });

        lineDiv.appendChild(wordDiv);
      });

      container.appendChild(lineDiv);
    });

    // Animate characters with GSAP availability check
    const chars = container.querySelectorAll("span");

    // Check if GSAP is available and properly loaded
    if (!isLoaded || !gsap || !gsap.fromTo) {
      if (error) {
        console.warn("GSAP loading error:", error);
      } else {
        console.warn("GSAP not loaded yet, applying fallback animation");
      }

      // Fallback CSS animation
      chars.forEach((char, index) => {
        const element = char as HTMLElement;
        element.style.transition = "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.8s ease";
        element.style.transitionDelay = `${0.5 + (index * 0.1)}s`;

        setTimeout(() => {
          element.style.transform = "translateY(0px)";
          element.style.opacity = "1";
        }, 100);
      });
      return;
    }

    gsap.fromTo(
      chars,
      {
        y: 100,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
        stagger: {
          amount: 1.2,
          from: "start",
        },
        delay: 0.5,
      }
    );
  }, [lines, gradientLine, gsap, isLoaded, error]);

  return (
    <div
      ref={containerRef}
      className={`leading-none tracking-tight ${className}`}
      style={{ minHeight: "1.2em" }}
    />
  );
}