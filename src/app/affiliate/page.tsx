"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AFFILIATE_COMMISSION_PERCENT } from "@/lib/constants";

export default function AffiliatePage() {
  const code = "4WARD-ALEX10";
  const link = `https://4ward.com/marketplace?ref=${code}`;
  const [copied, setCopied] = useState(false);

  return (
    <div className="gradient-mesh min-h-screen px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Affiliate program</h1>
          <p className="mt-3 text-muted">
            Earn {AFFILIATE_COMMISSION_PERCENT}% commission by referring buyers to 4ward projects.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your referral link</CardTitle>
            <CardDescription>Share with classmates, Discord, and LinkedIn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input readOnly value={link} />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Code: <span className="font-mono text-primary">{code}</span>
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-foreground/5 p-4 text-center">
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
              <div className="rounded-xl bg-foreground/5 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">$186</p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
