import { createFaker, clamp, logNormal, round } from "./faker-utils";

const PLATFORMS = [
  { name: "Netflix", w: 22, tier: ["Basic", "Standard", "Premium"] },
  { name: "YouTube", w: 18, tier: ["Free", "Premium"] },
  { name: "Disney+", w: 10, tier: ["Standard", "Premium"] },
  { name: "HBO Max", w: 8, tier: ["With Ads", "Ad-Free", "Ultimate"] },
  { name: "Prime Video", w: 12, tier: ["Prime", "Ad-Free"] },
  { name: "Hulu", w: 8, tier: ["With Ads", "No Ads", "Live TV"] },
  { name: "Apple TV+", w: 5, tier: ["Standard"] },
  { name: "Paramount+", w: 5, tier: ["Essential", "With Showtime"] },
  { name: "Peacock", w: 4, tier: ["Free", "Premium", "Premium Plus"] },
  { name: "Twitch", w: 8, tier: ["Free", "Turbo"] },
];

const GENRES = [
  { name: "Drama", avgDurationMin: 55, w: 18 },
  { name: "Comedy", avgDurationMin: 28, w: 14 },
  { name: "Action", avgDurationMin: 115, w: 10 },
  { name: "Documentary", avgDurationMin: 85, w: 8 },
  { name: "Animation", avgDurationMin: 24, w: 8 },
  { name: "Thriller", avgDurationMin: 108, w: 8 },
  { name: "Reality", avgDurationMin: 45, w: 7 },
  { name: "Sports (Live)", avgDurationMin: 150, w: 6 },
  { name: "News", avgDurationMin: 30, w: 6 },
  { name: "Gaming (Live)", avgDurationMin: 180, w: 5 },
  { name: "Kids", avgDurationMin: 22, w: 6 },
  { name: "Music", avgDurationMin: 4, w: 4 },
];

const DEVICES = [
  { type: "Smart TV", w: 30, osOptions: ["Tizen", "webOS", "Android TV", "Roku OS", "Fire OS"] },
  { type: "Mobile", w: 25, osOptions: ["iOS", "Android"] },
  { type: "Laptop", w: 15, osOptions: ["macOS", "Windows", "ChromeOS"] },
  { type: "Tablet", w: 10, osOptions: ["iPadOS", "Android"] },
  { type: "Console", w: 8, osOptions: ["PlayStation", "Xbox", "Nintendo"] },
  { type: "Streaming Stick", w: 10, osOptions: ["Roku", "Fire TV", "Chromecast", "Apple TV"] },
  { type: "Desktop", w: 2, osOptions: ["macOS", "Windows", "Linux"] },
];

// Bitrate ladder — typical HLS/DASH rendition ladder for adaptive streaming
const RESOLUTIONS = [
  { res: "240p", bitrateKbps: 400, w: 4 },
  { res: "360p", bitrateKbps: 800, w: 8 },
  { res: "480p", bitrateKbps: 1500, w: 15 },
  { res: "720p", bitrateKbps: 2800, w: 28 },
  { res: "1080p", bitrateKbps: 5000, w: 30 },
  { res: "1440p", bitrateKbps: 9000, w: 7 },
  { res: "4K", bitrateKbps: 15000, w: 7 },
  { res: "8K", bitrateKbps: 45000, w: 1 },
];

const CDNS = ["Akamai", "Cloudflare", "Fastly", "AWS CloudFront", "Netflix Open Connect", "Google Edge", "Limelight"];
const CODECS = [
  { name: "H.264", w: 40 },
  { name: "H.265/HEVC", w: 28 },
  { name: "AV1", w: 18 },
  { name: "VP9", w: 12 },
  { name: "H.266/VVC", w: 2 },
];

export function generateVideoStreaming(count = 1500) {
  const f = createFaker(31031);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const platform = f.helpers.weightedArrayElement(PLATFORMS.map((p) => ({ weight: p.w, value: p })));
    const genre = f.helpers.weightedArrayElement(GENRES.map((g) => ({ weight: g.w, value: g })));
    const device = f.helpers.weightedArrayElement(DEVICES.map((d) => ({ weight: d.w, value: d })));
    const resolution = f.helpers.weightedArrayElement(RESOLUTIONS.map((r) => ({ weight: r.w, value: r })));
    const codec = f.helpers.weightedArrayElement(CODECS.map((c) => ({ weight: c.w, value: c.name })));
    const tier = f.helpers.arrayElement(platform.tier);

    // Content length varies around genre average with log-normal shape
    const contentLengthSec = Math.round(clamp(logNormal(f, genre.avgDurationMin * 60, 0.35), 30, 4 * 3600));
    // Completion typically ~50–70% avg, but skewed — most sessions drop off early
    const completionPct = round(clamp(logNormal(f, 0.55, 0.45), 0.01, 1.0), 3);
    const watchTimeSec = Math.round(contentLengthSec * completionPct);

    // Startup time (Time To First Frame) — CDN + device + network factor; target <2s
    const startupLatencyMs = Math.round(clamp(logNormal(f, 1200, 0.6), 200, 15000));
    // Rebuffer ratio: stall_time / play_time, industry benchmark <1%
    const rebufferRatio = round(clamp(logNormal(f, 0.006, 1.2), 0, 0.15), 5);
    const bufferingEvents = Math.round(rebufferRatio * watchTimeSec / 30); // roughly one stall per 30s of stall time

    const isAdSupported = tier.toLowerCase().includes("free") || tier.toLowerCase().includes("ads") || platform.name === "YouTube" || platform.name === "Twitch";
    const adPodCount = isAdSupported ? Math.round(contentLengthSec / 900) + f.number.int({ min: 0, max: 2 }) : 0;
    const adRevenue = isAdSupported ? round(adPodCount * f.number.float({ min: 0.02, max: 0.35, fractionDigits: 4 }), 4) : 0;

    const sessionStart = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    const sessionEnd = new Date(sessionStart.getTime() + watchTimeSec * 1000);

    rows.push({
      session_id: `ses_${f.string.alphanumeric({ length: 16, casing: "lower" })}`,
      user_id: `usr_${f.string.alphanumeric({ length: 12, casing: "lower" })}`,
      content_id: `cnt_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      content_title: f.lorem.words({ min: 2, max: 6 }),
      platform: platform.name,
      subscription_tier: tier,
      genre: genre.name,
      is_live: genre.name.includes("Live") || genre.name === "News",
      content_length_sec: contentLengthSec,
      watch_time_sec: watchTimeSec,
      completion_pct: round(completionPct * 100, 2),
      device_type: device.type,
      device_os: f.helpers.arrayElement(device.osOptions),
      device_model: device.type === "Mobile" || device.type === "Tablet" ? `${f.helpers.arrayElement(["iPhone", "Samsung Galaxy", "Google Pixel", "iPad"])} ${f.number.int({ min: 10, max: 17 })}` : null,
      resolution: resolution.res,
      bitrate_kbps: resolution.bitrateKbps,
      codec,
      hdr_enabled: ["1080p", "1440p", "4K", "8K"].includes(resolution.res) && f.datatype.boolean(0.25),
      audio_channels: f.helpers.weightedArrayElement([
        { weight: 45, value: "Stereo" },
        { weight: 30, value: "5.1" },
        { weight: 15, value: "Dolby Atmos" },
        { weight: 10, value: "7.1" },
      ]),
      cdn_provider: f.helpers.arrayElement(CDNS),
      startup_latency_ms: startupLatencyMs,
      rebuffer_ratio: rebufferRatio,
      buffering_events: bufferingEvents,
      bandwidth_mbps: round(resolution.bitrateKbps / 1024 * f.number.float({ min: 1.1, max: 2.5, fractionDigits: 2 }), 2),
      country: f.location.countryCode(),
      city: f.location.city(),
      isp: f.helpers.arrayElement(["Comcast Xfinity", "AT&T", "Verizon FiOS", "Charter Spectrum", "CenturyLink", "Cox", "T-Mobile Home", "Starlink"]),
      connection_type: f.helpers.weightedArrayElement([
        { weight: 50, value: "WiFi" },
        { weight: 30, value: "Ethernet" },
        { weight: 18, value: "Cellular" },
        { weight: 2, value: "Satellite" },
      ]),
      ad_pods_served: adPodCount,
      ad_revenue_usd: adRevenue,
      session_start: sessionStart.toISOString(),
      session_end: sessionEnd.toISOString(),
      error_code: f.datatype.boolean(0.02) ? f.helpers.arrayElement(["NETWORK_TIMEOUT", "DECODER_ERROR", "DRM_FAILURE", "MANIFEST_404", "CDN_5XX"]) : null,
      exit_reason: f.helpers.weightedArrayElement([
        { weight: 45, value: "completed" },
        { weight: 25, value: "user_stopped" },
        { weight: 12, value: "seeked_away" },
        { weight: 8, value: "paused_timeout" },
        { weight: 5, value: "error" },
        { weight: 5, value: "background" },
      ]),
    });
  }
  return rows;
}
