import { createFaker, clamp, logNormal, round } from "./faker-utils";

// IATA/ICAO airport pairs with hub role — US BTS / OAG-style route data.
const AIRPORTS = [
  { iata: "JFK", icao: "KJFK", city: "New York", country: "US", hub: true },
  { iata: "LAX", icao: "KLAX", city: "Los Angeles", country: "US", hub: true },
  { iata: "ORD", icao: "KORD", city: "Chicago", country: "US", hub: true },
  { iata: "DFW", icao: "KDFW", city: "Dallas", country: "US", hub: true },
  { iata: "ATL", icao: "KATL", city: "Atlanta", country: "US", hub: true },
  { iata: "SFO", icao: "KSFO", city: "San Francisco", country: "US", hub: true },
  { iata: "SEA", icao: "KSEA", city: "Seattle", country: "US", hub: true },
  { iata: "BOS", icao: "KBOS", city: "Boston", country: "US", hub: true },
  { iata: "MIA", icao: "KMIA", city: "Miami", country: "US", hub: true },
  { iata: "DEN", icao: "KDEN", city: "Denver", country: "US", hub: true },
  { iata: "PHX", icao: "KPHX", city: "Phoenix", country: "US", hub: false },
  { iata: "LAS", icao: "KLAS", city: "Las Vegas", country: "US", hub: false },
  { iata: "MSP", icao: "KMSP", city: "Minneapolis", country: "US", hub: true },
  { iata: "DTW", icao: "KDTW", city: "Detroit", country: "US", hub: true },
  { iata: "CLT", icao: "KCLT", city: "Charlotte", country: "US", hub: true },
  { iata: "LHR", icao: "EGLL", city: "London", country: "GB", hub: true },
  { iata: "CDG", icao: "LFPG", city: "Paris", country: "FR", hub: true },
  { iata: "FRA", icao: "EDDF", city: "Frankfurt", country: "DE", hub: true },
  { iata: "AMS", icao: "EHAM", city: "Amsterdam", country: "NL", hub: true },
  { iata: "DXB", icao: "OMDB", city: "Dubai", country: "AE", hub: true },
  { iata: "NRT", icao: "RJAA", city: "Tokyo", country: "JP", hub: true },
  { iata: "HND", icao: "RJTT", city: "Tokyo", country: "JP", hub: true },
  { iata: "SIN", icao: "WSSS", city: "Singapore", country: "SG", hub: true },
  { iata: "HKG", icao: "VHHH", city: "Hong Kong", country: "HK", hub: true },
];

const CARRIERS = [
  { iata: "DL", icao: "DAL", name: "Delta Air Lines", w: 14 },
  { iata: "AA", icao: "AAL", name: "American Airlines", w: 14 },
  { iata: "UA", icao: "UAL", name: "United Airlines", w: 13 },
  { iata: "WN", icao: "SWA", name: "Southwest Airlines", w: 17 },
  { iata: "B6", icao: "JBU", name: "JetBlue Airways", w: 5 },
  { iata: "AS", icao: "ASA", name: "Alaska Airlines", w: 5 },
  { iata: "NK", icao: "NKS", name: "Spirit Airlines", w: 4 },
  { iata: "F9", icao: "FFT", name: "Frontier Airlines", w: 3 },
  { iata: "BA", icao: "BAW", name: "British Airways", w: 4 },
  { iata: "LH", icao: "DLH", name: "Lufthansa", w: 4 },
  { iata: "AF", icao: "AFR", name: "Air France", w: 3 },
  { iata: "EK", icao: "UAE", name: "Emirates", w: 4 },
  { iata: "QR", icao: "QTR", name: "Qatar Airways", w: 3 },
  { iata: "NH", icao: "ANA", name: "All Nippon Airways", w: 3 },
  { iata: "SQ", icao: "SIA", name: "Singapore Airlines", w: 2 },
];

const AIRCRAFT = ["B737-800", "B737-MAX8", "B777-300ER", "B787-9", "A320-200", "A321neo", "A330-300", "A350-900", "E190", "CRJ-700"];

// DOT BTS cancellation reason codes (A=Carrier, B=Weather, C=NAS, D=Security)
const CANCEL_CODES = [
  { code: "A", label: "Carrier", w: 35 },
  { code: "B", label: "Weather", w: 40 },
  { code: "C", label: "National Air System", w: 22 },
  { code: "D", label: "Security", w: 3 },
];

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// Rough coordinates for distance calc
const COORDS: Record<string, [number, number]> = {
  JFK: [40.64, -73.78], LAX: [33.94, -118.41], ORD: [41.98, -87.91], DFW: [32.90, -97.04],
  ATL: [33.64, -84.43], SFO: [37.62, -122.38], SEA: [47.45, -122.31], BOS: [42.36, -71.01],
  MIA: [25.79, -80.29], DEN: [39.86, -104.67], PHX: [33.43, -112.01], LAS: [36.08, -115.15],
  MSP: [44.88, -93.22], DTW: [42.21, -83.35], CLT: [35.21, -80.94],
  LHR: [51.47, -0.45], CDG: [49.01, 2.55], FRA: [50.03, 8.56], AMS: [52.31, 4.76],
  DXB: [25.25, 55.36], NRT: [35.77, 140.39], HND: [35.55, 139.78], SIN: [1.36, 103.99], HKG: [22.31, 113.92],
};

export function generateAirlineFlights(count = 800) {
  const f = createFaker(16016);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const origin = f.helpers.arrayElement(AIRPORTS);
    let destination = f.helpers.arrayElement(AIRPORTS);
    while (destination.iata === origin.iata) destination = f.helpers.arrayElement(AIRPORTS);
    const carrier = f.helpers.weightedArrayElement(CARRIERS.map((c) => ({ weight: c.w, value: c })));
    const aircraft = f.helpers.arrayElement(AIRCRAFT);

    const distanceMi = haversineMi(COORDS[origin.iata]![0], COORDS[origin.iata]![1], COORDS[destination.iata]![0], COORDS[destination.iata]![1]);
    const blockMinutes = Math.round(distanceMi / 7.5 + 40); // ~450kt avg + taxi

    const depDate = f.date.between({ from: "2024-06-01", to: "2025-12-31" });
    const schedDep = new Date(depDate);
    schedDep.setHours(f.number.int({ min: 5, max: 23 }), f.helpers.arrayElement([0, 15, 30, 45]), 0, 0);

    // On-time performance ~80% within 15 min (BTS national avg)
    const depDelay = f.helpers.weightedArrayElement([
      { weight: 75, value: f.number.int({ min: -10, max: 14 }) },
      { weight: 18, value: f.number.int({ min: 15, max: 59 }) },
      { weight: 5, value: f.number.int({ min: 60, max: 180 }) },
      { weight: 2, value: f.number.int({ min: 180, max: 600 }) },
    ]);

    const airTime = blockMinutes + f.number.int({ min: -8, max: 15 });
    const arrDelay = depDelay + f.number.int({ min: -10, max: 10 });

    const isCancelled = f.datatype.boolean(0.018);
    const isDiverted = !isCancelled && f.datatype.boolean(0.002);
    const cancelReason = isCancelled
      ? f.helpers.weightedArrayElement(CANCEL_CODES.map((c) => ({ weight: c.w, value: c })))
      : null;

    const seatCapacity = aircraft.startsWith("A350") || aircraft.startsWith("B777") || aircraft.startsWith("B787")
      ? f.number.int({ min: 250, max: 380 })
      : aircraft.startsWith("A330")
        ? f.number.int({ min: 220, max: 300 })
        : aircraft.startsWith("A32") || aircraft.startsWith("B737")
          ? f.number.int({ min: 150, max: 200 })
          : f.number.int({ min: 76, max: 110 });
    const loadFactor = round(f.number.float({ min: 0.55, max: 0.95, fractionDigits: 3 }), 3);
    const paxBoarded = isCancelled ? 0 : Math.round(seatCapacity * loadFactor);

    const avgFare = distanceMi < 500 ? 180 : distanceMi < 1500 ? 280 : distanceMi < 3500 ? 420 : 780;

    rows.push({
      flight_no: `${carrier.iata}${f.number.int({ min: 100, max: 9999 })}`,
      carrier_iata: carrier.iata,
      carrier_icao: carrier.icao,
      carrier_name: carrier.name,
      tail_number: `N${f.number.int({ min: 100, max: 999 })}${f.string.alpha({ length: 2, casing: "upper" })}`,
      aircraft_type: aircraft,
      origin_iata: origin.iata,
      origin_icao: origin.icao,
      origin_city: origin.city,
      dest_iata: destination.iata,
      dest_icao: destination.icao,
      dest_city: destination.city,
      distance_mi: distanceMi,
      scheduled_block_min: blockMinutes,
      flight_date: depDate.toISOString().split("T")[0],
      scheduled_departure: schedDep.toISOString(),
      actual_departure: isCancelled ? null : new Date(schedDep.getTime() + depDelay * 60 * 1000).toISOString(),
      dep_delay_min: isCancelled ? null : depDelay,
      arr_delay_min: isCancelled ? null : arrDelay,
      air_time_min: isCancelled ? null : airTime,
      taxi_out_min: isCancelled ? null : f.number.int({ min: 8, max: 45 }),
      taxi_in_min: isCancelled ? null : f.number.int({ min: 3, max: 20 }),
      cancelled: isCancelled,
      cancellation_code: cancelReason?.code ?? null,
      cancellation_reason: cancelReason?.label ?? null,
      diverted: isDiverted,
      seat_capacity: seatCapacity,
      passengers_boarded: paxBoarded,
      load_factor: loadFactor,
      avg_fare_usd: round(clamp(logNormal(f, avgFare, 0.5), 60, 6000), 2),
      gate_origin: `${f.string.alpha({ length: 1, casing: "upper" })}${f.number.int({ min: 1, max: 60 })}`,
    });
  }
  return rows;
}
