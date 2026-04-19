import { createFaker, clamp, logNormal, round } from "./faker-utils";

const SERVICES = [
  { name: "UberX", brand: "Uber", baseFare: 2.55, perMi: 1.6, perMin: 0.35, w: 32 },
  { name: "Uber Comfort", brand: "Uber", baseFare: 3.05, perMi: 1.9, perMin: 0.4, w: 10 },
  { name: "Uber Black", brand: "Uber", baseFare: 7.0, perMi: 3.75, perMin: 0.5, w: 4 },
  { name: "UberXL", brand: "Uber", baseFare: 3.85, perMi: 2.85, perMin: 0.4, w: 6 },
  { name: "UberPool / Share", brand: "Uber", baseFare: 1.5, perMi: 1.1, perMin: 0.2, w: 6 },
  { name: "Lyft Standard", brand: "Lyft", baseFare: 2.2, perMi: 1.5, perMin: 0.32, w: 22 },
  { name: "Lyft XL", brand: "Lyft", baseFare: 3.75, perMi: 2.7, perMin: 0.4, w: 6 },
  { name: "Lyft Lux", brand: "Lyft", baseFare: 6.5, perMi: 3.5, perMin: 0.48, w: 3 },
  { name: "Lyft Shared", brand: "Lyft", baseFare: 1.5, perMi: 1.05, perMin: 0.22, w: 4 },
  { name: "Uber Green", brand: "Uber", baseFare: 2.75, perMi: 1.65, perMin: 0.36, w: 7 },
];

const CITIES = [
  { city: "New York", tier: "1", surgeFreq: 0.35 },
  { city: "San Francisco", tier: "1", surgeFreq: 0.38 },
  { city: "Los Angeles", tier: "1", surgeFreq: 0.25 },
  { city: "Chicago", tier: "1", surgeFreq: 0.22 },
  { city: "Boston", tier: "2", surgeFreq: 0.2 },
  { city: "Austin", tier: "2", surgeFreq: 0.18 },
  { city: "Seattle", tier: "2", surgeFreq: 0.2 },
  { city: "Denver", tier: "2", surgeFreq: 0.17 },
  { city: "Miami", tier: "2", surgeFreq: 0.22 },
  { city: "Atlanta", tier: "2", surgeFreq: 0.18 },
  { city: "Phoenix", tier: "3", surgeFreq: 0.12 },
  { city: "Nashville", tier: "3", surgeFreq: 0.1 },
];

export function generateRideSharing(count = 2500) {
  const f = createFaker(24024);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const svc = f.helpers.weightedArrayElement(SERVICES.map((s) => ({ weight: s.w, value: s })));
    const city = f.helpers.arrayElement(CITIES);

    const pickupTs = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    const hour = f.helpers.weightedArrayElement([
      { weight: 5, value: f.number.int({ min: 0, max: 5 }) },
      { weight: 15, value: f.number.int({ min: 6, max: 9 }) },
      { weight: 25, value: f.number.int({ min: 10, max: 15 }) },
      { weight: 25, value: f.number.int({ min: 16, max: 19 }) },
      { weight: 20, value: f.number.int({ min: 20, max: 22 }) },
      { weight: 10, value: 23 },
    ]);
    pickupTs.setHours(hour);
    const isNight = hour >= 22 || hour < 5;

    const distanceKm = round(clamp(logNormal(f, 6.5, 0.85), 0.4, 80), 2);
    const durationMin = Math.round(distanceKm * f.number.float({ min: 2.5, max: 4.5, fractionDigits: 1 }));
    const dropoffTs = new Date(pickupTs.getTime() + durationMin * 60 * 1000);

    // Surge multiplier — heavier tail during rush / night
    const baseSurge = isNight || [8, 9, 17, 18].includes(hour) ? 1.2 : 1.0;
    const surge = f.datatype.boolean(city.surgeFreq)
      ? round(baseSurge + f.number.float({ min: 0.1, max: 2.5, fractionDigits: 1 }), 1)
      : 1.0;

    const distanceMi = distanceKm * 0.621;
    const baseSubtotal = svc.baseFare + distanceMi * svc.perMi + durationMin * svc.perMin;
    const subtotal = round(baseSubtotal * surge, 2);
    const serviceFee = round(f.number.float({ min: 1.55, max: 3.5, fractionDigits: 2 }), 2);
    const tolls = f.datatype.boolean(0.15) ? round(f.number.float({ min: 1, max: 15, fractionDigits: 2 }), 2) : 0;
    const fare = round(subtotal + serviceFee + tolls, 2);
    const tip = f.datatype.boolean(0.55) ? round(fare * f.number.float({ min: 0.1, max: 0.25, fractionDigits: 2 }), 2) : 0;
    const total = round(fare + tip, 2);

    const status = f.helpers.weightedArrayElement([
      { weight: 90, value: "completed" },
      { weight: 4, value: "cancelled_by_rider" },
      { weight: 3, value: "cancelled_by_driver" },
      { weight: 2, value: "no_driver_available" },
      { weight: 1, value: "no_show" },
    ]);

    rows.push({
      trip_id: `trip_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      rider_id: `rid_${f.number.int({ min: 1, max: 200000 }).toString().padStart(8, "0")}`,
      driver_id: `drv_${f.number.int({ min: 1, max: 25000 }).toString().padStart(6, "0")}`,
      service_name: svc.name,
      brand: svc.brand,
      city: city.city,
      city_tier: city.tier,
      pickup_ts: pickupTs.toISOString(),
      dropoff_ts: status === "completed" ? dropoffTs.toISOString() : null,
      hour_of_day: hour,
      duration_min: status === "completed" ? durationMin : null,
      distance_km: status === "completed" ? distanceKm : null,
      distance_mi: status === "completed" ? round(distanceMi, 2) : null,
      base_fare: svc.baseFare,
      subtotal: status === "completed" ? subtotal : 0,
      surge_multiplier: surge,
      service_fee: serviceFee,
      tolls,
      tip,
      total_fare: status === "completed" ? total : 0,
      payment_method: f.helpers.weightedArrayElement([
        { weight: 65, value: "credit_card" },
        { weight: 15, value: "apple_pay" },
        { weight: 10, value: "google_pay" },
        { weight: 5, value: "paypal" },
        { weight: 3, value: "corporate" },
        { weight: 2, value: "cash" },
      ]),
      driver_rating: status === "completed" ? round(clamp(f.number.float({ min: 4.2, max: 5, fractionDigits: 2 }), 1, 5), 2) : null,
      rider_rating: status === "completed" ? round(clamp(f.number.float({ min: 4.0, max: 5, fractionDigits: 2 }), 1, 5), 2) : null,
      status,
      cancellation_reason: status.startsWith("cancelled")
        ? f.helpers.arrayElement(["rider_changed_plans", "driver_not_moving", "wrong_address", "long_wait", "rider_no_show"])
        : null,
    });
  }
  return rows;
}
