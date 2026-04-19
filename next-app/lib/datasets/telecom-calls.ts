import { createFaker, clamp, logNormal, round } from "./faker-utils";

const CARRIERS = [
  { mcc: "310", mnc: "410", name: "AT&T Mobility", country: "US", w: 18 },
  { mcc: "310", mnc: "260", name: "T-Mobile USA", country: "US", w: 20 },
  { mcc: "311", mnc: "480", name: "Verizon Wireless", country: "US", w: 22 },
  { mcc: "302", mnc: "610", name: "Bell Mobility", country: "CA", w: 5 },
  { mcc: "302", mnc: "720", name: "Rogers Wireless", country: "CA", w: 5 },
  { mcc: "234", mnc: "10", name: "O2 UK", country: "GB", w: 6 },
  { mcc: "234", mnc: "15", name: "Vodafone UK", country: "GB", w: 6 },
  { mcc: "208", mnc: "1", name: "Orange France", country: "FR", w: 5 },
  { mcc: "262", mnc: "1", name: "Deutsche Telekom", country: "DE", w: 5 },
  { mcc: "440", mnc: "10", name: "NTT DoCoMo", country: "JP", w: 8 },
];

const CALL_TYPES = [
  { type: "voice", w: 45 },
  { type: "sms", w: 30 },
  { type: "mms", w: 4 },
  { type: "data", w: 20 },
  { type: "voice_volte", w: 1 },
];

function msisdn(f: ReturnType<typeof createFaker>, country: string): string {
  const prefix = country === "US" || country === "CA" ? "+1" : country === "GB" ? "+44" : country === "FR" ? "+33" : country === "DE" ? "+49" : "+81";
  return `${prefix}${f.string.numeric({ length: country === "US" ? 10 : 9, allowLeadingZeros: false })}`;
}

export function generateTelecomCalls(count = 2200) {
  const f = createFaker(28028);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const homeCarrier = f.helpers.weightedArrayElement(CARRIERS.map((c) => ({ weight: c.w, value: c })));
    const callType = f.helpers.weightedArrayElement(CALL_TYPES.map((c) => ({ weight: c.w, value: c.type })));
    const direction = f.helpers.weightedArrayElement([
      { weight: 48, value: "MO" }, // Mobile Originated
      { weight: 48, value: "MT" }, // Mobile Terminated
      { weight: 4, value: "FWD" }, // Forwarded
    ]);
    const isRoaming = f.datatype.boolean(0.08);
    const servingCarrier = isRoaming ? f.helpers.arrayElement(CARRIERS) : homeCarrier;

    const network = f.helpers.weightedArrayElement([
      { weight: 55, value: "5G-NR" },
      { weight: 30, value: "LTE" },
      { weight: 10, value: "LTE-A" },
      { weight: 4, value: "UMTS" },
      { weight: 1, value: "GSM" },
    ]);

    let durationSec = 0;
    let bytesUp = 0;
    let bytesDown = 0;
    let smsCount = 0;
    let charge = 0;

    if (callType === "voice" || callType === "voice_volte") {
      durationSec = Math.round(clamp(logNormal(f, 180, 1.2), 3, 7200));
      const rate = isRoaming ? 0.25 : callType === "voice_volte" ? 0.015 : 0.02;
      charge = round((durationSec / 60) * rate, 4);
    } else if (callType === "sms") {
      smsCount = 1;
      charge = isRoaming ? 0.35 : 0.02;
    } else if (callType === "mms") {
      smsCount = 1;
      bytesUp = f.number.int({ min: 20_000, max: 300_000 });
      charge = isRoaming ? 0.5 : 0.1;
    } else {
      // data session — log-normal MB
      const mb = round(clamp(logNormal(f, 45, 1.4), 0.5, 5000), 2);
      bytesDown = Math.round(mb * 1024 * 1024 * 0.85);
      bytesUp = Math.round(mb * 1024 * 1024 * 0.15);
      durationSec = f.number.int({ min: 10, max: 3600 });
      charge = round(isRoaming ? mb * 0.008 : 0, 4);
    }

    const startedAt = f.date.between({ from: "2025-06-01", to: "2025-12-31" });
    const signalDbm = network.startsWith("5G") ? f.number.int({ min: -95, max: -55 }) : f.number.int({ min: -110, max: -60 });
    const dropped = callType === "voice" && f.datatype.boolean(0.025);

    rows.push({
      cdr_id: `CDR-${f.number.int({ min: 1, max: 9999999999 }).toString().padStart(10, "0")}`,
      subscriber_msisdn: msisdn(f, homeCarrier.country),
      peer_msisdn: callType === "voice" || callType === "sms" || callType === "mms" ? msisdn(f, f.helpers.arrayElement(CARRIERS).country) : null,
      imsi: `${homeCarrier.mcc}${homeCarrier.mnc}${f.string.numeric({ length: 10, allowLeadingZeros: true })}`,
      imei: f.string.numeric({ length: 15, allowLeadingZeros: false }),
      home_mccmnc: `${homeCarrier.mcc}${homeCarrier.mnc}`,
      serving_mccmnc: `${servingCarrier.mcc}${servingCarrier.mnc}`,
      home_carrier: homeCarrier.name,
      serving_carrier: servingCarrier.name,
      call_type: callType,
      direction,
      started_at: startedAt.toISOString(),
      duration_seconds: durationSec,
      network_type: network,
      rat: network.startsWith("5G") ? "NR" : network === "UMTS" ? "UTRAN" : network === "GSM" ? "GERAN" : "EUTRAN",
      roaming: isRoaming,
      roaming_country: isRoaming ? servingCarrier.country : null,
      signal_dbm: signalDbm,
      cell_id: f.number.int({ min: 1, max: 999999 }),
      lac_tac: f.number.int({ min: 1, max: 65535 }),
      bytes_up: bytesUp,
      bytes_down: bytesDown,
      sms_count: smsCount,
      charge_usd: charge,
      currency: "USD",
      dropped,
      disposition: dropped ? "dropped" : callType === "voice" ? f.helpers.weightedArrayElement([
        { weight: 85, value: "answered" },
        { weight: 10, value: "voicemail" },
        { weight: 3, value: "busy" },
        { weight: 2, value: "no_answer" },
      ]) : "completed",
    });
  }
  return rows;
}
