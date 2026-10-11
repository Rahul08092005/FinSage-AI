"use client";

import { useEffect, useRef } from "react";
import { EYE_CONFIG, EyeConfigItem } from "./OwlEyes";

export interface UseGazeProps {
  sectionRef: React.RefObject<HTMLElement | null>;
  leftEyeRef?: React.RefObject<HTMLElement | null>;
  rightEyeRef?: React.RefObject<HTMLElement | null>;
  leftIrisRef?: React.RefObject<HTMLElement | null>;
  rightIrisRef?: React.RefObject<HTMLElement | null>;
  owlWrapperRef?: React.RefObject<HTMLElement | null>;
  mobileLeftEyeRef?: React.RefObject<HTMLElement | null>;
  mobileRightEyeRef?: React.RefObject<HTMLElement | null>;
  mobileLeftIrisRef?: React.RefObject<HTMLElement | null>;
  mobileRightIrisRef?: React.RefObject<HTMLElement | null>;
  mobileOwlWrapperRef?: React.RefObject<HTMLElement | null>;
  isPaused?: boolean;
}

export function useGaze({
  sectionRef,
  leftEyeRef,
  rightEyeRef,
  leftIrisRef,
  rightIrisRef,
  owlWrapperRef,
  mobileLeftEyeRef,
  mobileRightEyeRef,
  mobileLeftIrisRef,
  mobileRightIrisRef,
  mobileOwlWrapperRef,
  isPaused = false,
}: UseGazeProps) {
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Store all mutable runtime animation state in refs — NO React state re-renders per frame
  const stateRef = useRef({
    isIntersecting: false,
    isVisible: true,
    isPointerInside: false,
    pointerX: 0,
    pointerY: 0,
    lastPointerMoveTime: 0,
    activeCardEl: null as HTMLElement | null,
    touchGlanceTarget: null as { x: number; y: number } | null,
    touchGlanceEndTime: 0,
    idleGlanceTarget: null as { x: number; y: number } | null,
    idleGlanceEndTime: 0,
    nextIdleGlanceTime: 0,
    leftEyeRect: null as DOMRect | null,
    rightEyeRect: null as DOMRect | null,
    leftCurrent: { ox: 0, oy: 0 },
    rightCurrent: { ox: 0, oy: 0 },
    headCurrent: { rotX: 0, rotY: 0, transX: 0, transY: 0 },
    parallaxCurrent: { x: 0, y: 0 },
    lastFrameTime: 0,
    rafId: 0,
    rectsDirty: true,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    const state = stateRef.current;
    state.lastPointerMoveTime = performance.now();
    state.nextIdleGlanceTime = performance.now() + 4000;

    // 1. Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    state.prefersReducedMotion = mediaQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      state.prefersReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", onMotionChange);

    // 2. Refresh Eye Bounding Rects (cached, updated on resize/scroll)
    const updateEyeRects = () => {
      // Find whichever eye pair is currently rendered/visible
      const lEl =
        (leftEyeRef?.current && leftEyeRef.current.offsetParent !== null ? leftEyeRef.current : null) ||
        (mobileLeftEyeRef?.current && mobileLeftEyeRef.current.offsetParent !== null ? mobileLeftEyeRef.current : null) ||
        leftEyeRef?.current ||
        mobileLeftEyeRef?.current;

      const rEl =
        (rightEyeRef?.current && rightEyeRef.current.offsetParent !== null ? rightEyeRef.current : null) ||
        (mobileRightEyeRef?.current && mobileRightEyeRef.current.offsetParent !== null ? mobileRightEyeRef.current : null) ||
        rightEyeRef?.current ||
        mobileRightEyeRef?.current;

      if (lEl) {
        state.leftEyeRect = lEl.getBoundingClientRect();
      }
      if (rEl) {
        state.rightEyeRect = rEl.getBoundingClientRect();
      }
      state.rectsDirty = false;
    };

    let scrollResizeScheduled = false;
    const scheduleRectUpdate = () => {
      if (!scrollResizeScheduled) {
        scrollResizeScheduled = true;
        requestAnimationFrame(() => {
          updateEyeRects();
          scrollResizeScheduled = false;
        });
      }
    };

    window.addEventListener("resize", scheduleRectUpdate, { passive: true });
    window.addEventListener("scroll", scheduleRectUpdate, { passive: true });

    // 3. Pointer Move, Leave, and Enter Listeners on Window
    const onPointerMove = (e: PointerEvent) => {
      state.pointerX = e.clientX;
      state.pointerY = e.clientY;
      state.isPointerInside = true;
      state.lastPointerMoveTime = performance.now();
      // Cancel any active idle glance immediately
      state.idleGlanceTarget = null;
    };

    const onPointerLeave = () => {
      state.isPointerInside = false;
      state.activeCardEl = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave, { passive: true });
    window.addEventListener("blur", onPointerLeave, { passive: true });

    // 4. Feature Card Interactions via Event Delegation on Section
    const sectionEl = sectionRef.current;
    const onSectionPointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest("[data-owl-card]") as HTMLElement | null;
      if (card) {
        state.activeCardEl = card;
        state.lastPointerMoveTime = performance.now();
        state.idleGlanceTarget = null;
      }
    };

    const onSectionPointerOut = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest("[data-owl-card]") as HTMLElement | null;
      if (card && state.activeCardEl === card) {
        state.activeCardEl = null;
      }
    };

    const onSectionFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest("[data-owl-card]") as HTMLElement | null;
      if (card) {
        state.activeCardEl = card;
        state.lastPointerMoveTime = performance.now();
        state.idleGlanceTarget = null;
      }
    };

    const onSectionFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest("[data-owl-card]") as HTMLElement | null;
      if (card && state.activeCardEl === card) {
        state.activeCardEl = null;
      }
    };

    const onSectionTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const card = target?.closest("[data-owl-card]") as HTMLElement | null;
      if (card) {
        const rect = card.getBoundingClientRect();
        state.touchGlanceTarget = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        state.touchGlanceEndTime = performance.now() + 1500;
      }
    };

    if (sectionEl) {
      sectionEl.addEventListener("pointerover", onSectionPointerOver, { passive: true });
      sectionEl.addEventListener("pointerout", onSectionPointerOut, { passive: true });
      sectionEl.addEventListener("focusin", onSectionFocusIn, { passive: true });
      sectionEl.addEventListener("focusout", onSectionFocusOut, { passive: true });
      sectionEl.addEventListener("touchstart", onSectionTouchStart, { passive: true });
    }

    // 5. Visibility and Intersection Observers
    const onVisibilityChange = () => {
      state.isVisible = document.visibilityState === "visible";
      if (state.isVisible && state.isIntersecting) {
        startAnimationLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          state.isIntersecting = entry.isIntersecting;
          if (entry.isIntersecting) {
            updateEyeRects();
            startAnimationLoop();
          }
        }
      },
      { threshold: 0.05 }
    );

    if (sectionEl) {
      observer.observe(sectionEl);
    }

    // 6. Animation Loop (rAF)
    const animate = (timestamp: number) => {
      if (!state.isIntersecting || !state.isVisible) {
        state.rafId = 0;
        return;
      }

      if (!state.leftEyeRect || !state.rightEyeRect || state.rectsDirty) {
        updateEyeRects();
      }

      if (!state.lastFrameTime) {
        state.lastFrameTime = timestamp;
      }
      const dt = Math.min((timestamp - state.lastFrameTime) / 1000, 0.1);
      state.lastFrameTime = timestamp;

      const now = timestamp;

      // Determine Target Point (Screen X, Y)
      let targetX: number | null = null;
      let targetY: number | null = null;

      // Priority 1: Touch glance
      if (state.touchGlanceTarget && now < state.touchGlanceEndTime) {
        targetX = state.touchGlanceTarget.x;
        targetY = state.touchGlanceTarget.y;
      } else {
        state.touchGlanceTarget = null;

        // Priority 2: Card Hover / Keyboard Focus
        if (!isPausedRef.current && state.activeCardEl && state.activeCardEl.isConnected) {
          const cardRect = state.activeCardEl.getBoundingClientRect();
          targetX = cardRect.left + cardRect.width / 2;
          targetY = cardRect.top + cardRect.height / 2;
        }
        // Priority 3: Pointer within window
        else if (!isPausedRef.current && state.isPointerInside) {
          targetX = state.pointerX;
          targetY = state.pointerY;
        }
        // Priority 4: Idle Glances (after 4s of inactivity, if not prefers-reduced-motion and not paused)
        else if (!isPausedRef.current && !state.prefersReducedMotion) {
          const idleTime = now - state.lastPointerMoveTime;

          if (idleTime > 4000) {
            if (state.idleGlanceTarget && now < state.idleGlanceEndTime) {
              targetX = state.idleGlanceTarget.x;
              targetY = state.idleGlanceTarget.y;
            } else {
              state.idleGlanceTarget = null;
              if (now > state.nextIdleGlanceTime && sectionEl) {
                const cards = sectionEl.querySelectorAll("[data-owl-card]");
                if (cards.length > 0) {
                  const randomCard = cards[Math.floor(Math.random() * cards.length)] as HTMLElement;
                  const cardRect = randomCard.getBoundingClientRect();
                  state.idleGlanceTarget = {
                    x: cardRect.left + cardRect.width / 2,
                    y: cardRect.top + cardRect.height / 2,
                  };
                  state.idleGlanceEndTime = now + 1200; // 1.2s glance
                  state.nextIdleGlanceTime = now + 1200 + 2000 + Math.random() * 2000; // 3.2s - 5.2s cycle
                  targetX = state.idleGlanceTarget.x;
                  targetY = state.idleGlanceTarget.y;
                }
              }
            }
          }
        }
      }

      // 7. Update Eyes via GPU Transform
      const updateEye = (
        eyeRect: DOMRect | null,
        irisEls: (HTMLElement | null | undefined)[],
        cfg: EyeConfigItem,
        current: { ox: number; oy: number }
      ) => {
        if (!eyeRect) return;

        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;

        const restOx = cfg.restOx ?? 0;
        const restOy = cfg.restOy ?? 0;

        let targetOx = restOx;
        let targetOy = restOy;

        if (!isPausedRef.current && targetX !== null && targetY !== null) {
          const dx = targetX - eyeCenterX;
          const dy = targetY - eyeCenterY;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.5) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            // Soft-clamped distance function (tanh)
            const scale = Math.tanh(dist / 350);

            targetOx = restOx + dirX * cfg.maxX * scale;
            targetOy = restOy + dirY * cfg.maxY * scale;

            // Elliptical boundary clamping relative to rest position
            const relX = targetOx - restOx;
            const relY = targetOy - restOy;
            const norm = (relX / cfg.maxX) ** 2 + (relY / cfg.maxY) ** 2;
            if (norm > 1) {
              const factor = 1 / Math.sqrt(norm);
              targetOx = restOx + relX * factor;
              targetOy = restOy + relY * factor;
            }
          }
        }

        // Frame-rate independent exponential smoothing
        const alpha = 1 - Math.exp(-dt * 12);
        current.ox += (targetOx - current.ox) * alpha;
        current.oy += (targetOy - current.oy) * alpha;

        // Apply to all active iris DOM nodes
        const transformStr = `translate(-50%, -50%) translate3d(${current.ox.toFixed(3)}%, ${current.oy.toFixed(3)}%, 0)`;
        for (const el of irisEls) {
          if (el) {
            el.style.transform = transformStr;
          }
        }
      };

      updateEye(
        state.leftEyeRect,
        [leftIrisRef?.current, mobileLeftIrisRef?.current],
        EYE_CONFIG.left,
        state.leftCurrent
      );
      updateEye(
        state.rightEyeRect,
        [rightIrisRef?.current, mobileRightIrisRef?.current],
        EYE_CONFIG.right,
        state.rightCurrent
      );

      // 8. Head Tilt (Subtle 3D Perspective Rotate & Translate on Owl Wrapper)
      const wrappers = [owlWrapperRef?.current, mobileOwlWrapperRef?.current].filter(Boolean) as HTMLElement[];
      if (wrappers.length > 0) {
        if (state.prefersReducedMotion) {
          for (const w of wrappers) {
            w.style.transform = "none";
          }
        } else {
          const avgNormX = (state.leftCurrent.ox + state.rightCurrent.ox) / (2 * EYE_CONFIG.left.maxX);
          const avgNormY = (state.leftCurrent.oy + state.rightCurrent.oy) / (2 * EYE_CONFIG.left.maxY);

          const targetRotY = avgNormX * 5.5; // max ~5.5deg
          const targetRotX = -avgNormY * 3.8; // max ~3.8deg
          const targetTransX = avgNormX * 5.5; // max ~5.5px
          const targetTransY = avgNormY * 4.5; // max ~4.5px

          const headAlpha = 1 - Math.exp(-dt * 12);
          state.headCurrent.rotY += (targetRotY - state.headCurrent.rotY) * headAlpha;
          state.headCurrent.rotX += (targetRotX - state.headCurrent.rotX) * headAlpha;
          state.headCurrent.transX += (targetTransX - state.headCurrent.transX) * headAlpha;
          state.headCurrent.transY += (targetTransY - state.headCurrent.transY) * headAlpha;

          const headTransform = `perspective(800px) rotateY(${state.headCurrent.rotY.toFixed(2)}deg) rotateX(${state.headCurrent.rotX.toFixed(2)}deg) translate3d(${state.headCurrent.transX.toFixed(2)}px, ${state.headCurrent.transY.toFixed(2)}px, 0)`;
          for (const w of wrappers) {
            w.style.transform = headTransform;
          }
        }
      }

      // 9. Depth Parallax on Floating Decor Elements (Opposite to Gaze)
      if (sectionEl) {
        if (state.prefersReducedMotion) {
          sectionEl.style.setProperty("--decor-parallax-x", "0px");
          sectionEl.style.setProperty("--decor-parallax-y", "0px");
        } else {
          const avgNormX = (state.leftCurrent.ox + state.rightCurrent.ox) / (2 * EYE_CONFIG.left.maxX);
          const avgNormY = (state.leftCurrent.oy + state.rightCurrent.oy) / (2 * EYE_CONFIG.left.maxY);

          const targetParallaxX = -avgNormX * 9;
          const targetParallaxY = -avgNormY * 9;

          const pAlpha = 1 - Math.exp(-dt * 10);
          state.parallaxCurrent.x += (targetParallaxX - state.parallaxCurrent.x) * pAlpha;
          state.parallaxCurrent.y += (targetParallaxY - state.parallaxCurrent.y) * pAlpha;

          sectionEl.style.setProperty("--decor-parallax-x", `${state.parallaxCurrent.x.toFixed(2)}px`);
          sectionEl.style.setProperty("--decor-parallax-y", `${state.parallaxCurrent.y.toFixed(2)}px`);
        }
      }

      state.rafId = requestAnimationFrame(animate);
    };

    const startAnimationLoop = () => {
      if (!state.rafId) {
        state.lastFrameTime = performance.now();
        state.rafId = requestAnimationFrame(animate);
      }
    };

    updateEyeRects();
    startAnimationLoop();

    return () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      }
      mediaQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", scheduleRectUpdate);
      window.removeEventListener("scroll", scheduleRectUpdate);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();

      if (sectionEl) {
        sectionEl.removeEventListener("pointerover", onSectionPointerOver);
        sectionEl.removeEventListener("pointerout", onSectionPointerOut);
        sectionEl.removeEventListener("focusin", onSectionFocusIn);
        sectionEl.removeEventListener("focusout", onSectionFocusOut);
        sectionEl.removeEventListener("touchstart", onSectionTouchStart);
      }
    };
  }, [
    sectionRef,
    leftEyeRef,
    rightEyeRef,
    leftIrisRef,
    rightIrisRef,
    owlWrapperRef,
    mobileLeftEyeRef,
    mobileRightEyeRef,
    mobileLeftIrisRef,
    mobileRightIrisRef,
    mobileOwlWrapperRef,
  ]);
}
