import { createFaker, clamp, logNormal, round } from "./faker-utils";

// SCAC codes (Standard Carrier Alpha Code, assigned by NMFTA).
const CARRIERS = [
  { scac: "FDEG", name: "FedEx Ground", modes: ["parcel"], w: 18 },
  { scac: "FDE", name: "FedEx Express", modes: ["parcel", "air"], w: 12 },
  { scac: "UPSN", name: "UPS Ground", modes: ["parcel", "ltl"], w: 20 },
  { scac: "USPS", name: "USPS", modes: ["parcel"], w: 10 },
  { scac: "ODFL", name: "Old Dominion Freight", modes: ["ltl", "ftl"], w: 5 },
  { scac: "FXFE", name: "FedEx Freight", modes: ["ltl"], w: 4 },
  { scac: "YFSY", name: "Yellow Freight", modes: ["ltl"], w: 3 },
  { scac: "JBHT", name: "J.B. Hunt", modes: ["ftl", "intermodal"], w: 4 },
  { scac: "SCNN", name: "Schneider National", modes: ["ftl"], w: 3 },
  { scac: "CHRW", name: "C.H. Robinson", modes: ["ftl", "ltl"], w: 3 },
  { scac: "AMZL", name: "Amazon Logistics", modes: ["parcel"], w: 10 },
  { scac: "MAEU", name: "Maersk", modes: ["ocean"], w: 3 },
  { scac: "MSCU", name: "MSC", modes: ["ocean"], w: 2 },
  { scac: "DHLE", name: "DHL Express", modes: ["parcel", "air"], w: 3 },
];

const SERVICE_LEVELS: Record<string, string[]> = {
  parcel: ["Ground", "2Day", "Overnight", "Saturday"],
  air: ["Standard", "Priority", "First Overnight"],
  ltl: ["Standard", "Guaranteed", "Expedited"],
  ftl: ["Dry Van", "Reefer", "Flatbed"],
  ocean: ["FCL", "LCL"],
  intermodal: ["Domestic 53'", "International 40'"],
};

const STATES = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI"];

export function generateLogisticsShipments(count = 900) {
  const f = createFaker(9009);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const carrier = f.helpers.weightedArrayElement(CARRIERS.map((c) => ({ weight: c.w, value: c })));
    const mode = f.helpers.arrayElement(carrier.modes);
    const service = f.helpers.arrayElement(SERVICE_LEVELS[mode]!);

    // Weight distribution depends heavily on mode
    const weightKg = mode === "parcel"
      ? round(clamp(logNormal(f, 4.5, 1.1), 0.1, 70), 2)
      : mode === "ltl"
        ? round(clamp(logNormal(f, 450, 0.9), 70, 8000), 2)
        : mode === "ftl"
          ? round(clamp(logNormal(f, 15000, 0.5), 5000, 20000), 2)
          : mode === "ocean"
            ? round(clamp(logNormal(f, 20000, 0.8), 500, 28000), 2)
            : round(clamp(logNormal(f, 15000, 0.7), 2000, 25000), 2);
    const pieces = mode === "parcel" ? 1 : f.number.int({ min: 1, max: mode === "ftl" ? 26 : mode === "ltl" ? 10 : 40 });

    const estimatedTransitDays = service === "Overnight" || service === "First Overnight"
      ? 1
      : service === "2Day" || service === "Priority"
        ? 2
        : mode === "ocean"
          ? f.number.int({ min: 14, max: 45 })
          : mode === "parcel"
            ? f.number.int({ min: 2, max: 7 })
            : mode === "ltl"
              ? f.number.int({ min: 2, max: 8 })
              : f.number.int({ min: 1, max: 5 });

    const onTime = f.datatype.boolean(service.includes("Guaranteed") || service === "Overnight" ? 0.96 : 0.88);
    const actualDelay = onTime ? f.number.int({ min: -1, max: 0 }) : f.number.int({ min: 1, max: 10 });
    const actualTransitDays = Math.max(1, estimatedTransitDays + actualDelay);

    const tenderDate = f.date.between({ from: "2025-01-01", to: "2025-11-30" });
    const pickupDate = new Date(tenderDate.getTime() + f.number.int({ min: 0, max: 2 }) * 24 * 60 * 60 * 1000);
    const deliveryDate = new Date(pickupDate.getTime() + actualTransitDays * 24 * 60 * 60 * 1000);

    const freightRate = mode === "parcel"
      ? weightKg * 0.45 + 8
      : mode === "ltl"
        ? weightKg * 0.18 + 120
        : mode === "ftl"
          ? 2.8 * f.number.int({ min: 50, max: 2800 }) // per mile approx
          : mode === "ocean"
            ? weightKg * 0.08 + 450
            : weightKg * 0.12 + 220;
    const freightCost = round(freightRate, 2);
    const fuelSurcharge = round(freightCost * f.number.float({ min: 0.05, max: 0.22, fractionDigits: 3 }), 2);
    const accessorial = f.datatype.boolean(0.3) ? round(f.number.float({ min: 15, max: 180, fractionDigits: 2 }), 2) : 0;
    const totalCost = round(freightCost + fuelSurcharge + accessorial, 2);

    const status = mode === "ocean"
      ? f.helpers.weightedArrayElement([
          { weight: 50, value: "delivered" },
          { weight: 25, value: "at_sea" },
          { weight: 10, value: "at_port" },
          { weight: 8, value: "customs" },
          { weight: 5, value: "loaded" },
          { weight: 2, value: "delayed" },
        ])
      : f.helpers.weightedArrayElement([
          { weight: 65, value: "delivered" },
          { weight: 12, value: "out_for_delivery" },
          { weight: 10, value: "in_transit" },
          { weight: 5, value: "at_facility" },
          { weight: 4, value: "delayed" },
          { weight: 2, value: "exception" },
          { weight: 2, value: "returned" },
        ]);

    const originState = f.helpers.arrayElement(STATES);
    let destState = f.helpers.arrayElement(STATES);
    while (destState === originState) destState = f.helpers.arrayElement(STATES);

    rows.push({
      shipment_id: `SHP-${f.number.int({ min: 1, max: 999999999 }).toString().padStart(10, "0")}`,
      tracking_number: carrier.scac === "FDEG" || carrier.scac === "FDE"
        ? f.string.numeric({ length: 12, allowLeadingZeros: true })
        : carrier.scac === "UPSN"
          ? `1Z${f.string.alphanumeric({ length: 16, casing: "upper" })}`
          : carrier.scac === "USPS"
            ? f.string.numeric({ length: 22, allowLeadingZeros: true })
            : f.string.alphanumeric({ length: 14, casing: "upper" }),
      carrier_scac: carrier.scac,
      carrier_name: carrier.name,
      mode,
      service_level: service,
      origin_zip: f.location.zipCode(),
      origin_state: originState,
      origin_city: f.location.city(),
      dest_zip: f.location.zipCode(),
      dest_state: destState,
      dest_city: f.location.city(),
      tender_date: tenderDate.toISOString().split("T")[0],
      pickup_date: pickupDate.toISOString().split("T")[0],
      delivery_date: status === "delivered" ? deliveryDate.toISOString().split("T")[0] : null,
      scheduled_transit_days: estimatedTransitDays,
      actual_transit_days: status === "delivered" ? actualTransitDays : null,
      pieces,
      weight_kg: weightKg,
      weight_lb: round(weightKg * 2.20462, 2),
      freight_cost: freightCost,
      fuel_surcharge: fuelSurcharge,
      accessorial_charges: accessorial,
      total_cost: totalCost,
      on_time: status === "delivered" ? onTime : null,
      status,
      insurance_amount: f.datatype.boolean(0.25) ? round(f.number.float({ min: 100, max: 5000, fractionDigits: 2 }), 2) : 0,
      signature_required: f.datatype.boolean(0.3),
    });
  }
  return rows;
}
