import { Redis } from "@upstash/redis";

const FREE_CREDITS = 3;
const CAMPAIGN_LIMIT = 30;
const LIGHT_MONTHLY_LIMIT = 10;
const PREMIUM_IMAGE_MONTHLY_LIMIT = 15;

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function isAdmin(deviceId: string): boolean {
  const adminIds = (process.env.ADMIN_DEVICE_ID ?? "").split(",").map(s => s.trim()).filter(Boolean);
  return adminIds.includes(deviceId);
}

async function getUser(deviceId: string): Promise<UserRecord | null> {
  return redis.get<UserRecord>(`user:${deviceId}`);
}

async function setUser(deviceId: string, record: UserRecord): Promise<void> {
  await redis.set(`user:${deviceId}`, record);
}

export async function initUser(deviceId: string): Promise<void> {
  const existing = await getUser(deviceId);
  if (!existing) {
    await setUser(deviceId, {
      trialStartedAt: new Date().toISOString(),
      freeCreditsLeft: FREE_CREDITS,
    });
    await redis.incr("user_count");
  } else if (existing.freeCreditsLeft === undefined) {
    existing.freeCreditsLeft = FREE_CREDITS;
    await setUser(deviceId, existing);
  }
}

export async function getTrialStatus(deviceId: string): Promise<{
  trialActive: boolean;
  daysLeft: number;
  subscribed: boolean;
  plan: PlanType | null;
  generationsLeft: number | null;
  imageGenerationsLeft: number | null;
  freeCreditsLeft: number;
  freeCreditsTotal: number;
}> {
  const record = await getUser(deviceId);

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

export async function canGenerate(deviceId: string): Promise<boolean> {
  if (isAdmin(deviceId)) return true;
  const status = await getTrialStatus(deviceId);
  if (!status.trialActive) return false;
  if (status.subscribed && status.plan === "light") {
    return (status.generationsLeft ?? 0) > 0;
  }
  return true;
}

export async function canGenerateImage(deviceId: string): Promise<boolean> {
  if (isAdmin(deviceId)) return true;
  return (await getTrialStatus(deviceId)).trialActive;
}

export async function getImageQuality(deviceId: string): Promise<"low" | "medium" | "high"> {
  if (isAdmin(deviceId)) return "high";
  return (await getTrialStatus(deviceId)).plan === "premium" ? "medium" : "low";
}

export async function canSave(deviceId: string): Promise<boolean> {
  const status = await getTrialStatus(deviceId);
  if (!status.subscribed) return status.trialActive;
  return status.plan === "standard" || status.plan === "premium";
}

export async function incrementGeneration(deviceId: string): Promise<void> {
  if (isAdmin(deviceId)) return;
  const record = await getUser(deviceId);
  if (!record) return;

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

  await setUser(deviceId, record);
}

export async function incrementImageGeneration(deviceId: string): Promise<void> {
  if (isAdmin(deviceId)) return;
  const record = await getUser(deviceId);
  if (!record) return;

  const month = currentMonth();
  if (record.imageMonth !== month) {
    record.imageCount = 1;
    record.imageMonth = month;
  } else {
    record.imageCount = (record.imageCount ?? 0) + 1;
  }

  await setUser(deviceId, record);
}

export async function setSubscription(
  deviceId: string,
  subscriptionId: string,
  status: "active" | "canceled",
  plan?: PlanType
): Promise<void> {
  let record = await getUser(deviceId);
  if (!record) {
    record = { trialStartedAt: new Date().toISOString(), freeCreditsLeft: 0 };
    await redis.incr("user_count");
  }
  record.subscriptionId = subscriptionId;
  record.subscriptionStatus = status;
  if (plan) record.plan = plan;
  await setUser(deviceId, record);
  await redis.set(`sub:${subscriptionId}`, deviceId);
}

export async function addFreeCredits(deviceId: string, amount: number): Promise<void> {
  let record = await getUser(deviceId);
  if (!record) {
    record = { trialStartedAt: new Date().toISOString(), freeCreditsLeft: 0 };
    await redis.incr("user_count");
  }
  record.freeCreditsLeft = (record.freeCreditsLeft ?? 0) + amount;
  await setUser(deviceId, record);
}

export async function getSubscriptionId(deviceId: string): Promise<string | null> {
  return (await getUser(deviceId))?.subscriptionId ?? null;
}

export async function getDeviceBySubscriptionId(subscriptionId: string): Promise<string | null> {
  return redis.get<string>(`sub:${subscriptionId}`);
}

export async function getUserCount(): Promise<number> {
  return (await redis.get<number>("user_count")) ?? 0;
}

export { CAMPAIGN_LIMIT, FREE_CREDITS };
