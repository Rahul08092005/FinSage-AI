/**
 * FinSage Owl & Landing Page Asset Manifest
 * Generated on feat/owl-section
 */

export interface ImageDimension {
  readonly width: number;
  readonly height: number;
}

export interface OwlAssetManifest {
  readonly owl: {
    readonly base: string;
    readonly iris: string;
    readonly original: string;
    readonly naturalDimensions: ImageDimension;
    readonly irisNaturalDimensions: ImageDimension;
  };
  readonly icons: {
    readonly capture: string;
    readonly track: string;
    readonly goals: string;
    readonly household: string;
    readonly ai: string;
    readonly insights: string;
    readonly plan: string;
  };
  readonly decor: {
    readonly coin1: string;
    readonly coin2: string;
    readonly chart: string;
    readonly pie: string;
    readonly card: string;
    readonly gem: string;
    readonly cube: string;
    readonly sparkle: string;
  };
}

export const OWL_ASSETS: OwlAssetManifest = {
  owl: {
    base: "/owl-base.png",
    iris: "/iris.png",
    original: "/owl-original.png",
    naturalDimensions: {
      width: 1294,
      height: 1216,
    },
    irisNaturalDimensions: {
      width: 1254,
      height: 1254,
    },
  },
  icons: {
    capture: "/landing/icons/icon-capture.png",
    track: "/landing/icons/icon-track.png",
    goals: "/landing/icons/icon-goals.png",
    household: "/landing/icons/icon-household.png",
    ai: "/landing/icons/icon-ai.png",
    insights: "/landing/icons/icon-insights.png",
    plan: "/landing/icons/icon-plan.png",
  },
  decor: {
    coin1: "/landing/decor/decor-coin-1.png",
    coin2: "/landing/decor/decor-coin-2.png",
    chart: "/landing/decor/decor-chart.png",
    pie: "/landing/decor/decor-pie.png",
    card: "/landing/decor/decor-card.png",
    gem: "/landing/decor/decor-gem.png",
    cube: "/landing/decor/decor-cube.png",
    sparkle: "/landing/decor/decor-sparkle.png",
  },
} as const;

export type OwlIconKey = keyof typeof OWL_ASSETS.icons;
export type OwlDecorKey = keyof typeof OWL_ASSETS.decor;
