import { createRng } from "./seed-random";

const PLATFORMS = ["Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Facebook", "Reddit", "Pinterest"];
const CONTENT_TYPES = ["Image", "Video", "Text", "Carousel", "Story", "Reel", "Live"];
const SENTIMENTS = ["Positive", "Neutral", "Negative"];
const SENTIMENT_WEIGHTS = [45, 35, 20];

export function generateSocialMedia(count = 800) {
  const rng = createRng(13013);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const impressions = rng.int(100, 100000);
    const likes = rng.int(0, Math.floor(impressions * 0.15));
    const shares = rng.int(0, Math.floor(likes * 0.3));
    const comments = rng.int(0, Math.floor(likes * 0.2));
    const engagementRate = Number(((likes + shares + comments) / impressions * 100).toFixed(2));

    rows.push({
      post_id: rng.id("POST", i + 1),
      platform: rng.pick(PLATFORMS),
      content_type: rng.pick(CONTENT_TYPES),
      likes,
      shares,
      comments,
      impressions,
      engagement_rate: engagementRate,
      posted_at: rng.datetime("2024-06-01", "2025-12-31"),
      sentiment: rng.pickWeighted(SENTIMENTS, SENTIMENT_WEIGHTS),
    });
  }
  return rows;
}
