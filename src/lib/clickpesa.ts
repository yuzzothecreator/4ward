import { createHmac, timingSafeEqual } from "crypto";
import { getEnvConfig } from "@/lib/env";
import { isProductionRuntime } from "@/lib/production";
import { getPrisma, pingDatabase } from "@/lib/prisma";

const CLICKPESA_BASE = "https://api.clickpesa.com/third-parties";

export type ClickPesaPaymentStatus =
  | "PROCESSING"
  | "PENDING"
  | "SUCCESS"
  | "SETTLED"
  | "FAILED";

export type PendingMobilePayment = {
  orderReference: string;
  projectId: string;
  slug: string;
  title: string;
  amount: number;
  phoneNumber: string;
  buyerEmail?: string;
  status: ClickPesaPaymentStatus;
  channel?: string;
  clickpesaId?: string;
  message?: string;
  collectedAmount?: number;
  createdAt: string;
  updatedAt: string;
};

/** Process-local cache; DB is source of truth across instances. */
const pendingPayments = new Map<string, PendingMobilePayment>();

let cachedToken: { value: string; expiresAt: number } | null = null;

function canonicalize(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  const record = obj as Record<string, unknown>;
  return Object.keys(record)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalize(record[key]);
      return acc;
    }, {});
}

/** HMAC-SHA256 checksum per ClickPesa docs (exclude checksum fields). */
export function createClickPesaChecksum(
  checksumKey: string,
  payload: Record<string, unknown>
) {
  const { checksum: _c, checksumMethod: _m, ...rest } = payload;
  const payloadString = JSON.stringify(canonicalize(rest));
  return createHmac("sha256", checksumKey).update(payloadString).digest("hex");
}

export function verifyClickPesaChecksum(
  checksumKey: string,
  payload: Record<string, unknown>,
  checksum: string
) {
  const expected = createClickPesaChecksum(checksumKey, payload);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(checksum), "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isClickPesaConfigured() {
  const env = getEnvConfig();
  return env.clickpesaEnabled;
}

/** Normalize TZ numbers to 255XXXXXXXXX (no +). */
export function normalizeTzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;
  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = `255${normalized.slice(1)}`;
  } else if (normalized.startsWith("255") && normalized.length === 12) {
    // already ok
  } else if (normalized.length === 9) {
    normalized = `255${normalized}`;
  } else {
    return null;
  }

  // Tanzania mobile: 255 + 9 digits starting with 6/7
  if (!/^255[67]\d{8}$/.test(normalized)) return null;
  return normalized;
}

/** Alphanumeric-only order reference required by ClickPesa. */
export function createOrderReference(prefix = "4W") {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}${stamp}${rand}`.replace(/[^A-Z0-9]/g, "");
}

function rowToPending(row: {
  orderReference: string;
  projectId: string;
  slug: string;
  title: string;
  amount: number;
  phoneNumber: string;
  buyerEmail: string | null;
  status: string;
  channel: string | null;
  clickpesaId: string | null;
  message: string | null;
  collectedAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}): PendingMobilePayment {
  return {
    orderReference: row.orderReference,
    projectId: row.projectId,
    slug: row.slug,
    title: row.title,
    amount: row.amount,
    phoneNumber: row.phoneNumber,
    buyerEmail: row.buyerEmail || undefined,
    status: row.status as ClickPesaPaymentStatus,
    channel: row.channel || undefined,
    clickpesaId: row.clickpesaId || undefined,
    message: row.message || undefined,
    collectedAmount: row.collectedAmount ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function savePendingPayment(payment: PendingMobilePayment) {
  pendingPayments.set(payment.orderReference, payment);

  const db = await pingDatabase();
  if (!db.ok) {
    if (isProductionRuntime()) {
      throw new Error("Database required to start mobile money payments");
    }
    return payment;
  }

  const prisma = await getPrisma();
  const row = await prisma.pendingPayment.upsert({
    where: { orderReference: payment.orderReference },
    create: {
      orderReference: payment.orderReference,
      projectId: payment.projectId,
      slug: payment.slug,
      title: payment.title,
      amount: payment.amount,
      phoneNumber: payment.phoneNumber,
      buyerEmail: payment.buyerEmail || null,
      status: payment.status,
      channel: payment.channel || null,
      clickpesaId: payment.clickpesaId || null,
      message: payment.message || null,
      collectedAmount: payment.collectedAmount ?? null,
    },
    update: {
      projectId: payment.projectId,
      slug: payment.slug,
      title: payment.title,
      amount: payment.amount,
      phoneNumber: payment.phoneNumber,
      buyerEmail: payment.buyerEmail || null,
      status: payment.status,
      channel: payment.channel || null,
      clickpesaId: payment.clickpesaId || null,
      message: payment.message || null,
      collectedAmount: payment.collectedAmount ?? null,
    },
  });

  const mapped = rowToPending(row);
  pendingPayments.set(mapped.orderReference, mapped);
  return mapped;
}

export async function getPendingPayment(orderReference: string) {
  const cached = pendingPayments.get(orderReference);
  if (cached) return cached;

  const db = await pingDatabase();
  if (!db.ok) return null;

  const prisma = await getPrisma();
  const row = await prisma.pendingPayment.findUnique({
    where: { orderReference },
  });
  if (!row) return null;

  const mapped = rowToPending(row);
  pendingPayments.set(orderReference, mapped);
  return mapped;
}

export async function updatePendingPayment(
  orderReference: string,
  patch: Partial<PendingMobilePayment> & { fulfilledAt?: string | null }
) {
  const current = await getPendingPayment(orderReference);
  if (!current) return null;

  const next: PendingMobilePayment = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  pendingPayments.set(orderReference, next);

  const db = await pingDatabase();
  if (!db.ok) {
    if (isProductionRuntime()) {
      throw new Error("Database required to update mobile money payments");
    }
    return next;
  }

  const prisma = await getPrisma();
  const row = await prisma.pendingPayment.update({
    where: { orderReference },
    data: {
      ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
      ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
      ...(patch.phoneNumber !== undefined
        ? { phoneNumber: patch.phoneNumber }
        : {}),
      ...(patch.buyerEmail !== undefined
        ? { buyerEmail: patch.buyerEmail || null }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.channel !== undefined ? { channel: patch.channel || null } : {}),
      ...(patch.clickpesaId !== undefined
        ? { clickpesaId: patch.clickpesaId || null }
        : {}),
      ...(patch.message !== undefined ? { message: patch.message || null } : {}),
      ...(patch.collectedAmount !== undefined
        ? { collectedAmount: patch.collectedAmount }
        : {}),
      ...(patch.fulfilledAt !== undefined
        ? {
            fulfilledAt: patch.fulfilledAt
              ? new Date(patch.fulfilledAt)
              : null,
          }
        : {}),
    },
  });

  const mapped = rowToPending(row);
  pendingPayments.set(orderReference, mapped);
  return mapped;
}

async function generateToken(): Promise<string> {
  const env = getEnvConfig();
  if (!env.clickpesaClientId || !env.clickpesaApiKey) {
    throw new Error("ClickPesa is not configured");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(`${CLICKPESA_BASE}/generate-token`, {
    method: "POST",
    headers: {
      "client-id": env.clickpesaClientId,
      "api-key": env.clickpesaApiKey,
    },
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    token?: string;
    message?: string;
  };

  if (!res.ok || !data.token) {
    throw new Error(data.message || `ClickPesa auth failed (${res.status})`);
  }

  // Token already includes "Bearer " per ClickPesa docs
  const token = data.token.startsWith("Bearer ")
    ? data.token
    : `Bearer ${data.token}`;

  cachedToken = {
    value: token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return token;
}

async function clickpesaFetch<T>(
  path: string,
  init: RequestInit & { json?: Record<string, unknown> } = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = await generateToken();
  const env = getEnvConfig();
  const headers: Record<string, string> = {
    Authorization: token,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  let body = init.body;
  if (init.json) {
    const payload = { ...init.json };
    if (env.clickpesaChecksumKey) {
      payload.checksum = createClickPesaChecksum(
        env.clickpesaChecksumKey,
        payload
      );
    }
    body = JSON.stringify(payload);
  }

  const res = await fetch(`${CLICKPESA_BASE}${path}`, {
    ...init,
    headers,
    body,
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function previewUssdPush(params: {
  amount: number;
  orderReference: string;
  phoneNumber: string;
}) {
  return clickpesaFetch<{
    activeMethods?: Array<{
      name: string;
      status: string;
      fee?: number;
      message?: string | number;
    }>;
    sender?: {
      accountName?: string;
      accountNumber?: string;
      accountProvider?: string;
    };
    message?: string;
  }>("/payments/preview-ussd-push-request", {
    method: "POST",
    json: {
      amount: String(Math.round(params.amount)),
      currency: "TZS",
      orderReference: params.orderReference,
      phoneNumber: params.phoneNumber,
      fetchSenderDetails: true,
    },
  });
}

export async function initiateUssdPush(params: {
  amount: number;
  orderReference: string;
  phoneNumber: string;
}) {
  return clickpesaFetch<{
    id?: string;
    status?: ClickPesaPaymentStatus;
    channel?: string;
    orderReference?: string;
    collectedAmount?: string;
    collectedCurrency?: string;
    createdAt?: string;
    clientId?: string;
    message?: string;
  }>("/payments/initiate-ussd-push-request", {
    method: "POST",
    json: {
      amount: String(Math.round(params.amount)),
      currency: "TZS",
      orderReference: params.orderReference,
      phoneNumber: params.phoneNumber,
    },
  });
}

export async function queryPaymentStatus(orderReference: string) {
  return clickpesaFetch<
    Array<{
      id?: string;
      status?: ClickPesaPaymentStatus;
      paymentReference?: string;
      paymentPhoneNumber?: string;
      orderReference?: string;
      collectedAmount?: number;
      collectedCurrency?: string;
      message?: string;
      channel?: string;
    }>
  >(`/payments/${encodeURIComponent(orderReference)}`, {
    method: "GET",
  });
}

export async function pingClickPesa(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await generateToken();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "ClickPesa auth failed",
    };
  }
}
