// Uganda-specific domain constants and matching logic for BloodNet+.

export const UGANDA_DISTRICTS = [
  "Kampala",
  "Wakiso",
  "Mukono",
  "Jinja",
  "Mbarara",
  "Gulu",
  "Mbale",
  "Arua",
  "Masaka",
  "Kabarole",
  "Kabale",
  "Lira",
  "Soroti",
  "Hoima",
  "Entebbe",
] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

/** Which donor blood types can be transfused into a given recipient type. */
export const COMPATIBLE_DONORS: Record<BloodType, BloodType[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export const UGANDA_CENTER = { lat: 1.3733, lng: 32.2903 };

/** Great-circle distance in kilometres. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Rough road-travel estimate for Ugandan conditions (urban traffic penalty). */
export function travelMinutes(km: number, urban: boolean): number {
  const avgKmh = urban ? 22 : 55;
  return Math.max(5, Math.round((km / avgKmh) * 60));
}

export const DONATION_INTERVAL_DAYS = 90;

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

export type Urgency = "low" | "moderate" | "high" | "critical";

export type MatchInput = {
  donorBloodType: BloodType;
  recipientBloodType: BloodType;
  distanceKm: number | null;
  isAvailable: boolean;
  lastDonationDate: string | null;
  urgency: Urgency;
  requestAgeMinutes: number;
};

export type MatchResult = {
  score: number;
  compatible: boolean;
  eligible: boolean;
  etaMinutes: number | null;
  reasons: string[];
};

/** Smart matching engine - produces a 0-100 match score. */
export function computeMatch(input: MatchInput): MatchResult {
  const reasons: string[] = [];
  const compatible = COMPATIBLE_DONORS[input.recipientBloodType].includes(
    input.donorBloodType,
  );
  const since = daysSince(input.lastDonationDate);
  const eligible = since === null || since >= DONATION_INTERVAL_DAYS;

  if (!compatible) {
    return {
      score: 0,
      compatible,
      eligible,
      etaMinutes: null,
      reasons: ["Incompatible blood type"],
    };
  }

  let score = 45;
  if (input.donorBloodType === input.recipientBloodType) {
    score += 12;
    reasons.push("Exact blood type match");
  } else {
    reasons.push("Compatible blood type");
  }

  const km = input.distanceKm;
  let eta: number | null = null;
  if (km !== null) {
    eta = travelMinutes(km, km < 25);
    if (km <= 5) score += 22;
    else if (km <= 15) score += 17;
    else if (km <= 40) score += 10;
    else if (km <= 100) score += 4;
    else score -= 6;
    reasons.push(`${km.toFixed(1)} km away (~${eta} min by road)`);
  }

  if (input.isAvailable) {
    score += 12;
    reasons.push("Marked available now");
  } else {
    score -= 20;
    reasons.push("Currently unavailable");
  }

  if (eligible) {
    score += 8;
    reasons.push(
      since === null ? "No recorded recent donation" : `Last donated ${since} days ago`,
    );
  } else {
    score -= 25;
    reasons.push(`Not yet eligible (${DONATION_INTERVAL_DAYS - (since ?? 0)} days to go)`);
  }

  score += { low: 0, moderate: 2, high: 5, critical: 8 }[input.urgency];
  if (input.requestAgeMinutes > 120) score += 3;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    compatible,
    eligible,
    etaMinutes: eta,
    reasons,
  };
}

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** East Africa Time formatting (UTC+3). */
export function formatEAT(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return (
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Kampala",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d) + " EAT"
  );
}

export function timeLeft(target: string): string {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "Overdue";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function normalizeUgPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("256")) return `+${digits}`;
  if (digits.startsWith("0")) return `+256${digits.slice(1)}`;
  return `+256${digits}`;
}

export const UG_PHONE_REGEX = /^\+256\d{9}$/;