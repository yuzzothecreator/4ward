-- Durable ClickPesa pending payment orders
CREATE TABLE IF NOT EXISTS "PendingPayment" (
    "id" TEXT NOT NULL,
    "orderReference" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "channel" TEXT,
    "clickpesaId" TEXT,
    "message" TEXT,
    "collectedAmount" DOUBLE PRECISION,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PendingPayment_orderReference_key" ON "PendingPayment"("orderReference");
CREATE INDEX IF NOT EXISTS "PendingPayment_status_idx" ON "PendingPayment"("status");
CREATE INDEX IF NOT EXISTS "PendingPayment_buyerEmail_idx" ON "PendingPayment"("buyerEmail");
CREATE INDEX IF NOT EXISTS "PendingPayment_createdAt_idx" ON "PendingPayment"("createdAt");
