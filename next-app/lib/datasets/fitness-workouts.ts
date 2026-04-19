import { createFaker, clamp, logNormal, round } from "./faker-utils";

// Workout types with typical MET values (Compendium of Physical Activities)
const WORKOUT_TYPES = [
  { name: "Running (6 mph)", met: 9.8, durationMin: [25, 90], heartRateBias: 1.25, category: "cardio", w: 18 },
  { name: "Running (Trail)", met: 10.5, durationMin: [30, 120], heartRateBias: 1.3, category: "cardio", w: 5 },
  { name: "Walking (Brisk)", met: 4.3, durationMin: [20, 90], heartRateBias: 0.85, category: "cardio", w: 10 },
  { name: "Cycling (Outdoor)", met: 8.0, durationMin: [30, 180], heartRateBias: 1.15, category: "cardio", w: 10 },
  { name: "Cycling (Indoor/Spin)", met: 8.5, durationMin: [25, 60], heartRateBias: 1.2, category: "cardio", w: 8 },
  { name: "Swimming (Laps)", met: 8.3, durationMin: [20, 75], heartRateBias: 1.1, category: "cardio", w: 4 },
  { name: "Weight Training", met: 6.0, durationMin: [30, 90], heartRateBias: 0.95, category: "strength", w: 14 },
  { name: "HIIT", met: 11.0, durationMin: [15, 45], heartRateBias: 1.4, category: "hiit", w: 9 },
  { name: "CrossFit WOD", met: 10.5, durationMin: [20, 60], heartRateBias: 1.35, category: "hiit", w: 5 },
  { name: "Yoga (Vinyasa)", met: 4.0, durationMin: [30, 90], heartRateBias: 0.75, category: "flexibility", w: 6 },
  { name: "Pilates", met: 3.5, durationMin: [30, 60], heartRateBias: 0.8, category: "flexibility", w: 3 },
  { name: "Rowing (Machine)", met: 7.5, durationMin: [15, 45], heartRateBias: 1.2, category: "cardio", w: 3 },
  { name: "Hiking", met: 6.5, durationMin: [45, 300], heartRateBias: 1.05, category: "cardio", w: 3 },
  { name: "Elliptical", met: 5.5, durationMin: [20, 60], heartRateBias: 1.0, category: "cardio", w: 2 },
];

const DEVICES = [
  { name: "Apple Watch Series 10", brand: "Apple", w: 22 },
  { name: "Apple Watch Ultra 3", brand: "Apple", w: 6 },
  { name: "Garmin Forerunner 965", brand: "Garmin", w: 10 },
  { name: "Garmin Fenix 8", brand: "Garmin", w: 8 },
  { name: "Whoop 5.0", brand: "Whoop", w: 7 },
  { name: "Fitbit Charge 7", brand: "Fitbit", w: 10 },
  { name: "Oura Ring Gen 4", brand: "Oura", w: 6 },
  { name: "Samsung Galaxy Watch 7", brand: "Samsung", w: 10 },
  { name: "Polar Vantage V3", brand: "Polar", w: 4 },
  { name: "Peloton Bike+", brand: "Peloton", w: 6 },
  { name: "Strava Mobile (GPS Phone)", brand: "Strava", w: 8 },
  { name: "Coros Pace Pro", brand: "Coros", w: 3 },
];

export function generateFitnessWorkouts(count = 1800) {
  const f = createFaker(17017);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const workout = f.helpers.weightedArrayElement(WORKOUT_TYPES.map((w) => ({ weight: w.w, value: w })));
    const device = f.helpers.weightedArrayElement(DEVICES.map((d) => ({ weight: d.w, value: d })));

    // User demographics — age affects max HR (220-age formula)
    const age = f.number.int({ min: 16, max: 75 });
    const maxHr = 220 - age;
    const weightKg = round(clamp(logNormal(f, 72, 0.22), 42, 150), 1);
    const heightCm = f.number.int({ min: 150, max: 200 });
    const restingHr = f.number.int({ min: 48, max: 80 });
    const gender = f.helpers.weightedArrayElement([
      { weight: 48, value: "male" },
      { weight: 48, value: "female" },
      { weight: 4, value: "non-binary" },
    ]);

    // Duration varies around workout type's typical range
    const durationMin = f.number.int({ min: workout.durationMin[0]!, max: workout.durationMin[1]! });
    // Calories burned = MET × weight_kg × hours
    const calories = Math.round(workout.met * weightKg * (durationMin / 60) * f.number.float({ min: 0.9, max: 1.1, fractionDigits: 2 }));

    // Heart rate zones — target is 60-85% of maxHR, workout-type biased
    const avgHr = Math.round(clamp(restingHr + (maxHr - restingHr) * 0.55 * workout.heartRateBias, restingHr, maxHr));
    const maxHrObserved = Math.round(clamp(avgHr + f.number.int({ min: 10, max: 35 }), avgHr, maxHr));
    const hrZone = avgHr / maxHr < 0.6 ? "Zone 1 (Warm-Up)" : avgHr / maxHr < 0.7 ? "Zone 2 (Fat Burn)" : avgHr / maxHr < 0.8 ? "Zone 3 (Aerobic)" : avgHr / maxHr < 0.9 ? "Zone 4 (Anaerobic)" : "Zone 5 (VO2 Max)";

    // Distance-based workouts
    const hasDistance = ["cardio"].includes(workout.category);
    const distanceKm = hasDistance
      ? round(workout.name.startsWith("Running") ? durationMin / 60 * f.number.float({ min: 6, max: 13, fractionDigits: 2 }) : workout.name.startsWith("Cycling") ? durationMin / 60 * f.number.float({ min: 18, max: 35, fractionDigits: 2 }) : workout.name.startsWith("Walking") ? durationMin / 60 * f.number.float({ min: 4.5, max: 6.5, fractionDigits: 2 }) : workout.name.startsWith("Swimming") ? durationMin / 60 * f.number.float({ min: 2, max: 4, fractionDigits: 2 }) : workout.name === "Hiking" ? durationMin / 60 * f.number.float({ min: 3, max: 6, fractionDigits: 2 }) : durationMin / 60 * f.number.float({ min: 5, max: 10, fractionDigits: 2 }), 2)
      : null;
    const paceMinPerKm = distanceKm ? round(durationMin / distanceKm, 2) : null;

    // GPS/elevation for outdoor cardio
    const isOutdoor = ["Running (6 mph)", "Running (Trail)", "Walking (Brisk)", "Cycling (Outdoor)", "Hiking"].includes(workout.name);
    const elevationGainM = isOutdoor ? f.number.int({ min: 0, max: 800 }) : null;

    // Strength-specific metrics
    const isStrength = workout.category === "strength";
    const totalSets = isStrength ? f.number.int({ min: 8, max: 30 }) : null;
    const totalReps = isStrength ? f.number.int({ min: 60, max: 240 }) : null;
    const totalVolumeKg = isStrength ? Math.round(weightKg * f.number.float({ min: 15, max: 60, fractionDigits: 1 })) : null;

    // Recovery & HRV
    const hrvMs = f.number.int({ min: 22, max: 120 });
    const sleepHoursPrev = round(f.number.float({ min: 4.5, max: 9.5, fractionDigits: 2 }), 2);

    const startedAt = f.date.between({ from: "2025-01-01", to: "2025-12-31" });
    const endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);

    rows.push({
      workout_id: `wkt_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      user_id: `usr_${f.string.alphanumeric({ length: 10, casing: "lower" })}`,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      workout_date: startedAt.toISOString().split("T")[0],
      day_of_week: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][startedAt.getDay()],
      workout_type: workout.name,
      workout_category: workout.category,
      device: device.name,
      device_brand: device.brand,
      duration_min: durationMin,
      active_min: Math.round(durationMin * f.number.float({ min: 0.85, max: 1.0, fractionDigits: 3 })),
      calories_kcal: calories,
      met_value: workout.met,
      distance_km: distanceKm,
      pace_min_per_km: paceMinPerKm,
      elevation_gain_m: elevationGainM,
      avg_heart_rate: avgHr,
      max_heart_rate: maxHrObserved,
      resting_heart_rate: restingHr,
      heart_rate_zone: hrZone,
      time_in_zone_1_min: round(durationMin * f.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 }), 1),
      time_in_zone_2_min: round(durationMin * f.number.float({ min: 0.1, max: 0.4, fractionDigits: 2 }), 1),
      time_in_zone_3_min: round(durationMin * f.number.float({ min: 0.1, max: 0.4, fractionDigits: 2 }), 1),
      time_in_zone_4_min: round(durationMin * f.number.float({ min: 0.02, max: 0.25, fractionDigits: 2 }), 1),
      time_in_zone_5_min: round(durationMin * f.number.float({ min: 0, max: 0.1, fractionDigits: 2 }), 1),
      vo2_max_estimate: round(f.number.float({ min: 28, max: 62, fractionDigits: 1 }), 1),
      steps: ["cardio"].includes(workout.category) && !workout.name.includes("Cycling") && !workout.name.includes("Swimming") ? Math.round(distanceKm! * 1350) : f.number.int({ min: 0, max: 2000 }),
      cadence_spm: workout.name.startsWith("Running") ? f.number.int({ min: 150, max: 195 }) : null,
      power_avg_watts: workout.name.includes("Cycling") ? f.number.int({ min: 120, max: 320 }) : null,
      total_sets: totalSets,
      total_reps: totalReps,
      total_volume_kg: totalVolumeKg,
      rpe: f.number.int({ min: 3, max: 10 }),
      user_age: age,
      user_gender: gender,
      user_weight_kg: weightKg,
      user_height_cm: heightCm,
      hrv_overnight_ms: hrvMs,
      sleep_hours_prior: sleepHoursPrev,
      recovery_score: f.number.int({ min: 20, max: 100 }),
      location: isOutdoor ? f.location.city() : "Gym / Indoor",
      weather_temp_c: isOutdoor ? round(f.number.float({ min: -5, max: 38, fractionDigits: 1 }), 1) : null,
      is_personal_record: f.datatype.boolean(0.04),
      is_manual_entry: f.datatype.boolean(0.08),
      synced_to_apps: f.helpers.arrayElements(["Strava", "Apple Health", "Google Fit", "MyFitnessPal", "TrainingPeaks"], { min: 0, max: 3 }).join(", "),
    });
  }
  return rows;
}
