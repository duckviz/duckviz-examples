/**
 * Deterministic PRNG (mulberry32) + helper utilities.
 * Zero dependencies — produces repeatable data for demos.
 */

export function createRng(seed: number) {
  let s = seed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min + 1)) + min;
  }

  function float(min: number, max: number, decimals = 2): number {
    return Number((next() * (max - min) + min).toFixed(decimals));
  }

  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(next() * arr.length)]!;
  }

  function pickWeighted<T>(arr: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i]!;
      if (r <= 0) return arr[i]!;
    }
    return arr[arr.length - 1]!;
  }

  function date(start: string, end: string): string {
    const s0 = new Date(start).getTime();
    const e0 = new Date(end).getTime();
    return new Date(s0 + next() * (e0 - s0)).toISOString().split("T")[0]!;
  }

  function datetime(start: string, end: string): string {
    const s0 = new Date(start).getTime();
    const e0 = new Date(end).getTime();
    return new Date(s0 + next() * (e0 - s0)).toISOString();
  }

  function bool(probability = 0.5): boolean {
    return next() < probability;
  }

  function firstName(): string {
    return pick(FIRST_NAMES);
  }

  function lastName(): string {
    return pick(LAST_NAMES);
  }

  function fullName(): string {
    return `${firstName()} ${lastName()}`;
  }

  function companyName(): string {
    return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
  }

  function city(): string {
    return pick(CITIES);
  }

  function country(): string {
    return pick(COUNTRIES);
  }

  function usState(): string {
    return pick(US_STATES);
  }

  function id(prefix: string, n: number): string {
    return `${prefix}-${String(n).padStart(5, "0")}`;
  }

  return {
    next, int, float, pick, pickWeighted, date, datetime,
    bool, firstName, lastName, fullName, companyName,
    city, country, usState, id,
  };
}

export type Rng = ReturnType<typeof createRng>;

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
  "Paul", "Dorothy", "Andrew", "Kimberly", "Joshua", "Emily", "Kenneth", "Donna",
  "Kevin", "Michelle", "Brian", "Carol", "George", "Amanda", "Timothy", "Melissa",
  "Ronald", "Deborah", "Jason", "Stephanie", "Edward", "Rebecca", "Ryan", "Sharon",
  "Jacob", "Laura", "Gary", "Cynthia", "Nicholas", "Kathleen", "Eric", "Amy",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
] as const;

const COMPANY_PREFIXES = [
  "Apex", "Nova", "Vertex", "Summit", "Nexus", "Pulse", "Orbit", "Zenith",
  "Atlas", "Core", "Vibe", "Edge", "Flow", "Peak", "Wave", "Arc",
] as const;

const COMPANY_SUFFIXES = [
  "Tech", "Labs", "Systems", "Digital", "Solutions", "Group", "Inc", "Corp",
  "Analytics", "Dynamics", "Cloud", "AI", "Data", "Works", "IO", "Hub",
] as const;

const CITIES = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco",
  "Seattle", "Denver", "Nashville", "Portland", "Las Vegas", "Memphis",
  "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno",
  "Sacramento", "Miami", "Atlanta", "Boston", "Detroit", "Minneapolis",
] as const;

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Japan",
  "Australia", "Brazil", "India", "Mexico", "South Korea", "Italy", "Spain",
  "Netherlands", "Sweden", "Singapore", "Switzerland", "Norway", "Denmark",
] as const;

const US_STATES = [
  "CA", "TX", "FL", "NY", "IL", "PA", "OH", "GA", "NC", "MI",
  "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI",
  "CO", "MN", "SC", "AL", "LA", "KY", "OR", "OK", "CT", "UT",
] as const;
