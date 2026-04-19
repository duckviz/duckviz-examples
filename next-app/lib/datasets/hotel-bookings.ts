import { createFaker, clamp, logNormal, round } from "./faker-utils";

const BRANDS = [
  { brand: "Marriott", chain: "Marriott International", tier: "upper_upscale", adrMedian: 240 },
  { brand: "Sheraton", chain: "Marriott International", tier: "upscale", adrMedian: 185 },
  { brand: "W Hotels", chain: "Marriott International", tier: "luxury", adrMedian: 420 },
  { brand: "Ritz-Carlton", chain: "Marriott International", tier: "luxury", adrMedian: 580 },
  { brand: "Courtyard", chain: "Marriott International", tier: "upper_midscale", adrMedian: 145 },
  { brand: "Hilton", chain: "Hilton", tier: "upper_upscale", adrMedian: 225 },
  { brand: "Hampton Inn", chain: "Hilton", tier: "upper_midscale", adrMedian: 135 },
  { brand: "DoubleTree", chain: "Hilton", tier: "upscale", adrMedian: 175 },
  { brand: "Conrad", chain: "Hilton", tier: "luxury", adrMedian: 510 },
  { brand: "Hyatt Regency", chain: "Hyatt", tier: "upper_upscale", adrMedian: 235 },
  { brand: "Park Hyatt", chain: "Hyatt", tier: "luxury", adrMedian: 620 },
  { brand: "Holiday Inn", chain: "IHG", tier: "upper_midscale", adrMedian: 140 },
  { brand: "InterContinental", chain: "IHG", tier: "luxury", adrMedian: 465 },
  { brand: "Four Seasons", chain: "Four Seasons", tier: "luxury", adrMedian: 780 },
  { brand: "Motel 6", chain: "G6 Hospitality", tier: "economy", adrMedian: 75 },
];

const ROOM_TYPES = [
  { type: "Standard King", mult: 1.0 },
  { type: "Standard Double", mult: 1.0 },
  { type: "Deluxe", mult: 1.2 },
  { type: "Executive", mult: 1.45 },
  { type: "Junior Suite", mult: 1.7 },
  { type: "Suite", mult: 2.1 },
  { type: "Presidential Suite", mult: 4.0 },
];

const CITIES = [
  { city: "New York", country: "US", seasonLift: 1.15 },
  { city: "Los Angeles", country: "US", seasonLift: 1.1 },
  { city: "Las Vegas", country: "US", seasonLift: 1.05 },
  { city: "Miami", country: "US", seasonLift: 1.2 },
  { city: "Chicago", country: "US", seasonLift: 1.0 },
  { city: "San Francisco", country: "US", seasonLift: 1.15 },
  { city: "London", country: "GB", seasonLift: 1.1 },
  { city: "Paris", country: "FR", seasonLift: 1.2 },
  { city: "Tokyo", country: "JP", seasonLift: 1.05 },
  { city: "Dubai", country: "AE", seasonLift: 1.3 },
  { city: "Singapore", country: "SG", seasonLift: 1.0 },
  { city: "Barcelona", country: "ES", seasonLift: 1.15 },
];

const CHANNELS = [
  { name: "Direct (Web)", commission: 0, w: 18 },
  { name: "Direct (App)", commission: 0, w: 12 },
  { name: "Booking.com", commission: 0.17, w: 22 },
  { name: "Expedia", commission: 0.2, w: 14 },
  { name: "Hotels.com", commission: 0.2, w: 8 },
  { name: "Airbnb", commission: 0.15, w: 4 },
  { name: "GDS (Sabre/Amadeus)", commission: 0.12, w: 10 },
  { name: "Corporate Contract", commission: 0.05, w: 8 },
  { name: "Agoda", commission: 0.18, w: 4 },
];

export function generateHotelBookings(count = 900) {
  const f = createFaker(23023);
  const rows = [];
  for (let i = 0; i < count; i++) {
    const brand = f.helpers.arrayElement(BRANDS);
    const city = f.helpers.arrayElement(CITIES);
    const roomType = f.helpers.arrayElement(ROOM_TYPES);
    const channel = f.helpers.weightedArrayElement(CHANNELS.map((c) => ({ weight: c.w, value: c })));

    const los = f.helpers.weightedArrayElement([
      { weight: 30, value: 1 },
      { weight: 35, value: 2 },
      { weight: 20, value: 3 },
      { weight: 8, value: 4 },
      { weight: 5, value: 5 },
      { weight: 2, value: f.number.int({ min: 6, max: 14 }) },
    ]);

    const adr = round(
      clamp(logNormal(f, brand.adrMedian * city.seasonLift * roomType.mult, 0.35), 50, brand.adrMedian * roomType.mult * 4),
      2,
    );
    const taxRate = f.number.float({ min: 0.11, max: 0.185, fractionDigits: 3 });
    const taxes = round(adr * los * taxRate, 2);
    const roomRevenue = round(adr * los, 2);
    const totalRevenue = round(roomRevenue + taxes, 2);
    const commissionPaid = round(roomRevenue * channel.commission, 2);

    const checkIn = f.date.between({ from: "2024-06-01", to: "2025-11-01" });
    const checkOut = new Date(checkIn.getTime() + los * 24 * 60 * 60 * 1000);
    const bookingDate = new Date(checkIn.getTime() - f.number.int({ min: 0, max: 120 }) * 24 * 60 * 60 * 1000);
    const leadDays = Math.round((checkIn.getTime() - bookingDate.getTime()) / (24 * 60 * 60 * 1000));

    const status = f.helpers.weightedArrayElement([
      { weight: 70, value: "checked_out" },
      { weight: 12, value: "cancelled" },
      { weight: 10, value: "reserved" },
      { weight: 5, value: "checked_in" },
      { weight: 3, value: "no_show" },
    ]);

    // Rating skewed higher for luxury tier
    const ratingBias = brand.tier === "luxury" ? 0.3 : brand.tier === "economy" ? -0.3 : 0;
    const rawRating = f.number.float({ min: 1, max: 5, fractionDigits: 1 }) + ratingBias;
    const guestRating = round(clamp(rawRating, 1, 5), 1);

    rows.push({
      reservation_id: `RES-${f.number.int({ min: 1, max: 999999999 }).toString().padStart(10, "0")}`,
      property_id: `PROP-${f.number.int({ min: 1, max: 500 }).toString().padStart(5, "0")}`,
      brand: brand.brand,
      chain: brand.chain,
      tier: brand.tier,
      city: city.city,
      country: city.country,
      room_type: roomType.type,
      rate_code: f.helpers.arrayElement(["BAR", "RACK", "AAA", "AARP", "CORP", "GOVT", "PKG", "WEB"]),
      booking_date: bookingDate.toISOString().split("T")[0],
      check_in: checkIn.toISOString().split("T")[0],
      check_out: checkOut.toISOString().split("T")[0],
      lead_days: leadDays,
      nights: los,
      adults: f.number.int({ min: 1, max: 4 }),
      children: f.number.int({ min: 0, max: 3 }),
      adr,
      room_revenue: roomRevenue,
      taxes,
      total_revenue: totalRevenue,
      channel: channel.name,
      channel_commission: commissionPaid,
      status,
      guest_rating: status === "checked_out" ? guestRating : null,
      loyalty_tier: f.helpers.weightedArrayElement([
        { weight: 55, value: null },
        { weight: 20, value: "Silver" },
        { weight: 15, value: "Gold" },
        { weight: 7, value: "Platinum" },
        { weight: 3, value: "Diamond" },
      ]),
      market_segment: f.helpers.weightedArrayElement([
        { weight: 45, value: "Leisure" },
        { weight: 25, value: "Business" },
        { weight: 15, value: "Group" },
        { weight: 10, value: "Wholesale" },
        { weight: 5, value: "Contract" },
      ]),
    });
  }
  return rows;
}
