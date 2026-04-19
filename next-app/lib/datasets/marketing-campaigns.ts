import { createRng } from "./seed-random";

const CHANNELS = ["Google Ads", "Facebook", "Instagram", "LinkedIn", "TikTok", "Email", "YouTube", "Twitter/X", "SEO", "Podcast"];
const AUDIENCES = ["Gen Z", "Millennials", "Gen X", "Baby Boomers", "Small Business", "Enterprise", "Students", "Parents"];

export function generateMarketingCampaigns(count = 600) {
  const rng = createRng(6006);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const budget = rng.int(1000, 50000);
    const spend = rng.float(budget * 0.5, budget);
    const impressions = rng.int(5000, 500000);
    const clicks = rng.int(Math.floor(impressions * 0.005), Math.floor(impressions * 0.08));
    const conversions = rng.int(Math.floor(clicks * 0.01), Math.floor(clicks * 0.15));
    const ctr = Number((clicks / impressions * 100).toFixed(2));
    const revenue = conversions * rng.float(20, 200);
    const roas = Number((revenue / spend).toFixed(2));

    rows.push({
      campaign_id: rng.id("CMP", i + 1),
      channel: rng.pick(CHANNELS),
      target_audience: rng.pick(AUDIENCES),
      budget,
      spend: Number(spend.toFixed(2)),
      impressions,
      clicks,
      conversions,
      ctr,
      roas,
      start_date: rng.date("2024-01-01", "2025-10-01"),
      end_date: rng.date("2025-02-01", "2025-12-31"),
    });
  }
  return rows;
}
