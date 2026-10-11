"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { OWL_FRONT_ASSETS } from "./data";

export interface EyeConfigItem {
  cx: number; // Center X as percentage of owl image width (0-100)
  cy: number; // Center Y as percentage of owl image height (0-100)
  rx: number; // Horizontal radius as percentage of owl image width (0-100)
  ry: number; // Vertical radius as percentage of owl image height (0-100)
  irisSize: number; // Iris width as percentage of eye window width (0-200)
  maxX: number; // Max horizontal gaze offset as percentage of eye window width
  maxY: number; // Max vertical gaze offset as percentage of eye window height
  restOx: number; // Horizontal rest offset percentage of eye window width
  restOy: number; // Vertical rest offset percentage of eye window height
}

export interface EyeConfig {
  left: EyeConfigItem;
  right: EyeConfigItem;
}

/**
 * Calibrated EYE_CONFIG for Front-Facing Owl (owl-front-blank.png: 1156 x 1361)
 * Measured with pixel precision from original owl-front.png and owl-front-blank.png
 */
export const EYE_CONFIG: EyeConfig = {
  left: {
    cx: 33.8,
    cy: 36.6,
    rx: 9.7,
    ry: 8.0,
    irisSize: 75.5,
    maxX: 14,
    maxY: 12,
    restOx: 12.0,
    restOy: -4.6,
  },
  right: {
    cx: 65.3,
    cy: 36.6,
    rx: 9.7,
    ry: 8.0,
    irisSize: 75.5,
    maxX: 14,
    maxY: 12,
    restOx: -11.8,
    restOy: -5.0,
  },
};

export interface OwlEyesProps {
  gaze?: { x: number; y: number };
  className?: string;
  priority?: boolean;
  leftEyeRef?: React.Ref<HTMLDivElement>;
  rightEyeRef?: React.Ref<HTMLDivElement>;
  leftIrisRef?: React.Ref<HTMLDivElement>;
  rightIrisRef?: React.Ref<HTMLDivElement>;
}

export function OwlEyes({
  gaze = { x: 0, y: 0 },
  className = "",
  priority = true,
  leftEyeRef,
  rightEyeRef,
  leftIrisRef,
  rightIrisRef,
}: OwlEyesProps) {
  const [isDebug, setIsDebug] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [config, setConfig] = useState<EyeConfig>(EYE_CONFIG);
  const [simGaze, setSimGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);

  // Check for ?eyes=debug and ?overlay=1 in dev mode
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("eyes") === "debug") {
        setIsDebug(true);
      }
      if (params.get("overlay") === "1") {
        setShowOverlay(true);
      }
    }
  }, []);

  const activeGaze = isDebug ? simGaze : gaze;

  const leftOx = config.left.restOx + activeGaze.x * config.left.maxX;
  const leftOy = config.left.restOy + activeGaze.y * config.left.maxY;
  const rightOx = config.right.restOx + activeGaze.x * config.right.maxX;
  const rightOy = config.right.restOy + activeGaze.y * config.right.maxY;

  const copyConfig = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        aspectRatio: `${OWL_FRONT_ASSETS.naturalDimensions.width} / ${OWL_FRONT_ASSETS.naturalDimensions.height}`,
      }}
    >
      {/* 1. Base Owl Mascot Image (owl-front-blank.png) */}
      <Image
        src={OWL_FRONT_ASSETS.base}
        alt="FinSage owl mascot"
        width={OWL_FRONT_ASSETS.naturalDimensions.width}
        height={OWL_FRONT_ASSETS.naturalDimensions.height}
        priority={priority}
        className="relative z-0 h-auto w-full object-contain pointer-events-none drop-shadow-[0_16px_28px_rgba(24,18,43,0.14)]"
      />

      {/* 2. Left Eye Window (Viewer's Left) */}
      <div
        ref={leftEyeRef}
        className="absolute z-20 overflow-hidden"
        style={{
          left: `${config.left.cx - config.left.rx}%`,
          top: `${config.left.cy - config.left.ry}%`,
          width: `${config.left.rx * 2}%`,
          height: `${config.left.ry * 2}%`,
          clipPath: "ellipse(50% 50% at 50% 50%)",
          outline: isDebug ? "2px dashed #EF4444" : "none",
        }}
      >
        <div
          ref={leftIrisRef}
          className="absolute flex items-center justify-center will-change-transform"
          style={{
            left: "50%",
            top: "50%",
            width: `${config.left.irisSize}%`,
            aspectRatio: "1 / 1",
            transform: `translate(-50%, -50%) translate3d(${leftOx}%, ${leftOy}%, 0)`,
          }}
        >
          <Image
            src={OWL_FRONT_ASSETS.iris}
            alt=""
            width={OWL_FRONT_ASSETS.irisNaturalDimensions.width}
            height={OWL_FRONT_ASSETS.irisNaturalDimensions.height}
            priority={priority}
            className="h-full w-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* 3. Right Eye Window (Viewer's Right) */}
      <div
        ref={rightEyeRef}
        className="absolute z-20 overflow-hidden"
        style={{
          left: `${config.right.cx - config.right.rx}%`,
          top: `${config.right.cy - config.right.ry}%`,
          width: `${config.right.rx * 2}%`,
          height: `${config.right.ry * 2}%`,
          clipPath: "ellipse(50% 50% at 50% 50%)",
          outline: isDebug ? "2px dashed #3B82F6" : "none",
        }}
      >
        <div
          ref={rightIrisRef}
          className="absolute flex items-center justify-center will-change-transform"
          style={{
            left: "50%",
            top: "50%",
            width: `${config.right.irisSize}%`,
            aspectRatio: "1 / 1",
            transform: `translate(-50%, -50%) translate3d(${rightOx}%, ${rightOy}%, 0)`,
          }}
        >
          <Image
            src={OWL_FRONT_ASSETS.iris}
            alt=""
            width={OWL_FRONT_ASSETS.irisNaturalDimensions.width}
            height={OWL_FRONT_ASSETS.irisNaturalDimensions.height}
            priority={priority}
            className="h-full w-full object-contain pointer-events-none"
          />
        </div>
      </div>

      {/* 4. Dev-Only Onion-Skin Overlay (owl-front.png at 50% opacity) */}
      {process.env.NODE_ENV !== "production" && isDebug && showOverlay && (
        <div className="absolute inset-0 z-30 pointer-events-none opacity-50">
          <Image
            src={OWL_FRONT_ASSETS.original}
            alt="Reference overlay"
            width={OWL_FRONT_ASSETS.naturalDimensions.width}
            height={OWL_FRONT_ASSETS.naturalDimensions.height}
            priority
            className="h-auto w-full object-contain"
          />
        </div>
      )}

      {/* Dev-Only Calibration Panel (Guaranteed never rendered in production) */}
      {process.env.NODE_ENV !== "production" && isDebug && (
        <div
          className="fixed bottom-4 right-4 z-50 max-h-[85vh] w-84 overflow-y-auto rounded-2xl border border-[#18122B]/20 bg-white/95 p-4 text-xs shadow-2xl backdrop-blur-md text-[#18122B]"
          style={{ fontFamily: "monospace" }}
        >
          <div className="mb-3 flex items-center justify-between border-b pb-2">
            <span className="font-bold text-sm text-[#18122B]">🦉 Owl Eyes Calibrator</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold border ${
                  showOverlay ? "bg-[#3B82F6] text-white border-[#2563EB]" : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {showOverlay ? "Overlay ON" : "Overlay OFF"}
              </button>
              <button
                onClick={copyConfig}
                className="rounded-lg bg-[#84cc16] px-2.5 py-1 text-xs font-semibold text-[#18122B] shadow hover:bg-[#a3e635]"
              >
                {copied ? "✓ Copied!" : "Copy config"}
              </button>
            </div>
          </div>

          {/* Gaze Simulation Controls */}
          <div className="mb-4 rounded-xl bg-[#FAF8F5] p-2.5 border border-[#E5DAC4]">
            <div className="mb-1 font-bold">Simulated Gaze (X: {simGaze.x.toFixed(2)}, Y: {simGaze.y.toFixed(2)})</div>
            <div className="mb-2 grid grid-cols-5 gap-1">
              <button
                onClick={() => setSimGaze({ x: 0, y: 0 })}
                className="rounded bg-white px-1 py-0.5 border text-[10px] hover:bg-gray-100 font-bold"
              >
                Center
              </button>
              <button
                onClick={() => setSimGaze({ x: -1, y: 0 })}
                className="rounded bg-white px-1 py-0.5 border text-[10px] hover:bg-gray-100"
              >
                Full L
              </button>
              <button
                onClick={() => setSimGaze({ x: 1, y: 0 })}
                className="rounded bg-white px-1 py-0.5 border text-[10px] hover:bg-gray-100"
              >
                Full R
              </button>
              <button
                onClick={() => setSimGaze({ x: 0, y: -1 })}
                className="rounded bg-white px-1 py-0.5 border text-[10px] hover:bg-gray-100"
              >
                Full U
              </button>
              <button
                onClick={() => setSimGaze({ x: 0, y: 1 })}
                className="rounded bg-white px-1 py-0.5 border text-[10px] hover:bg-gray-100"
              >
                Full D
              </button>
            </div>
            <div className="mb-2 grid grid-cols-4 gap-1">
              <button
                onClick={() => setSimGaze({ x: -0.7, y: -0.7 })}
                className="rounded bg-white px-1 py-0.5 border text-[9px] hover:bg-gray-100"
              >
                Top-Left
              </button>
              <button
                onClick={() => setSimGaze({ x: 0.7, y: -0.7 })}
                className="rounded bg-white px-1 py-0.5 border text-[9px] hover:bg-gray-100"
              >
                Top-Right
              </button>
              <button
                onClick={() => setSimGaze({ x: -0.7, y: 0.7 })}
                className="rounded bg-white px-1 py-0.5 border text-[9px] hover:bg-gray-100"
              >
                Bot-Left
              </button>
              <button
                onClick={() => setSimGaze({ x: 0.7, y: 0.7 })}
                className="rounded bg-white px-1 py-0.5 border text-[9px] hover:bg-gray-100"
              >
                Bot-Right
              </button>
            </div>
            <label className="flex items-center justify-between text-[11px]">
              <span>Gaze X:</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={simGaze.x}
                onChange={(e) => setSimGaze((prev) => ({ ...prev, x: parseFloat(e.target.value) }))}
                className="w-36"
              />
            </label>
            <label className="flex items-center justify-between text-[11px] mt-1">
              <span>Gaze Y:</span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={simGaze.y}
                onChange={(e) => setSimGaze((prev) => ({ ...prev, y: parseFloat(e.target.value) }))}
                className="w-36"
              />
            </label>
          </div>

          {/* Left Eye Sliders */}
          <div className="mb-3 rounded-xl bg-red-50/60 p-2 border border-red-200">
            <div className="mb-1 font-bold text-red-800">Left Eye (Red Outline)</div>
            {(Object.keys(config.left) as Array<keyof EyeConfigItem>).map((key) => (
              <label key={`left-${key}`} className="flex items-center justify-between text-[10px] py-0.5">
                <span>{key}: {config.left[key]}</span>
                <input
                  type="range"
                  min={key.includes("Size") ? "30" : key.includes("max") ? "0" : key.includes("rest") ? "-30" : "0"}
                  max={key.includes("Size") ? "120" : key.includes("max") ? "40" : key.includes("rest") ? "30" : "100"}
                  step="0.1"
                  value={config.left[key]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      left: { ...prev.left, [key]: val },
                    }));
                  }}
                  className="w-28"
                />
              </label>
            ))}
          </div>

          {/* Right Eye Sliders */}
          <div className="rounded-xl bg-blue-50/60 p-2 border border-blue-200">
            <div className="mb-1 font-bold text-blue-800">Right Eye (Blue Outline)</div>
            {(Object.keys(config.right) as Array<keyof EyeConfigItem>).map((key) => (
              <label key={`right-${key}`} className="flex items-center justify-between text-[10px] py-0.5">
                <span>{key}: {config.right[key]}</span>
                <input
                  type="range"
                  min={key.includes("Size") ? "30" : key.includes("max") ? "0" : key.includes("rest") ? "-30" : "0"}
                  max={key.includes("Size") ? "120" : key.includes("max") ? "40" : key.includes("rest") ? "30" : "100"}
                  step="0.1"
                  value={config.right[key]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setConfig((prev) => ({
                      ...prev,
                      right: { ...prev.right, [key]: val },
                    }));
                  }}
                  className="w-28"
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
