import { createFaker, clamp, logNormal, round } from "./faker-utils";

// SSP / ad exchanges — real programmatic marketplaces
const EXCHANGES = [
  { name: "Google Ad Manager", w: 25, floorCpmMin: 0.8, floorCpmMax: 12 },
  { name: "The Trade Desk", w: 15, floorCpmMin: 1.5, floorCpmMax: 18 },
  { name: "OpenX", w: 10, floorCpmMin: 0.3, floorCpmMax: 6 },
  { name: "PubMatic", w: 10, floorCpmMin: 0.4, floorCpmMax: 8 },
  { name: "Magnite", w: 8, floorCpmMin: 0.5, floorCpmMax: 10 },
  { name: "Amazon Publisher Services", w: 12, floorCpmMin: 1.0, floorCpmMax: 15 },
  { name: "Xandr (Microsoft)", w: 8, floorCpmMin: 0.6, floorCpmMax: 9 },
  { name: "Index Exchange", w: 7, floorCpmMin: 0.4, floorCpmMax: 7 },
  { name: "Criteo", w: 5, floorCpmMin: 0.5, floorCpmMax: 8 },
];

// IAB standard ad unit sizes
const DISPLAY_FORMATS = [
  { w: 300, h: 250, name: "Medium Rectangle", share: 25 },
  { w: 728, h: 90, name: "Leaderboard", share: 18 },
  { w: 320, h: 50, name: "Mobile Banner", share: 20 },
  { w: 300, h: 600, name: "Half Page", share: 8 },
  { w: 970, h: 250, name: "Billboard", share: 6 },
  { w: 160, h: 600, name: "Wide Skyscraper", share: 4 },
  { w: 320, h: 480, name: "Mobile Interstitial", share: 10 },
  { w: 300, h: 50, name: "Mobile Banner (Small)", share: 5 },
  { w: 970, h: 90, name: "Large Leaderboard", share: 4 },
];

const VIDEO_FORMATS = [
  { name: "Pre-Roll", w: 40 },
  { name: "Mid-Roll", w: 30 },
  { name: "Post-Roll", w: 10 },
  { name: "Outstream", w: 15 },
  { name: "Connected TV", w: 5 },
];

const IAB_CATEGORIES = [
  "IAB1 Arts & Entertainment", "IAB2 Automotive", "IAB3 Business",
  "IAB7 Health & Fitness", "IAB8 Food & Drink", "IAB9 Hobbies & Interests",
  "IAB13 Personal Finance", "IAB17 Sports", "IAB19 Technology & Computing",
  "IAB20 Travel", "IAB22 Shopping", "IAB23 Religion & Spirituality",
];

const DEVICE_TYPES = [
  { type: "mobile", os: ["iOS", "Android"], w: 55 },
  { type: "desktop", os: ["Windows", "macOS", "Linux"], w: 25 },
  { type: "tablet", os: ["iPadOS", "Android"], w: 8 },
  { type: "ctv", os: ["tvOS", "Android TV", "Roku OS", "Tizen", "webOS"], w: 10 },
  { type: "other", os: ["Unknown"], w: 2 },
];

const BROWSERS_DESKTOP = [
  { name: "Chrome", w: 65 },
  { name: "Safari", w: 18 },
  { name: "Edge", w: 8 },
  { name: "Firefox", w: 7 },
  { name: "Opera", w: 2 },
];

export function generateAdImpressions(count = 3000) {
  const f = createFaker(24024);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const exchange = f.helpers.weightedArrayElement(EXCHANGES.map((e) => ({ weight: e.w, value: e })));
    const device = f.helpers.weightedArrayElement(DEVICE_TYPES.map((d) => ({ weight: d.w, value: d })));
    const os = f.helpers.arrayElement(device.os);
    const mediaType = f.helpers.weightedArrayElement([
      { weight: 60, value: "banner" },
      { weight: 30, value: "video" },
      { weight: 8, value: "native" },
      { weight: 2, value: "audio" },
    ]);

    const size = mediaType === "banner"
      ? f.helpers.weightedArrayElement(DISPLAY_FORMATS.map((s) => ({ weight: s.share, value: s })))
      : null;
    const videoFormat = mediaType === "video" ? f.helpers.weightedArrayElement(VIDEO_FORMATS.map((v) => ({ weight: v.w, value: v.name }))) : null;

    const floorCpm = round(f.number.float({ min: exchange.floorCpmMin, max: exchange.floorCpmMax, fractionDigits: 2 }), 2);
    // Second-price auction — typical bid shading means clearing price is 10–30% above floor
    const bidCount = f.number.int({ min: 1, max: 12 });
    const winningBidCpm = round(floorCpm * f.number.float({ min: 1.0, max: 2.5, fractionDigits: 3 }), 3);
    const clearingPriceCpm = round(Math.min(winningBidCpm, floorCpm + (winningBidCpm - floorCpm) * f.number.float({ min: 0.1, max: 0.9, fractionDigits: 3 })), 3);
    const revenueUsd = round(clearingPriceCpm / 1000, 5);

    // MRC viewability: ≥50% of pixels in view for ≥1s (display) or 2s (video)
    const viewable = f.datatype.boolean(0.72);
    const inViewPct = viewable ? round(f.number.float({ min: 0.5, max: 1.0, fractionDigits: 3 }), 3) : round(f.number.float({ min: 0, max: 0.5, fractionDigits: 3 }), 3);
    const inViewTimeMs = viewable ? f.number.int({ min: 1000, max: 30000 }) : f.number.int({ min: 0, max: 1000 });

    // CTR is tiny — typically 0.05% display, 0.35% video
    const ctrProb = mediaType === "video" ? 0.004 : mediaType === "native" ? 0.002 : 0.0007;
    const clicked = viewable && f.datatype.boolean(ctrProb);
    const videoCompletionRate = mediaType === "video" ? round(clamp(logNormal(f, 0.6, 0.5), 0, 1), 3) : null;

    const reqTs = f.date.between({ from: "2025-10-01", to: "2025-12-31" });

    rows.push({
      impression_id: `imp_${f.string.alphanumeric({ length: 18, casing: "lower" })}`,
      auction_id: `auc_${f.string.alphanumeric({ length: 16, casing: "lower" })}`,
      request_ts: reqTs.toISOString(),
      exchange: exchange.name,
      advertiser_id: `adv_${f.string.alphanumeric({ length: 8, casing: "lower" })}`,
      advertiser_name: f.company.name(),
      campaign_id: `cmp_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      creative_id: `cr_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      placement_id: `plc_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      publisher_domain: f.internet.domainName(),
      site_category: f.helpers.arrayElement(IAB_CATEGORIES),
      media_type: mediaType,
      ad_size: size ? `${size.w}x${size.h}` : null,
      ad_format: mediaType === "video" ? videoFormat : size?.name ?? null,
      device_type: device.type,
      os,
      os_version: `${f.number.int({ min: 11, max: 18 })}.${f.number.int({ min: 0, max: 6 })}`,
      browser: device.type === "mobile" ? (os === "iOS" ? "Safari" : "Chrome Mobile") : device.type === "ctv" ? "Native App" : f.helpers.weightedArrayElement(BROWSERS_DESKTOP.map((b) => ({ weight: b.w, value: b.name }))),
      user_agent_family: device.type === "ctv" ? "OTT" : device.type,
      country: f.location.countryCode(),
      region: f.location.state({ abbreviated: true }),
      city: f.location.city(),
      ip_address: f.internet.ipv4(),
      language: f.helpers.arrayElement(["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "ja-JP", "zh-CN", "pt-BR"]),
      bid_count: bidCount,
      bid_floor_cpm: floorCpm,
      winning_bid_cpm: winningBidCpm,
      clearing_price_cpm: clearingPriceCpm,
      revenue_usd: revenueUsd,
      currency: "USD",
      auction_type: f.helpers.weightedArrayElement([
        { weight: 70, value: "second_price" },
        { weight: 30, value: "first_price" },
      ]),
      deal_id: f.datatype.boolean(0.15) ? `PMP-${f.string.alphanumeric({ length: 8, casing: "upper" })}` : null,
      is_private_marketplace: f.datatype.boolean(0.15),
      viewable,
      in_view_pct: inViewPct,
      in_view_time_ms: inViewTimeMs,
      clicked,
      click_ts: clicked ? new Date(reqTs.getTime() + f.number.int({ min: 100, max: 20000 })).toISOString() : null,
      video_completion_rate: videoCompletionRate,
      is_fraud_suspected: f.datatype.boolean(0.018),
      gdpr_consent: f.datatype.boolean(0.92),
      ccpa_opt_out: f.datatype.boolean(0.06),
    });
  }
  return rows;
}
