"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

export default function PurchasesPage() {
  const purchases = useAppStore((s) => s.purchases);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchased projects</h1>
        <p className="text-muted">Download source files and documentation securely.</p>
      </div>

      {purchases.length === 0 ? (
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
                </div>
                <Button
                  onClick={async () => {
                    const res = await fetch(`/api/downloads/${p.projectId}`);
                    const data = await res.json();
                    if (data.url) window.open(data.url, "_blank");
                    else
                      alert(
                        "Demo download ready — token: " + (data.token || "ok")
                      );
                  }}
                >
                  <Download className="h-4 w-4" />
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
