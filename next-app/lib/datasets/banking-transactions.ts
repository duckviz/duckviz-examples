import { createFaker, clamp, logNormal, round } from "./faker-utils";

// MCC codes paired with representative merchants (ISO 18245 categories).
const PURCHASE_MCC = [
  { mcc: "5411", cat: "Grocery Stores", merchants: ["Whole Foods Market", "Kroger", "Safeway", "Trader Joe's", "Costco Wholesale", "Walmart Grocery"], aov: 72 },
  { mcc: "5812", cat: "Restaurants", merchants: ["Chipotle", "Olive Garden", "Applebee's", "Panera Bread", "The Cheesecake Factory"], aov: 38 },
  { mcc: "5814", cat: "Fast Food", merchants: ["McDonald's", "Starbucks", "Chick-fil-A", "Taco Bell", "Subway", "Dunkin'"], aov: 12 },
  { mcc: "5541", cat: "Service Stations (Fuel)", merchants: ["Shell", "Chevron", "BP", "Exxon", "76", "Arco"], aov: 45 },
  { mcc: "5311", cat: "Department Stores", merchants: ["Macy's", "Nordstrom", "Kohl's", "JCPenney"], aov: 95 },
  { mcc: "5732", cat: "Electronics", merchants: ["Best Buy", "Apple", "Micro Center", "B&H Photo"], aov: 240 },
  { mcc: "5912", cat: "Drug Stores", merchants: ["CVS Pharmacy", "Walgreens", "Rite Aid"], aov: 28 },
  { mcc: "4121", cat: "Taxi / Ride-Share", merchants: ["Uber", "Lyft", "Curb"], aov: 22 },
  { mcc: "4511", cat: "Airlines", merchants: ["Delta", "United", "American Airlines", "Southwest"], aov: 385 },
  { mcc: "7011", cat: "Hotels / Lodging", merchants: ["Marriott", "Hilton", "Airbnb", "Hyatt"], aov: 280 },
  { mcc: "4899", cat: "Cable / Internet", merchants: ["Comcast Xfinity", "Spectrum", "Verizon Fios"], aov: 95 },
  { mcc: "4814", cat: "Telecom", merchants: ["AT&T Wireless", "T-Mobile", "Verizon Wireless"], aov: 75 },
  { mcc: "5999", cat: "Misc Retail", merchants: ["Amazon", "Target", "Walmart"], aov: 55 },
  { mcc: "7832", cat: "Movies / Theaters", merchants: ["AMC Theatres", "Regal Cinemas", "Cinemark"], aov: 32 },
  { mcc: "5942", cat: "Bookstores", merchants: ["Barnes & Noble", "Books-A-Million"], aov: 28 },
];

const NETWORKS = [
  { name: "visa", w: 45 },
  { name: "mastercard", w: 30 },
  { name: "amex", w: 15 },
  { name: "discover", w: 10 },
];

export function generateBankingTransactions(count = 2000) {
  const f = createFaker(17017);
  const rows = [];
  let runningBalance = f.number.int({ min: 1500, max: 25000 });

  for (let i = 0; i < count; i++) {
    const txnType = f.helpers.weightedArrayElement([
      { weight: 55, value: "purchase" },
      { weight: 10, value: "ach_debit" },
      { weight: 8, value: "ach_credit" },
      { weight: 7, value: "atm_withdrawal" },
      { weight: 5, value: "direct_deposit" },
      { weight: 5, value: "transfer_out" },
      { weight: 4, value: "transfer_in" },
      { weight: 3, value: "wire" },
      { weight: 2, value: "fee" },
      { weight: 1, value: "interest" },
    ]);

    const isCredit = ["ach_credit", "direct_deposit", "transfer_in", "interest", "refund"].includes(txnType);
    const channel = txnType === "purchase"
      ? f.helpers.weightedArrayElement([
          { weight: 55, value: "card_present" },
          { weight: 35, value: "card_not_present" },
          { weight: 10, value: "contactless" },
        ])
      : txnType === "atm_withdrawal"
        ? "atm"
        : txnType === "wire"
          ? "wire"
          : txnType.startsWith("ach")
            ? "ach"
            : f.helpers.arrayElement(["mobile_app", "online", "branch"]);

    let amount: number;
    let merchant: string | null = null;
    let mcc: string | null = null;
    let category: string | null = null;
    let network: string | null = null;
    let cardLast4: string | null = null;

    if (txnType === "purchase") {
      const mccRow = f.helpers.arrayElement(PURCHASE_MCC);
      amount = round(clamp(logNormal(f, mccRow.aov, 0.7), 1, mccRow.aov * 20), 2);
      merchant = f.helpers.arrayElement(mccRow.merchants);
      mcc = mccRow.mcc;
      category = mccRow.cat;
      network = f.helpers.weightedArrayElement(NETWORKS.map((n) => ({ weight: n.w, value: n.name })));
      cardLast4 = f.string.numeric({ length: 4, allowLeadingZeros: true });
    } else if (txnType === "atm_withdrawal") {
      amount = f.helpers.arrayElement([20, 40, 60, 80, 100, 200, 300, 500]);
    } else if (txnType === "direct_deposit") {
      amount = round(f.number.float({ min: 1800, max: 6500, fractionDigits: 2 }), 2);
    } else if (txnType === "wire") {
      amount = round(clamp(logNormal(f, 8000, 0.9), 500, 100000), 2);
    } else if (txnType === "fee") {
      amount = f.helpers.arrayElement([3, 3.5, 5, 12, 25, 35]);
    } else if (txnType === "interest") {
      amount = round(f.number.float({ min: 0.1, max: 8.5, fractionDigits: 2 }), 2);
    } else {
      amount = round(clamp(logNormal(f, 250, 0.8), 5, 15000), 2);
    }

    const signed = isCredit ? amount : -amount;
    runningBalance = round(runningBalance + signed, 2);

    const isRecurring = txnType === "ach_debit" || (txnType === "purchase" && ["4899", "4814"].includes(mcc ?? ""));
    const fraudScore = txnType === "purchase"
      ? clamp(Math.round(logNormal(f, 5, 1.4)), 0, 100)
      : 0;
    const isFraud = fraudScore > 75;

    rows.push({
      txn_id: `txn_${f.string.alphanumeric({ length: 14, casing: "lower" })}`,
      account_id: `acct_${f.number.int({ min: 1, max: 500 }).toString().padStart(6, "0")}`,
      posted_date: f.date.between({ from: "2025-01-01", to: "2025-12-31" }).toISOString().split("T")[0],
      transaction_date: f.date.between({ from: "2025-01-01", to: "2025-12-31" }).toISOString(),
      txn_type: txnType,
      channel,
      amount: signed,
      running_balance: runningBalance,
      merchant_name: merchant,
      mcc_code: mcc,
      category,
      network,
      card_last4: cardLast4,
      authorization_code: txnType === "purchase" ? f.string.alphanumeric({ length: 6, casing: "upper" }) : null,
      description: merchant
        ? `${merchant.toUpperCase()} #${f.number.int({ min: 1, max: 9999 })}`
        : txnType.replace("_", " ").toUpperCase(),
      currency: "USD",
      is_recurring: isRecurring,
      is_fraud: isFraud,
      fraud_score: fraudScore,
      is_disputed: isFraud && f.datatype.boolean(0.6),
      status: isFraud && f.datatype.boolean(0.3) ? "declined" : f.helpers.weightedArrayElement([
        { weight: 94, value: "posted" },
        { weight: 4, value: "pending" },
        { weight: 2, value: "declined" },
      ]),
    });
  }
  return rows;
}
