/**
 * Build Creatomate RenderScripts for platform-optimized static images and short reels.
 * Extends the existing reel builder with image post + carousel + story support.
 */

import type { SocialPlatform, ContentType } from "@prisma/client";
import { PLATFORM_SPECS } from "@/lib/content-strategy";

export type ImagePostOpts = {
  platform: SocialPlatform;
  headline: string;
  subtext?: string;
  ctaText?: string;
  backgroundUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  phone?: string;
  style?: "bold" | "clean" | "dark" | "editorial";
};

export type CarouselSlide = {
  headline: string;
  body?: string;
  backgroundUrl?: string;
};

export type CarouselOpts = {
  platform: SocialPlatform;
  title: string;
  slides: CarouselSlide[];
  ctaText?: string;
  brandColor?: string;
  phone?: string;
  style?: "bold" | "clean" | "dark" | "editorial";
};

export type StoryOpts = {
  platform: SocialPlatform;
  headline: string;
  subtext?: string;
  ctaText?: string;
  backgroundUrl?: string;
  brandColor?: string;
  swipeUpText?: string;
};

export type PlatformReelOpts = {
  platform: SocialPlatform;
  hook: string;
  subhead: string;
  cta: string;
  phone?: string;
  backgroundUrls: string[];
  headshotUrl?: string;
  accentColor?: string;
};

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&h=1920&fit=crop";

const STYLE_THEMES = {
  bold: {
    bgOverlay: "rgba(0,0,0,0.55)",
    textColor: "#ffffff",
    accentColor: "#f59e0b",
    fontFamily: "Montserrat",
    fontWeight: "800",
    fontSize: "6 vmin",
  },
  clean: {
    bgOverlay: "rgba(255,255,255,0.92)",
    textColor: "#18181b",
    accentColor: "#d97706",
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: "5 vmin",
  },
  dark: {
    bgOverlay: "rgba(0,0,0,0.85)",
    textColor: "#fafafa",
    accentColor: "#fbbf24",
    fontFamily: "Montserrat",
    fontWeight: "700",
    fontSize: "5.5 vmin",
  },
  editorial: {
    bgOverlay: "rgba(15,15,15,0.7)",
    textColor: "#f5f5f4",
    accentColor: "#ef4444",
    fontFamily: "Playfair Display",
    fontWeight: "700",
    fontSize: "6 vmin",
  },
};

function getDimensions(
  platform: SocialPlatform,
  contentType: ContentType,
): { width: number; height: number } {
  const spec = PLATFORM_SPECS[platform];
  if (contentType === "reel" || contentType === "story") {
    const reel = spec.reelSpecs[0];
    if (reel) return { width: reel.width, height: reel.height };
    return { width: 1080, height: 1920 };
  }
  const img = spec.imageSpecs[0];
  if (img) return { width: img.width, height: img.height };
  return { width: 1080, height: 1080 };
}

export function buildImagePost(opts: ImagePostOpts): Record<string, unknown> {
  const dims = getDimensions(opts.platform, "image_post");
  const theme = STYLE_THEMES[opts.style ?? "bold"];
  const bg = opts.backgroundUrl ?? DEFAULT_BG;
  const accent = opts.brandColor ?? theme.accentColor;

  const elements: Record<string, unknown>[] = [
    {
      type: "image",
      source: bg,
      width: "100%",
      height: "100%",
      fit: "cover",
    },
    {
      type: "shape",
      shape_type: "rectangle",
      width: "100%",
      height: "100%",
      fill_color: theme.bgOverlay,
    },
    {
      type: "text",
      x: "8%",
      y: "35%",
      width: "84%",
      height: "30%",
      x_alignment: "50%",
      y_alignment: "50%",
      fill_color: theme.textColor,
      font_family: theme.fontFamily,
      font_weight: theme.fontWeight,
      font_size: theme.fontSize,
      line_height: "130%",
      text: opts.headline,
    },
  ];

  if (opts.subtext) {
    elements.push({
      type: "text",
      x: "8%",
      y: "62%",
      width: "84%",
      height: "12%",
      x_alignment: "50%",
      y_alignment: "50%",
      fill_color: theme.textColor,
      font_family: theme.fontFamily,
      font_weight: "400",
      font_size: "3.5 vmin",
      line_height: "140%",
      text: opts.subtext,
      opacity: "80%",
    });
  }

  if (opts.ctaText) {
    elements.push({
      type: "text",
      x: "8%",
      y: "80%",
      width: "84%",
      height: "10%",
      x_alignment: "50%",
      y_alignment: "50%",
      fill_color: accent,
      font_family: theme.fontFamily,
      font_weight: "700",
      font_size: "4 vmin",
      text: opts.ctaText,
      background_color: "rgba(0,0,0,0.3)",
      background_x_padding: "5%",
      background_y_padding: "3%",
      background_border_radius: "2%",
    });
  }

  if (opts.phone) {
    elements.push({
      type: "text",
      x: "8%",
      y: "92%",
      width: "84%",
      height: "5%",
      x_alignment: "50%",
      y_alignment: "50%",
      fill_color: theme.textColor,
      font_family: theme.fontFamily,
      font_weight: "500",
      font_size: "3 vmin",
      text: opts.phone,
      opacity: "70%",
    });
  }

  return {
    output_format: "jpg",
    width: dims.width,
    height: dims.height,
    elements,
  };
}

export function buildCarouselSlides(opts: CarouselOpts): Record<string, unknown>[] {
  const dims = getDimensions(opts.platform, "image_post");
  const theme = STYLE_THEMES[opts.style ?? "clean"];
  const accent = opts.brandColor ?? theme.accentColor;

  const scripts: Record<string, unknown>[] = [];

  scripts.push({
    output_format: "jpg",
    width: dims.width,
    height: dims.height,
    elements: [
      {
        type: "shape",
        shape_type: "rectangle",
        width: "100%",
        height: "100%",
        fill_color: opts.style === "dark" || opts.style === "bold" ? "#0a0a0a" : "#fafafa",
      },
      {
        type: "text",
        x: "10%",
        y: "38%",
        width: "80%",
        height: "24%",
        x_alignment: "50%",
        y_alignment: "50%",
        fill_color: theme.textColor,
        font_family: theme.fontFamily,
        font_weight: theme.fontWeight,
        font_size: "7 vmin",
        line_height: "120%",
        text: opts.title,
      },
      {
        type: "text",
        x: "10%",
        y: "68%",
        width: "80%",
        height: "8%",
        x_alignment: "50%",
        y_alignment: "50%",
        fill_color: accent,
        font_family: theme.fontFamily,
        font_weight: "500",
        font_size: "3.5 vmin",
        text: "Swipe →",
      },
    ],
  });

  opts.slides.forEach((slide, idx) => {
    const bg = slide.backgroundUrl;
    const slideElements: Record<string, unknown>[] = [];

    if (bg) {
      slideElements.push(
        { type: "image", source: bg, width: "100%", height: "100%", fit: "cover" },
        { type: "shape", shape_type: "rectangle", width: "100%", height: "100%", fill_color: theme.bgOverlay },
      );
    } else {
      slideElements.push({
        type: "shape",
        shape_type: "rectangle",
        width: "100%",
        height: "100%",
        fill_color: opts.style === "dark" || opts.style === "bold" ? "#0a0a0a" : "#fafafa",
      });
    }

    slideElements.push({
      type: "text",
      x: "8%",
      y: "5%",
      width: "15%",
      height: "8%",
      x_alignment: "50%",
      y_alignment: "50%",
      fill_color: accent,
      font_family: theme.fontFamily,
      font_weight: "800",
      font_size: "4 vmin",
      text: `${idx + 1}`,
    });

    slideElements.push({
      type: "text",
      x: "10%",
      y: "25%",
      width: "80%",
      height: "25%",
      x_alignment: "50%",
      y_alignment: "0%",
      fill_color: theme.textColor,
      font_family: theme.fontFamily,
      font_weight: "700",
      font_size: "5.5 vmin",
      line_height: "130%",
      text: slide.headline,
    });

    if (slide.body) {
      slideElements.push({
        type: "text",
        x: "10%",
        y: "55%",
        width: "80%",
        height: "25%",
        x_alignment: "50%",
        y_alignment: "0%",
        fill_color: theme.textColor,
        font_family: theme.fontFamily,
        font_weight: "400",
        font_size: "3.8 vmin",
        line_height: "150%",
        text: slide.body,
        opacity: "85%",
      });
    }

    scripts.push({
      output_format: "jpg",
      width: dims.width,
      height: dims.height,
      elements: slideElements,
    });
  });

  if (opts.ctaText) {
    scripts.push({
      output_format: "jpg",
      width: dims.width,
      height: dims.height,
      elements: [
        {
          type: "shape",
          shape_type: "rectangle",
          width: "100%",
          height: "100%",
          fill_color: opts.style === "dark" || opts.style === "bold" ? "#0a0a0a" : "#fafafa",
        },
        {
          type: "text",
          x: "10%",
          y: "35%",
          width: "80%",
          height: "20%",
          x_alignment: "50%",
          y_alignment: "50%",
          fill_color: accent,
          font_family: theme.fontFamily,
          font_weight: "800",
          font_size: "6 vmin",
          line_height: "130%",
          text: opts.ctaText,
        },
        ...(opts.phone
          ? [
              {
                type: "text" as const,
                x: "10%",
                y: "60%",
                width: "80%",
                height: "10%",
                x_alignment: "50%",
                y_alignment: "50%",
                fill_color: theme.textColor,
                font_family: theme.fontFamily,
                font_weight: "500",
                font_size: "4 vmin",
                text: opts.phone,
              },
            ]
          : []),
      ],
    });
  }

  return scripts;
}

export function buildStoryImage(opts: StoryOpts): Record<string, unknown> {
  const dims = getDimensions(opts.platform, "story");
  const theme = STYLE_THEMES.bold;
  const accent = opts.brandColor ?? theme.accentColor;
  const bg = opts.backgroundUrl ?? DEFAULT_BG;

  return {
    output_format: "jpg",
    width: dims.width,
    height: dims.height,
    elements: [
      { type: "image", source: bg, width: "100%", height: "100%", fit: "cover" },
      { type: "shape", shape_type: "rectangle", width: "100%", height: "100%", fill_color: "rgba(0,0,0,0.45)" },
      {
        type: "text",
        x: "8%",
        y: "35%",
        width: "84%",
        height: "20%",
        x_alignment: "50%",
        y_alignment: "50%",
        fill_color: "#ffffff",
        font_family: "Montserrat",
        font_weight: "800",
        font_size: "7 vmin",
        line_height: "120%",
        text: opts.headline,
      },
      ...(opts.subtext
        ? [
            {
              type: "text",
              x: "8%",
              y: "58%",
              width: "84%",
              height: "10%",
              x_alignment: "50%",
              y_alignment: "50%",
              fill_color: "#ffffff",
              font_family: "Montserrat",
              font_weight: "400",
              font_size: "4 vmin",
              text: opts.subtext,
              opacity: "80%",
            },
          ]
        : []),
      ...(opts.ctaText || opts.swipeUpText
        ? [
            {
              type: "text",
              x: "8%",
              y: "82%",
              width: "84%",
              height: "8%",
              x_alignment: "50%",
              y_alignment: "50%",
              fill_color: accent,
              font_family: "Montserrat",
              font_weight: "700",
              font_size: "4.5 vmin",
              text: opts.swipeUpText ?? opts.ctaText ?? "",
            },
          ]
        : []),
    ],
  };
}

export function buildPlatformReel(opts: PlatformReelOpts): Record<string, unknown> {
  const dims = getDimensions(opts.platform, "reel");
  const maxDuration = PLATFORM_SPECS[opts.platform].reelSpecs[0]?.maxDuration ?? 60;
  const totalDuration = Math.min(16, maxDuration);
  const urls = opts.backgroundUrls.length > 0 ? opts.backgroundUrls : [DEFAULT_BG];
  const accent = opts.accentColor ?? "#fbbf24";

  const sceneDuration = Math.floor((totalDuration - 4.5) / 3);
  const u0 = urls[0] ?? DEFAULT_BG;
  const u1 = urls[1] ?? u0;
  const u2 = urls[2] ?? u0;

  const buildScene = (
    time: number,
    dur: number,
    bgUrl: string,
    text: string,
    sub?: string,
  ): Record<string, unknown> => ({
    type: "composition",
    track: 1,
    time,
    duration: dur,
    elements: [
      {
        type: "image",
        track: 1,
        time: 0,
        duration: dur,
        source: bgUrl,
        width: "100%",
        height: "100%",
        fit: "cover",
        animations: [{ time: 0, duration: 0.6, transition: true, type: "fade" }],
      },
      {
        type: "text",
        track: 2,
        time: 0.2,
        duration: dur - 0.2,
        x: "5%",
        y: "72%",
        width: "90%",
        height: "22%",
        x_alignment: "50%",
        y_alignment: "50%",
        fill_color: "#ffffff",
        stroke_color: "#000000",
        stroke_width: "0.3 vmin",
        font_family: "Montserrat",
        font_weight: "700",
        font_size: "4.5 vmin",
        line_height: "130%",
        text: sub ? `${text}\n${sub}` : text,
        background_color: "rgba(0,0,0,0.45)",
        background_x_padding: "4%",
        background_y_padding: "3%",
        background_border_radius: "2%",
        animations: [
          { time: 0, duration: 0.5, easing: "quadratic-out", type: "text-slide", scope: "split-clip", split: "line", direction: "up" },
        ],
      },
    ],
    animations: [{ time: 0, duration: 0.5, transition: true, type: "fade" }],
  });

  const s1End = sceneDuration;
  const s2End = sceneDuration * 2;
  const s3End = sceneDuration * 3;

  const elements: Record<string, unknown>[] = [
    buildScene(0, sceneDuration, u0, opts.hook, opts.subhead.slice(0, 120)),
    buildScene(s1End, sceneDuration, u1, opts.subhead.slice(0, 140), "Window Depot USA · Milwaukee"),
    buildScene(s2End, sceneDuration, u2, "4.9 Google · 1,000+ reviews · A+ BBB", "Serving SE Wisconsin"),
    {
      type: "composition",
      track: 1,
      time: s3End,
      duration: 4.5,
      fill_color: "#0a0a0a",
      elements: [
        ...(opts.headshotUrl
          ? [{
              type: "image",
              track: 1,
              time: 0,
              duration: 4.5,
              source: opts.headshotUrl,
              x: "50%",
              y: "28%",
              width: "28%",
              height: "16%",
              fit: "cover",
              border_radius: "50%",
            }]
          : []),
        {
          type: "text",
          track: 2,
          time: 0.3,
          duration: 4,
          x: "8%",
          y: "48%",
          width: "84%",
          height: "38%",
          x_alignment: "50%",
          y_alignment: "50%",
          fill_color: accent,
          font_family: "Montserrat",
          font_weight: "800",
          font_size: "5 vmin",
          text: `${opts.cta}\n${opts.phone ?? "(414) 312-5213"}`,
          line_height: "140%",
          animations: [{ time: 0, duration: 0.6, type: "fade" }],
        },
      ],
      animations: [{ time: 0, duration: 0.6, transition: true, type: "fade" }],
    },
  ];

  return {
    output_format: "mp4",
    width: dims.width,
    height: dims.height,
    frame_rate: 30,
    duration: totalDuration,
    elements,
  };
}

export function getContentDimensions(
  platform: SocialPlatform,
  contentType: ContentType,
): { width: number; height: number } {
  return getDimensions(platform, contentType);
}
