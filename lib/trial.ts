import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "users.json");
const TRIAL_DAYS = 7;

interface UserRecord {
  trialStartedAt: string;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "canceled";
}

type UserStore = Record<string, UserRecord>;

function readStore(): UserStore {
  try {
    if (!fs.existsSync(DATA_PATH)) return {};
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8")) as UserStore;
  } catch {
    return {};
  }
}

function writeStore(store: UserStore): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function initUser(deviceId: string): void {
  const store = readStore();
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString() };
    writeStore(store);
  }
}

export function getTrialStatus(deviceId: string): {
  trialActive: boolean;
  daysLeft: number;
  subscribed: boolean;
} {
  const store = readStore();
  const record = store[deviceId];

  if (!record) {
    return { trialActive: false, daysLeft: 0, subscribed: false };
  }

  const subscribed = record.subscriptionStatus === "active";
  if (subscribed) {
    return { trialActive: true, daysLeft: 999, subscribed: true };
  }

  const started = new Date(record.trialStartedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);

  return { trialActive: daysLeft > 0, daysLeft, subscribed: false };
}

export function canGenerate(deviceId: string): boolean {
  const { trialActive, subscribed } = getTrialStatus(deviceId);
  return trialActive || subscribed;
}

export function setSubscription(
  deviceId: string,
  subscriptionId: string,
  status: "active" | "canceled"
): void {
  const store = readStore();
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString() };
  }
  store[deviceId].subscriptionId = subscriptionId;
  store[deviceId].subscriptionStatus = status;
  writeStore(store);
}

export function getDeviceBySubscriptionId(subscriptionId: string): string | null {
  const store = readStore();
  for (const [deviceId, record] of Object.entries(store)) {
    if (record.subscriptionId === subscriptionId) return deviceId;
  }
  return null;
}
