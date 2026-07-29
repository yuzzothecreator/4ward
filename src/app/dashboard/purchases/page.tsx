"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAppStore, type PurchaseRecord } from "@/store/use-app-store";

export default function PurchasesPage() {
  const user = useAppStore((s) => s.user);
  const localPurchases = useAppStore((s) => s.purchases);
  const [serverPurchases, setServerPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    fetch(`/api/purchases?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.purchases)) {
          setServerPurchases(
            data.purchases.map(
              (p: PurchaseRecord & { downloadToken?: string }) => ({
                id: p.id,
                projectId: p.projectId,
                slug: p.slug,
                title: p.title,
                coverImage: p.coverImage,
                price: p.price,
                sellerName: p.sellerName,
                purchasedAt: p.purchasedAt,
                downloadToken: p.downloadToken,
              })
            )
          );
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user?.email]);

  const byProject = new Map<string, PurchaseRecord>();
  for (const p of localPurchases) byProject.set(p.projectId, p);
  for (const p of serverPurchases) {
    const existing = byProject.get(p.projectId);
    byProject.set(p.projectId, {
      ...existing,
      ...p,
      downloadToken: p.downloadToken || existing?.downloadToken,
    });
  }
  const purchases = Array.from(byProject.values()).sort(
    (a, b) =>
      new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );

  async function handleDownload(p: PurchaseRecord) {
    if (!p.downloadToken) {
      setMessage(
        "This purchase has no download token yet. Complete payment via ClickPesa so the order can be fulfilled."
      );
      return;
    }
    setDownloadingId(p.id);
    setMessage("");
    try {
      const res = await fetch(
        `/api/downloads/${encodeURIComponent(p.id)}?token=${encodeURIComponent(p.downloadToken)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Download denied");
        return;
      }
      if (data.url) {
        window.open(data.url, "_blank");
        setMessage("Secure download started.");
      } else {
        setMessage(
          data.message ||
            "Entitlement verified. Upload the source ZIP (and configure Supabase Storage) to deliver the file."
        );
      }
    } catch {
      setMessage("Download request failed");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchased projects</h1>
        <p className="text-muted">
          Paid orders are saved to the database. Downloads require your entitlement token.
        </p>
      </div>

      {message && (
        <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted">
          {message}
        </p>
      )}

      {loading && purchases.length === 0 ? (
        <p className="text-sm text-muted">Loading purchases…</p>
      ) : purchases.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <p className="text-muted">No purchases yet.</p>
            <Link href="/marketplace">
              <Button>Browse marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    by {p.sellerName} · {formatPrice(p.price)} ·{" "}
                    {new Date(p.purchasedAt).toLocaleDateString()}
                  </p>
                  {p.downloadToken ? (
                    <Badge variant="secondary" className="mt-2">
                      Entitled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2">
                      Local only
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => handleDownload(p)}
                  disabled={downloadingId === p.id}
                >
                  {downloadingId === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
