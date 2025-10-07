"use client";

import { useEffect, useState } from "react";

type GSAPLike = { fromTo: (targets: unknown, fromVars: unknown, toVars: unknown) => unknown };

export function useGsap() {
  const [gsap, setGsap] = useState<GSAPLike | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGsap() {
      try {
        // Try dynamic import first
        const gsapModule = await import("gsap");
        const gsapInstance = gsapModule.gsap || gsapModule.default || gsapModule;

        if (gsapInstance && typeof gsapInstance.fromTo === 'function') {
          setGsap(gsapInstance);
          setIsLoaded(true);
          setError(null);
        } else {
          throw new Error("GSAP methods not available");
        }
      } catch (err) {
        console.error("Failed to load GSAP:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoaded(false);
      }
    }

    loadGsap();
  }, []);

  return { gsap, isLoaded, error };
}