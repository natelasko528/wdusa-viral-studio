/**
 * Build a 9:16 MP4 RenderScript for WDUSA-style Reels (no Creatomate template).
 * @see https://creatomate.com/docs/api/quick-start/create-a-video-by-render-script
 */

export type WdusaReelOpts = {
  hook: string;
  subhead: string;
  cta: string;
  phone?: string;
  /** Public image URLs (backgrounds per scene). At least one recommended. */
  backgroundUrls: string[];
  headshotUrl?: string;
  /** Accent hex for highlights */
  accentColor?: string;
};

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&h=1920&fit=crop";

function scene(
  time: number,
  duration: number,
  bgUrl: string,
  text: string,
  subline?: string,
): Record<string, unknown> {
  return {
    type: "composition",
    track: 1,
    time,
    duration,
    elements: [
      {
        type: "image",
        track: 1,
        time: 0,
        duration,
        source: bgUrl,
        width: "100%",
        height: "100%",
        fit: "cover",
        animations: [
          {
            time: 0,
            duration: 0.6,
            transition: true,
            type: "fade",
          },
        ],
      },
      {
        type: "text",
        track: 2,
        time: 0.2,
        duration: duration - 0.2,
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
        text: subline ? `${text}\n${subline}` : text,
        background_color: "rgba(0,0,0,0.45)",
        background_x_padding: "4%",
        background_y_padding: "3%",
        background_border_radius: "2%",
        animations: [
          {
            time: 0,
            duration: 0.5,
            easing: "quadratic-out",
            type: "text-slide",
            scope: "split-clip",
            split: "line",
            direction: "up",
          },
        ],
      },
    ],
    animations: [
      {
        time: 0,
        duration: 0.5,
        transition: true,
        type: "fade",
      },
    ],
  };
}

export function buildWdusaReel(opts: WdusaReelOpts): Record<string, unknown> {
  const urls =
    opts.backgroundUrls.length > 0 ? opts.backgroundUrls : [DEFAULT_BG];
  const u0 = urls[0] ?? DEFAULT_BG;
  const u1 = urls[1] ?? u0;
  const u2 = urls[2] ?? u0;
  const phone = opts.phone ?? "(414) 312-5213";
  const accent = opts.accentColor ?? "#fbbf24";

  const elements: Record<string, unknown>[] = [
    scene(0, 4, u0, opts.hook, opts.subhead.slice(0, 120)),
    scene(4, 4, u1, opts.subhead.slice(0, 140), "Window Depot USA · Milwaukee"),
    scene(8, 3.5, u2, "4.9 Google · 1,000+ reviews · A+ BBB", "Serving SE Wisconsin"),
    {
      type: "composition",
      track: 1,
      time: 11.5,
      duration: 4.5,
      fill_color: "#0a0a0a",
      elements: [
        ...(opts.headshotUrl
          ? [
              {
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
              } as Record<string, unknown>,
            ]
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
          text: `${opts.cta}\n${phone}`,
          line_height: "140%",
          animations: [
            {
              time: 0,
              duration: 0.6,
              type: "fade",
            },
          ],
        },
      ],
      animations: [
        {
          time: 0,
          duration: 0.6,
          transition: true,
          type: "fade",
        },
      ],
    },
  ];

  return {
    output_format: "mp4",
    width: 1080,
    height: 1920,
    frame_rate: 30,
    duration: 16,
    elements,
  };
}
