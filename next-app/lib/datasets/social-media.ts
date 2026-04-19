import { createFaker, clamp, logNormal, round } from "./faker-utils";

const PLATFORMS = [
  { name: "Instagram", w: 22, formats: ["Image", "Carousel", "Reel", "Story"], baseReach: 2500 },
  { name: "TikTok", w: 20, formats: ["Video"], baseReach: 8000 },
  { name: "YouTube", w: 14, formats: ["Video", "Short", "Live"], baseReach: 5000 },
  { name: "Facebook", w: 12, formats: ["Image", "Video", "Text", "Carousel"], baseReach: 1200 },
  { name: "LinkedIn", w: 10, formats: ["Text", "Image", "Video", "Article"], baseReach: 900 },
  { name: "X (Twitter)", w: 10, formats: ["Text", "Image", "Video"], baseReach: 1800 },
  { name: "Pinterest", w: 6, formats: ["Image", "Idea Pin"], baseReach: 2200 },
  { name: "Reddit", w: 4, formats: ["Text", "Link", "Image"], baseReach: 3500 },
  { name: "Threads", w: 2, formats: ["Text", "Image"], baseReach: 600 },
];

const CONTENT_TOPICS = [
  "Product Launch", "Tutorial / How-To", "Behind the Scenes", "User-Generated Content",
  "Testimonial", "Meme / Trend", "Announcement", "Q&A", "Live Stream", "Contest / Giveaway",
  "Brand Story", "Data / Insights", "Industry News", "Employee Spotlight",
];

export function generateSocialMedia(count = 800) {
  const f = createFaker(13013);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const platform = f.helpers.weightedArrayElement(PLATFORMS.map((p) => ({ weight: p.w, value: p })));
    const format = f.helpers.arrayElement(platform.formats);

    // Power-law reach: ~80% of posts get 10-20% of average, ~5% go viral
    const isViral = f.datatype.boolean(0.05);
    const reach = isViral
      ? Math.round(platform.baseReach * f.number.float({ min: 50, max: 500, fractionDigits: 0 }))
      : Math.round(clamp(logNormal(f, platform.baseReach, 1.4), 30, platform.baseReach * 20));
    const impressions = Math.round(reach * f.number.float({ min: 1.2, max: 2.8, fractionDigits: 2 }));

    // Like rate varies by platform: TikTok ~6-10%, IG ~2-4%, X ~0.5-1.5%
    const likeRate = platform.name === "TikTok"
      ? f.number.float({ min: 0.05, max: 0.12, fractionDigits: 4 })
      : platform.name === "Instagram"
        ? f.number.float({ min: 0.015, max: 0.05, fractionDigits: 4 })
        : platform.name === "YouTube"
          ? f.number.float({ min: 0.02, max: 0.06, fractionDigits: 4 })
          : f.number.float({ min: 0.005, max: 0.025, fractionDigits: 4 });
    const likes = Math.round(reach * likeRate);
    const comments = Math.round(likes * f.number.float({ min: 0.01, max: 0.08, fractionDigits: 3 }));
    const shares = Math.round(likes * f.number.float({ min: 0.02, max: 0.15, fractionDigits: 3 }));
    const saves = ["Instagram", "Pinterest", "TikTok"].includes(platform.name)
      ? Math.round(likes * f.number.float({ min: 0.05, max: 0.25, fractionDigits: 3 }))
      : 0;

    const engagements = likes + comments + shares + saves;
    const engagementRate = round((engagements / Math.max(reach, 1)) * 100, 3);

    const videoLenSec = ["Video", "Reel", "Short", "Live"].includes(format)
      ? f.helpers.weightedArrayElement([
          { weight: 35, value: f.number.int({ min: 6, max: 30 }) },
          { weight: 30, value: f.number.int({ min: 31, max: 60 }) },
          { weight: 20, value: f.number.int({ min: 61, max: 180 }) },
          { weight: 15, value: f.number.int({ min: 181, max: 900 }) },
        ])
      : null;
    const avgWatchPct = videoLenSec ? round(f.number.float({ min: 0.2, max: 0.85, fractionDigits: 3 }), 3) : null;

    const postedAt = f.date.between({ from: "2024-06-01", to: "2025-12-31" });
    const sentimentScore = round(f.number.float({ min: -1, max: 1, fractionDigits: 3 }), 3);

    rows.push({
      post_id: `${platform.name.toLowerCase().replace(/[^a-z]/g, "")}_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      account_handle: `@${f.internet.username().toLowerCase()}`,
      platform: platform.name,
      post_type: format,
      content_topic: f.helpers.arrayElement(CONTENT_TOPICS),
      posted_at: postedAt.toISOString(),
      caption_length: f.number.int({ min: 0, max: platform.name === "X (Twitter)" ? 280 : 2200 }),
      hashtag_count: f.number.int({ min: 0, max: platform.name === "Instagram" ? 30 : 8 }),
      mention_count: f.number.int({ min: 0, max: 6 }),
      media_count: format === "Carousel" ? f.number.int({ min: 2, max: 10 }) : format === "Image" ? 1 : 0,
      video_length_sec: videoLenSec,
      avg_watch_pct: avgWatchPct,
      reach,
      impressions,
      likes,
      comments,
      shares,
      saves,
      engagement_rate_pct: engagementRate,
      click_throughs: Math.round(impressions * f.number.float({ min: 0.001, max: 0.015, fractionDigits: 4 })),
      profile_visits: Math.round(reach * f.number.float({ min: 0.005, max: 0.04, fractionDigits: 4 })),
      follows_gained: Math.round(reach * f.number.float({ min: 0, max: 0.01, fractionDigits: 5 })),
      sentiment_score: sentimentScore,
      sentiment_label: sentimentScore > 0.15 ? "positive" : sentimentScore < -0.15 ? "negative" : "neutral",
      top_audience_country: f.location.countryCode(),
      is_sponsored: f.datatype.boolean(0.08),
      is_viral: isViral,
    });
  }
  return rows;
}
