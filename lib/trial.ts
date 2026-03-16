import fs from "fs";
import path from "path";

const FREE_CREDITS = 3;
const CAMPAIGN_LIMIT = 30;
const LIGHT_MONTHLY_LIMIT = 10;
const PREMIUM_IMAGE_MONTHLY_LIMIT = 15;

const DATA_PATH = path.join(process.cwd(), "data", "users.json");

export type PlanType = "light" | "standard" | "premium";

interface UserRecord {
  trialStartedAt: string;
  freeCreditsLeft: number;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "canceled";
  plan?: PlanType;
  generationCount?: number;
  generationMonth?: string;
  imageCount?: number;
  imageMonth?: string;
}

function loadStore(): Record<string, UserRecord> {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, UserRecord>): void {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error("Failed to save store:", e);
  }
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function isAdmin(deviceId: string): boolean {
  const adminId = process.env.ADMIN_DEVICE_ID;
  return !!adminId && deviceId === adminId;
}

export function initUser(deviceId: string): void {
  const store = loadStore();
  if (!(deviceId in store)) {
    store[deviceId] = {
      trialStartedAt: new Date().toISOString(),
      freeCreditsLeft: FREE_CREDITS,
    };
    saveStore(store);
  } else if (store[deviceId].freeCreditsLeft === undefined) {
    // 既存ユーザーのマイグレーション
    store[deviceId].freeCreditsLeft = FREE_CREDITS;
    saveStore(store);
  }
}

export function getTrialStatus(deviceId: string): {
  trialActive: boolean;
  daysLeft: number;
  subscribed: boolean;
  plan: PlanType | null;
  generationsLeft: number | null;
  imageGenerationsLeft: number | null;
  freeCreditsLeft: number;
  freeCreditsTotal: number;
} {
  const store = loadStore();
  const record = store[deviceId];

  if (!record) {
    return {
      trialActive: false, daysLeft: 0, subscribed: false, plan: null,
      generationsLeft: null, imageGenerationsLeft: null,
      freeCreditsLeft: 0, freeCreditsTotal: FREE_CREDITS,
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
      trialActive: true, daysLeft: 999, subscribed: true, plan,
      generationsLeft, imageGenerationsLeft,
      freeCreditsLeft: 0, freeCreditsTotal: FREE_CREDITS,
    };
  }

  const creditsLeft = record.freeCreditsLeft ?? 0;
  return {
    trialActive: creditsLeft > 0, daysLeft: creditsLeft, subscribed: false, plan: null,
    generationsLeft: null, imageGenerationsLeft: null,
    freeCreditsLeft: creditsLeft, freeCreditsTotal: FREE_CREDITS,
  };
}

export function canGenerate(deviceId: string): boolean {
  if (isAdmin(deviceId)) return true;
  const status = getTrialStatus(deviceId);
  if (!status.trialActive) return false;
  if (status.subscribed && status.plan === "light") {
    return (status.generationsLeft ?? 0) > 0;
  }
  return true;
}

export function canGenerateImage(deviceId: string): boolean {
  if (isAdmin(deviceId)) return true;
  return getTrialStatus(deviceId).trialActive;
}

export function getImageQuality(deviceId: string): "low" | "high" {
  return getTrialStatus(deviceId).plan === "premium" ? "high" : "low";
}

export function canSave(deviceId: string): boolean {
  const status = getTrialStatus(deviceId);
  if (!status.subscribed) return status.trialActive;
  return status.plan === "standard" || status.plan === "premium";
}

export function incrementGeneration(deviceId: string): void {
  if (isAdmin(deviceId)) return;
  const store = loadStore();
  if (!(deviceId in store)) return;
  const record = store[deviceId];

  if (record.plan === "light" && record.subscriptionStatus === "active") {
    const month = currentMonth();
    if (record.generationMonth !== month) {
      record.generationCount = 1;
      record.generationMonth = month;
    } else {
      record.generationCount = (record.generationCount ?? 0) + 1;
    }
  } else if (!record.subscriptionStatus || record.subscriptionStatus !== "active") {
    record.freeCreditsLeft = Math.max(0, (record.freeCreditsLeft ?? 0) - 1);
  }

  saveStore(store);
}

export function incrementImageGeneration(deviceId: string): void {
  if (isAdmin(deviceId)) return;
  const store = loadStore();
  if (!(deviceId in store)) return;
  const record = store[deviceId];
  const month = currentMonth();
  if (record.imageMonth !== month) {
    record.imageCount = 1;
    record.imageMonth = month;
  } else {
    record.imageCount = (record.imageCount ?? 0) + 1;
  }
  saveStore(store);
}

export function setSubscription(
  deviceId: string,
  subscriptionId: string,
  status: "active" | "canceled",
  plan?: PlanType
): void {
  const store = loadStore();
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString(), freeCreditsLeft: 0 };
  }
  store[deviceId].subscriptionId = subscriptionId;
  store[deviceId].subscriptionStatus = status;
  if (plan) store[deviceId].plan = plan;
  saveStore(store);
}

export function addFreeCredits(deviceId: string, amount: number): void {
  const store = loadStore();
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString(), freeCreditsLeft: 0 };
  }
  store[deviceId].freeCreditsLeft = (store[deviceId].freeCreditsLeft ?? 0) + amount;
  saveStore(store);
}

export function getSubscriptionId(deviceId: string): string | null {
  return loadStore()[deviceId]?.subscriptionId ?? null;
}

export function getDeviceBySubscriptionId(subscriptionId: string): string | null {
  for (const [deviceId, record] of Object.entries(loadStore())) {
    if (record.subscriptionId === subscriptionId) return deviceId;
  }
  return null;
}

export function getUserCount(): number {
  return Object.keys(loadStore()).length;
}

export { CAMPAIGN_LIMIT, FREE_CREDITS };
