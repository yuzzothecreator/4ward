"use client";

import { demoProjects } from "@/lib/demo-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  const purchases = demoProjects.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Purchased projects</h1>
        <p className="text-muted">Download source files and documentation securely.</p>
      </div>
      <div className="space-y-4">
        {purchases.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/projects/${p.slug}`} className="font-medium text-foreground hover:text-primary">
                  {p.title}
                </Link>
                <p className="text-xs text-muted-foreground">by {p.seller.name}</p>
              </div>
              <Button
                onClick={async () => {
                  const res = await fetch(`/api/downloads/${p.id}`);
                  const data = await res.json();
                  if (data.url) window.open(data.url, "_blank");
                  else alert("Demo mode: download token generated — " + (data.token || "ok"));
                }}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
