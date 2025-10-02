"use client";

import { useEffect, useRef, useCallback } from "react";
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

  // First, let's render the static structure to ensure visibility
  const renderStaticStructure = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    lines.forEach((line, lineIndex) => {
      const lineDiv = document.createElement("div");
      lineDiv.className = `stacked-headline-line block w-full whitespace-nowrap ${lineIndex === gradientLine
        ? "text-gradient-primary glow"
        : "text-gradient-primary"}`;
      lineDiv.textContent = line;
      container.appendChild(lineDiv);
    });
  }, [lines, gradientLine]);

  useEffect(() => {
    // First render static structure to ensure text is visible
    renderStaticStructure();

    // Add a small delay to ensure DOM is ready, then add animation
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;

      // Now create animated structure
      container.innerHTML = "";

      lines.forEach((line, lineIndex) => {
        const lineDiv = document.createElement("div");
        lineDiv.className = `stacked-headline-line block w-full whitespace-nowrap ${lineIndex === gradientLine
          ? "text-gradient-primary glow"
          : "text-gradient-primary"}`;
        lineDiv.style.display = "inline-flex";
        lineDiv.style.flexWrap = "nowrap";
        lineDiv.style.alignItems = "flex-end";
        lineDiv.style.columnGap = "0.35em";

        const words = line.split(/\s+/).filter(Boolean);

        if (words.length === 0) {
          container.appendChild(lineDiv);
          return;
        }

        words.forEach((word, wordIndex) => {
          const wordWrapper = document.createElement("div");
          wordWrapper.className = "stacked-headline-word inline-flex";
          wordWrapper.style.overflow = "hidden";
          wordWrapper.style.background = "inherit";
          wordWrapper.style.lineHeight = "1";
          wordWrapper.style.alignItems = "flex-end";
          wordWrapper.style.marginRight = wordIndex === words.length - 1 ? "0" : "0.35em";

          Array.from(word).forEach((char) => {
            const charSpan = document.createElement("span");
            charSpan.textContent = char;
            charSpan.className = "headline-char inline-block";
            charSpan.style.transform = "translateY(120%)";
            charSpan.style.opacity = "0";
            charSpan.style.willChange = "transform, opacity";
            charSpan.style.background = "inherit";
            charSpan.style.transformOrigin = "bottom";
            wordWrapper.appendChild(charSpan);
          });

          lineDiv.appendChild(wordWrapper);
        });

        container.appendChild(lineDiv);
      });

      // Animate characters
      const chars = container.querySelectorAll(".headline-char");

      // Check if GSAP is available
      if (!isLoaded || !gsap || typeof gsap.fromTo !== 'function') {
        // Fallback CSS animation
        chars.forEach((char, index) => {
          const element = char as HTMLElement;
          element.style.transition = "transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.8s ease";
          element.style.transitionDelay = `${0.3 + (index * 0.05)}s`;

          setTimeout(() => {
            element.style.transform = "translateY(0px)";
            element.style.opacity = "1";
          }, 100);
        });
      } else {
        // GSAP animation - stagger each character one at a time
        gsap.fromTo(
          chars,
          {
            y: 100,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(1.4)",
            stagger: {
              each: 0.08,
              from: "start",
            },
            delay: 0.3,
          }
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [lines, gradientLine, gsap, isLoaded, error, renderStaticStructure]);

  return (
    <div
      ref={containerRef}
      className={`stacked-animated-headline leading-none tracking-tight ${className}`}
      style={{
        minHeight: "1.2em",
        display: "block",
        width: "100%"
      }}
    >
      {/* Fallback content in case JavaScript fails */}
      <noscript>
        {lines.map((line, index) => (
          <div
            key={index}
            className={`block w-full whitespace-nowrap ${index === gradientLine
              ? "text-gradient-primary glow"
              : "text-gradient-primary"}`}
          >
            {line}
          </div>
        ))}
      </noscript>
    </div>
  );
}