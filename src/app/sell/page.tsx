"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { projectSchema, type ProjectFormValues } from "@/lib/validations";
import { CATEGORIES, TECHNOLOGIES, LICENSE_TYPES, LISTING_TYPES } from "@/lib/constants";
import { LicenseBadge, ListingTypeBadge } from "@/components/projects/listing-badges";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { RequireAuth } from "@/components/auth/require-auth";
import type { DemoProject } from "@/lib/demo-data";

function SellForm() {
  const addListing = useAppStore((s) => s.addListing);
  const user = useAppStore((s) => s.user);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [published, setPublished] = useState<DemoProject | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [publishError, setPublishError] = useState("");
  const isVerified = Boolean(user?.verified);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      pricingType: "PAID",
      listingType: "CAMPUS",
      license: "EDUCATIONAL",
      price: 75000,
      technologyStack: [],
      category: "WEB_APPLICATIONS",
    },
  });

  const pricingType = watch("pricingType");
  const listingType = watch("listingType");
  const license = watch("license");
  const title = watch("title");

  useEffect(() => {
    if (!isVerified && (listingType === "MARKET" || license === "COMMERCIAL")) {
      setValue("listingType", "CAMPUS", { shouldValidate: true });
      setValue("license", "EDUCATIONAL", { shouldValidate: true });
      if (pricingType === "PAID") {
        setValue("price", 75000, { shouldValidate: true });
      }
    }
  }, [isVerified, listingType, license, pricingType, setValue]);

  function toggleTech(tech: string) {
    const next = selectedTech.includes(tech)
      ? selectedTech.filter((t) => t !== tech)
      : [...selectedTech, tech];
    setSelectedTech(next);
    setValue("technologyStack", next, { shouldValidate: true });
  }

  async function generateDescription() {
    if (!title) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tech: selectedTech }),
      });
      const data = await res.json();
      if (data.description) {
        setValue("description", data.description, { shouldValidate: true });
        setValue("shortDescription", data.shortDescription || "", { shouldValidate: true });
      }
    } finally {
      setGenerating(false);
    }
  }

  async function uploadSource(file: File, slugHint: string) {
    setUploading(true);
    setUploadMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("slug", slugHint);
      form.append("kind", "source");
      const res = await fetch("/api/uploads/project", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setUploadMsg(data.error || "Upload failed");
        return null;
      }
      setSourcePath(data.path);
      setUploadMsg(
        data.demo
          ? "Stored in demo mode (add Supabase keys for real files)."
          : "Source ZIP uploaded securely."
      );
      return data.path as string;
    } catch {
      setUploadMsg("Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: ProjectFormValues, asDraft: boolean) {
    const wantsMarket =
      values.listingType === "MARKET" || values.license === "COMMERCIAL";
    if (wantsMarket && !user?.verified) {
      setPublishError(
        "Only verified sellers can list Market / commercial products. Request verification first."
      );
      return;
    }
    setPublishError("");

    let path = sourcePath;
    if (sourceFile && !path) {
      path = await uploadSource(sourceFile, values.title);
    }

    let project: DemoProject;
    try {
      project = addListing(values, {
        status: asDraft ? "DRAFT" : "PUBLISHED",
        sourceFile: path || undefined,
      });
    } catch (err) {
      setPublishError(
        err instanceof Error
          ? err.message
          : "Only verified sellers can list Market products."
      );
      return;
    }

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        status: asDraft ? "DRAFT" : "PUBLISHED",
        sourceFile: path || undefined,
        sellerEmail: user?.email,
        sellerName: user?.name,
        sellerUsername: user?.username,
        university: user?.university,
        sellerVerified: Boolean(user?.verified),
      }),
    }).catch(() => null);

    if (res && !res.ok) {
      const data = await res.json().catch(() => ({}));
      setPublishError(
        typeof data.error === "string"
          ? data.error
          : "Could not publish this listing. Try again."
      );
      return;
    }

    setPublished(project);
  }

  if (published) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>
              {published.status === "DRAFT" ? "Draft saved" : "Project listed!"}
            </CardTitle>
            <CardDescription>
              <Badge variant={published.status === "DRAFT" ? "warning" : "success"} className="mt-2">
                {published.status}
              </Badge>
              <span className="mt-3 block">
                {published.status === "DRAFT"
                  ? "Saved as draft. Publish when you are ready."
                  : "Your project is live on the marketplace and ready to buy."}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-3 sm:flex-row">
            {published.status === "PUBLISHED" && (
              <Link href={`/projects/${published.slug}`}>
                <Button>View listing</Button>
              </Link>
            )}
            <Link href="/marketplace">
              <Button variant="secondary">Marketplace</Button>
            </Link>
            <Link href="/dashboard/projects">
              <Button variant="outline">My projects</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground">Sell your project</h1>
        <p className="mt-2 text-muted">
          Upload source code, docs, and demos. Publish to the marketplace and get paid in TZS.
        </p>

        <form className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  className="mt-1.5"
                  placeholder="DarLink Campus Social Network"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateDescription}
                    disabled={generating || !title}
                  >
                    {generating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    AI generate
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe features, architecture, and what buyers get..."
                  {...register("description")}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="shortDescription">Short description</Label>
                <Input id="shortDescription" className="mt-1.5" {...register("shortDescription")} />
              </div>

              <div>
                <Label>Category</Label>
                <select
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-foreground/5 px-3 text-sm text-foreground"
                  {...register("category")}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-card text-foreground">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technology stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TECHNOLOGIES.map((tech) => (
                  <Badge
                    key={tech}
                    variant={selectedTech.includes(tech) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTech(tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
              {errors.technologyStack && (
                <p className="mt-2 text-xs text-red-400">{errors.technologyStack.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Uploads & links</CardTitle>
              <CardDescription>Screenshots, demo video, docs PDF, source ZIP, GitHub</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {["Screenshots", "Demo video", "Documentation PDF"].map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-foreground/[0.03] p-6 text-center transition hover:border-primary/40"
                  >
                    <Upload className="mb-2 h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground/80">{label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">Coming soon</span>
                    <input type="file" className="hidden" disabled />
                  </label>
                ))}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-foreground/[0.03] p-6 text-center transition hover:border-primary/40">
                  <Upload className="mb-2 h-5 w-5 text-primary" />
                  <span className="text-sm text-foreground/80">Source code ZIP</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {sourceFile ? sourceFile.name : "Required for paid delivery"}
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setSourceFile(file);
                      setSourcePath(null);
                      if (file && title) {
                        await uploadSource(file, title);
                      }
                    }}
                  />
                </label>
              </div>
              {(uploading || uploadMsg) && (
                <p className="text-xs text-muted-foreground">
                  {uploading ? "Uploading source…" : uploadMsg}
                </p>
              )}
              <div>
                <Label>Demo URL</Label>
                <Input className="mt-1.5" placeholder="https://..." {...register("demoUrl")} />
              </div>
              <div>
                <Label>GitHub repository (optional)</Label>
                <Input
                  className="mt-1.5"
                  placeholder="https://github.com/..."
                  {...register("githubRepo")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Who is this for?</CardTitle>
              <CardDescription>
                Campus = student presentation pricing. Market = real commercial
                product for companies and developers — verified sellers only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isVerified ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-950 dark:text-amber-100">
                  <p className="font-medium">Verification required for Market</p>
                  <p className="mt-1 text-xs text-amber-900/85 dark:text-amber-100/80">
                    Anyone can list Campus projects. To sell commercial / Market
                    products, get the blue-tick first.
                  </p>
                  <Link
                    href="/dashboard/verification"
                    className="mt-2 inline-block text-xs font-semibold underline"
                  >
                    Request verification
                  </Link>
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {LISTING_TYPES.map((lt) => {
                  const marketLocked = lt.value === "MARKET" && !isVerified;
                  return (
                    <button
                      key={lt.value}
                      type="button"
                      disabled={marketLocked}
                      onClick={() => {
                        if (marketLocked) return;
                        setValue("listingType", lt.value, {
                          shouldValidate: true,
                        });
                        setValue("license", lt.defaultLicense, {
                          shouldValidate: true,
                        });
                        if (pricingType === "PAID") {
                          setValue("price", lt.suggestedPrice, {
                            shouldValidate: true,
                          });
                        }
                        setPublishError("");
                      }}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        marketLocked && "cursor-not-allowed opacity-55",
                        listingType === lt.value
                          ? lt.value === "MARKET"
                            ? "border-amber-500/60 bg-amber-500/10"
                            : "border-cyan-500/50 bg-cyan-500/10"
                          : "border-border hover:bg-foreground/5"
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <ListingTypeBadge listingType={lt.value} />
                        {marketLocked ? (
                          <Badge variant="warning" className="font-normal">
                            Verified only
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {lt.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & license</CardTitle>
              <CardDescription>
                License badges tell buyers what they can legally do after
                purchase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                {(["FREE", "PAID"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setValue("pricingType", type);
                      if (type === "FREE") setValue("price", 0);
                      else if (listingType === "MARKET")
                        setValue("price", 1500000);
                      else setValue("price", 75000);
                    }}
                    className={`flex-1 rounded-xl border p-3 text-sm font-medium transition ${
                      pricingType === type
                        ? "border-primary bg-primary/20 text-foreground"
                        : "border-border text-muted hover:bg-foreground/5"
                    }`}
                  >
                    {type === "FREE" ? "Free" : "Paid"}
                  </button>
                ))}
              </div>
              {pricingType === "PAID" && (
                <div>
                  <Label>
                    Price (TZS)
                    {listingType === "MARKET"
                      ? " — commercial / company band"
                      : " — campus / student band"}
                  </Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    className="mt-1.5"
                    {...register("price")}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {listingType === "MARKET"
                      ? "Suggested Market range: TZS 500k – 5M+"
                      : "Suggested Campus range: TZS 50k – 250k"}
                  </p>
                </div>
              )}
              <div>
                <Label>License</Label>
                <div className="mt-2 space-y-2">
                  {LICENSE_TYPES.filter((lic) =>
                    listingType === "MARKET"
                      ? lic.value === "COMMERCIAL" || lic.value === "SOURCE_CODE"
                      : lic.value === "EDUCATIONAL" ||
                        lic.value === "SOURCE_CODE"
                  ).map((lic) => (
                    <label
                      key={lic.value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                        license === lic.value
                          ? lic.cardClass
                          : "border-border hover:bg-foreground/5"
                      )}
                    >
                      <input
                        type="radio"
                        value={lic.value}
                        {...register("license")}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <LicenseBadge license={lic.value} />
                          <span className="text-[11px] text-muted-foreground">
                            {lic.audience}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {lic.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {lic.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            {publishError ? (
              <p className="w-full text-sm text-destructive sm:order-first sm:basis-full">
                {publishError}{" "}
                {!isVerified ? (
                  <Link
                    href="/dashboard/verification"
                    className="font-medium underline"
                  >
                    Get verified
                  </Link>
                ) : null}
              </p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={isSubmitting || uploading}
              onClick={handleSubmit((v) => onSubmit(v, true))}
            >
              Save draft
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isSubmitting || uploading}
              onClick={handleSubmit((v) => onSubmit(v, false))}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publish to marketplace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <RequireAuth redirectTo="/sign-up">
      <SellForm />
    </RequireAuth>
  );
}
