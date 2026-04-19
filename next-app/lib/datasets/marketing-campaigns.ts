import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CHANNELS = [
  { name: "google_ads_search", label: "Google Ads — Search", cpmRange: [8, 45], ctr: [0.03, 0.08], cvr: [0.03, 0.08], aov: 140, w: 18 },
  { name: "google_ads_pmax", label: "Google Ads — Performance Max", cpmRange: [6, 30], ctr: [0.015, 0.05], cvr: [0.02, 0.06], aov: 130, w: 8 },
  { name: "meta_facebook", label: "Meta — Facebook", cpmRange: [6, 22], ctr: [0.008, 0.025], cvr: [0.008, 0.03], aov: 95, w: 15 },
  { name: "meta_instagram", label: "Meta — Instagram", cpmRange: [7, 25], ctr: [0.005, 0.02], cvr: [0.006, 0.025], aov: 105, w: 12 },
  { name: "tiktok_ads", label: "TikTok Ads", cpmRange: [4, 14], ctr: [0.008, 0.03], cvr: [0.005, 0.02], aov: 75, w: 9 },
  { name: "linkedin_ads", label: "LinkedIn Ads", cpmRange: [25, 140], ctr: [0.004, 0.015], cvr: [0.03, 0.08], aov: 620, w: 6 },
  { name: "youtube_ads", label: "YouTube Ads", cpmRange: [8, 28], ctr: [0.003, 0.01], cvr: [0.008, 0.025], aov: 110, w: 6 },
  { name: "x_ads", label: "X Ads (Twitter)", cpmRange: [5, 18], ctr: [0.004, 0.012], cvr: [0.005, 0.02], aov: 85, w: 3 },
  { name: "display_dsp", label: "Display / DSP", cpmRange: [1.5, 8], ctr: [0.001, 0.005], cvr: [0.002, 0.01], aov: 80, w: 5 },
  { name: "email", label: "Email Marketing", cpmRange: [0.5, 3], ctr: [0.015, 0.08], cvr: [0.01, 0.06], aov: 120, w: 8 },
  { name: "seo_content", label: "SEO / Content", cpmRange: [0, 2], ctr: [0.02, 0.08], cvr: [0.03, 0.1], aov: 135, w: 5 },
  { name: "affiliate", label: "Affiliate", cpmRange: [0, 0], ctr: [0, 0], cvr: [0.02, 0.07], aov: 110, w: 3 },
  { name: "podcast", label: "Podcast Sponsorship", cpmRange: [18, 55], ctr: [0.001, 0.008], cvr: [0.01, 0.04], aov: 180, w: 2 },
];

const OBJECTIVES = [
  { name: "awareness", w: 20 },
  { name: "consideration", w: 25 },
  { name: "conversion", w: 40 },
  { name: "retention", w: 10 },
  { name: "brand", w: 5 },
];

const AUDIENCES = [
  "Gen Z (18-24)", "Millennials (25-40)", "Gen X (41-56)", "Boomers (57+)",
  "SMB Owners", "Enterprise Decision Makers", "Parents with Kids", "College Students",
  "Urban Professionals", "DIY Enthusiasts", "Fitness Focused", "Tech Early Adopters",
];

export function generateMarketingCampaigns(count = 600) {
  const f = createFaker(6006);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const channel = f.helpers.weightedArrayElement(CHANNELS.map((c) => ({ weight: c.w, value: c })));
    const objective = f.helpers.weightedArrayElement(OBJECTIVES.map((o) => ({ weight: o.w, value: o.name })));

    const budget = Math.round(clamp(logNormal(f, 12000, 1.0), 500, 500_000));
    const spend = round(budget * f.number.float({ min: 0.55, max: 1.0, fractionDigits: 3 }), 2);

    const cpm = round(f.number.float({ min: channel.cpmRange[0], max: channel.cpmRange[1], fractionDigits: 2 }), 2);
    const impressions = cpm > 0 ? Math.round((spend / cpm) * 1000) : Math.round(spend * f.number.int({ min: 100, max: 1000 }));

    const ctr = round(f.number.float({ min: channel.ctr[0], max: channel.ctr[1], fractionDigits: 5 }), 5);
    const clicks = Math.round(impressions * ctr);
    const cpc = clicks > 0 ? round(spend / clicks, 3) : 0;

    const cvr = round(f.number.float({ min: channel.cvr[0], max: channel.cvr[1], fractionDigits: 5 }), 5);
    const conversions = Math.round(clicks * cvr);
    const cpa = conversions > 0 ? round(spend / conversions, 2) : 0;

    const revenue = round(conversions * f.number.float({ min: channel.aov * 0.7, max: channel.aov * 1.3, fractionDigits: 2 }), 2);
    const roas = spend > 0 ? round(revenue / spend, 2) : 0;

    const startDate = f.date.between({ from: "2024-01-01", to: "2025-10-01" });
    const endDate = new Date(startDate.getTime() + f.number.int({ min: 7, max: 180 }) * 24 * 60 * 60 * 1000);
    const status = endDate < new Date() ? "completed" : f.datatype.boolean(0.6) ? "active" : "paused";

    rows.push({
      campaign_id: `cmp_${f.string.alphanumeric({ length: 12, casing: "lower" })}`,
      campaign_name: `${channel.name.split("_")[0]!.toUpperCase()} — ${f.company.catchPhrase()}`,
      channel: channel.name,
      channel_label: channel.label,
      objective,
      target_audience: f.helpers.arrayElement(AUDIENCES),
      creative_type: f.helpers.arrayElement(["static_image", "video", "carousel", "story", "text_ad", "html5"]),
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      budget,
      spend,
      impressions,
      reach: Math.round(impressions * f.number.float({ min: 0.55, max: 0.9, fractionDigits: 2 })),
      clicks,
      ctr: round(ctr * 100, 3),
      cpc,
      cpm,
      conversions,
      cvr: round(cvr * 100, 3),
      cpa,
      revenue,
      roas,
      bounce_rate: round(f.number.float({ min: 0.25, max: 0.75, fractionDigits: 3 }), 3),
      avg_session_sec: f.number.int({ min: 30, max: 420 }),
      video_completion_rate: channel.name.includes("video") || channel.name === "youtube_ads" || channel.name === "tiktok_ads"
        ? round(f.number.float({ min: 0.2, max: 0.85, fractionDigits: 3 }), 3)
        : null,
      utm_source: channel.name.split("_")[0]!,
      utm_medium: channel.name.includes("email") ? "email" : channel.name.includes("seo") ? "organic" : "cpc",
      status,
      currency: "USD",
    });
  }
  return rows;
}
