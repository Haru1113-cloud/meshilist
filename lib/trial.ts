const FREE_CREDITS = 5;
const CAMPAIGN_LIMIT = 30;
const LIGHT_MONTHLY_LIMIT = 10;
const PREMIUM_IMAGE_MONTHLY_LIMIT = 15;

export type PlanType = "light" | "standard" | "premium";

interface UserRecord {
  trialStartedAt: string;
  freeCreditsLeft: number;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "canceled";
  plan?: PlanType;
  generationCount?: number;
  generationMonth?: string; // "YYYY-MM"
  imageCount?: number;
  imageMonth?: string; // "YYYY-MM"
}

// In-memory store (resets on cold start — fine for prototype)
const store: Record<string, UserRecord> = {};

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function initUser(deviceId: string): void {
  if (!(deviceId in store)) {
    store[deviceId] = {
      trialStartedAt: new Date().toISOString(),
      freeCreditsLeft: FREE_CREDITS,
    };
  }
}

export function getTrialStatus(deviceId: string): {
  trialActive: boolean;
  daysLeft: number;
  subscribed: boolean;
  plan: PlanType | null;
  generationsLeft: number | null; // null = unlimited
  imageGenerationsLeft: number | null;
  freeCreditsLeft: number;
  freeCreditsTotal: number;
} {
  const record = store[deviceId];

  if (!record) {
    return {
      trialActive: false,
      daysLeft: 0,
      subscribed: false,
      plan: null,
      generationsLeft: null,
      imageGenerationsLeft: null,
      freeCreditsLeft: 0,
      freeCreditsTotal: FREE_CREDITS,
    };
  }

  const subscribed = record.subscriptionStatus === "active";
  const plan = record.plan ?? null;

  if (subscribed) {
    let generationsLeft: number | null = null;
    if (plan === "light") {
      const month = currentMonth();
      const count = record.generationMonth === month ? (record.generationCount ?? 0) : 0;
      generationsLeft = Math.max(0, LIGHT_MONTHLY_LIMIT - count);
    }

    let imageGenerationsLeft: number | null = null;
    if (plan === "premium") {
      const month = currentMonth();
      const count = record.imageMonth === month ? (record.imageCount ?? 0) : 0;
      imageGenerationsLeft = Math.max(0, PREMIUM_IMAGE_MONTHLY_LIMIT - count);
    }

    return {
      trialActive: true,
      daysLeft: 999,
      subscribed: true,
      plan,
      generationsLeft,
      imageGenerationsLeft,
      freeCreditsLeft: 0,
      freeCreditsTotal: FREE_CREDITS,
    };
  }

  const creditsLeft = record.freeCreditsLeft ?? 0;

  return {
    trialActive: creditsLeft > 0,
    daysLeft: creditsLeft, // compat: use creditsLeft as daysLeft
    subscribed: false,
    plan: null,
    generationsLeft: null,
    imageGenerationsLeft: null,
    freeCreditsLeft: creditsLeft,
    freeCreditsTotal: FREE_CREDITS,
  };
}

export function canGenerate(deviceId: string): boolean {
  const status = getTrialStatus(deviceId);
  if (!status.trialActive) return false;
  if (status.subscribed && status.plan === "light") {
    return (status.generationsLeft ?? 0) > 0;
  }
  return true;
}

export function canGenerateImage(deviceId: string): boolean {
  const status = getTrialStatus(deviceId);
  return status.trialActive;
}

export function getImageQuality(deviceId: string): "low" | "high" {
  const status = getTrialStatus(deviceId);
  return status.plan === "premium" ? "high" : "low";
}

export function canSave(deviceId: string): boolean {
  const status = getTrialStatus(deviceId);
  if (!status.subscribed) return status.trialActive;
  return status.plan === "standard" || status.plan === "premium";
}

export function incrementGeneration(deviceId: string): void {
  if (!(deviceId in store)) return;
  const record = store[deviceId];

  // 有料プランのライトは月間カウント
  if (record.plan === "light" && record.subscriptionStatus === "active") {
    const month = currentMonth();
    if (record.generationMonth !== month) {
      record.generationCount = 1;
      record.generationMonth = month;
    } else {
      record.generationCount = (record.generationCount ?? 0) + 1;
    }
    return;
  }

  // 無料トライアルはクレジットを消費
  if (!record.subscriptionStatus || record.subscriptionStatus !== "active") {
    record.freeCreditsLeft = Math.max(0, (record.freeCreditsLeft ?? 0) - 1);
  }
}

export function incrementImageGeneration(deviceId: string): void {
  if (!(deviceId in store)) return;
  const record = store[deviceId];
  const month = currentMonth();
  if (record.imageMonth !== month) {
    record.imageCount = 1;
    record.imageMonth = month;
  } else {
    record.imageCount = (record.imageCount ?? 0) + 1;
  }
}

export function setSubscription(
  deviceId: string,
  subscriptionId: string,
  status: "active" | "canceled",
  plan?: PlanType
): void {
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString(), freeCreditsLeft: 0 };
  }
  store[deviceId].subscriptionId = subscriptionId;
  store[deviceId].subscriptionStatus = status;
  if (plan) {
    store[deviceId].plan = plan;
  }
}

export function getSubscriptionId(deviceId: string): string | null {
  return store[deviceId]?.subscriptionId ?? null;
}

export function getDeviceBySubscriptionId(subscriptionId: string): string | null {
  for (const [deviceId, record] of Object.entries(store)) {
    if (record.subscriptionId === subscriptionId) return deviceId;
  }
  return null;
}

export function getUserCount(): number {
  return Object.keys(store).length;
}

export { CAMPAIGN_LIMIT, FREE_CREDITS };
