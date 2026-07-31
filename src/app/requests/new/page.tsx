"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/use-app-store";
import { categoryLabel } from "@/lib/utils";
import { RequireAuth } from "@/components/auth/require-auth";
import { UniversitySelect } from "@/components/university-select";
import { canonicalizeInstitution } from "@/lib/tanzania-institutions";

const CATEGORIES = [
  "WEB_APPLICATIONS",
  "MOBILE_APPLICATIONS",
  "ARTIFICIAL_INTELLIGENCE",
  "CYBERSECURITY",
  "IOT",
  "BLOCKCHAIN",
  "DATA_SCIENCE",
  "DATABASE_SYSTEMS",
  "UI_UX_DESIGNS",
] as const;

function NewRequestForm() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("WEB_APPLICATIONS");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [university, setUniversity] = useState(user?.university || "");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user?.email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: user.email,
          title,
          description,
          category,
          budgetMin: budgetMin || null,
          budgetMax: budgetMax || null,
          university:
            canonicalizeInstitution(university) ||
            university ||
            user.university ||
            null,
          deadline: deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post request");
        return;
      }
      router.push(`/requests/${data.request.id}`);
    } catch {
      setError("Network error posting request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/requests" className="text-sm text-muted hover:text-foreground">
          ← Back to requests
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">Post a request</h1>
        <p className="mt-1 text-sm text-muted">
          Describe the project you need. Developers will send offers you can accept.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project need</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-1.5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hostel fee tracker for UDSM students"
                required
                minLength={8}
                maxLength={140}
              />
            </div>
            <div>
              <Label htmlFor="description">What do you need?</Label>
              <Textarea
                id="description"
                className="mt-1.5 min-h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Features, tech preferences, presentation deadline, anything developers should know…"
                required
                minLength={40}
                maxLength={4000}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof CATEGORIES)[number])
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="budgetMin">Budget min (TZS)</Label>
                <Input
                  id="budgetMin"
                  className="mt-1.5"
                  type="number"
                  min={0}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="budgetMax">Budget max (TZS)</Label>
                <Input
                  id="budgetMax"
                  className="mt-1.5"
                  type="number"
                  min={0}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="university">University / institute</Label>
                <div className="mt-1.5">
                  <UniversitySelect
                    id="university"
                    value={university}
                    onChange={setUniversity}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Needed by</Label>
                <Input
                  id="deadline"
                  className="mt-1.5"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewRequestPage() {
  return (
    <RequireAuth redirectTo="/sign-in">
      <NewRequestForm />
    </RequireAuth>
  );
}
