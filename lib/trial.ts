const TRIAL_DAYS = 7;

interface UserRecord {
  trialStartedAt: string;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "canceled";
}

// In-memory store (resets on cold start — fine for prototype)
const store: Record<string, UserRecord> = {};

export function initUser(deviceId: string): void {
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString() };
  }
}

export function getTrialStatus(deviceId: string): {
  trialActive: boolean;
  daysLeft: number;
  subscribed: boolean;
} {
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
  if (!(deviceId in store)) {
    store[deviceId] = { trialStartedAt: new Date().toISOString() };
  }
  store[deviceId].subscriptionId = subscriptionId;
  store[deviceId].subscriptionStatus = status;
}

export function getDeviceBySubscriptionId(subscriptionId: string): string | null {
  for (const [deviceId, record] of Object.entries(store)) {
    if (record.subscriptionId === subscriptionId) return deviceId;
  }
  return null;
}
