"use client";

import { useState } from "react";
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
import { CATEGORIES, TECHNOLOGIES, LICENSE_TYPES } from "@/lib/constants";

export default function SellPage() {
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "PENDING_REVIEW">("DRAFT");

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
      license: "SOURCE_CODE",
      price: 75000,
      technologyStack: [],
      category: "WEB_APPLICATIONS",
    },
  });

  const pricingType = watch("pricingType");
  const title = watch("title");

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

  async function onSubmit(values: ProjectFormValues, asDraft: boolean) {
    setStatus(asDraft ? "DRAFT" : "PENDING_REVIEW");
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, status: asDraft ? "DRAFT" : "PENDING_REVIEW" }),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="gradient-mesh flex min-h-[70vh] items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Project submitted!</CardTitle>
            <CardDescription>
              Status: <Badge variant="warning">{status.replace("_", " ")}</Badge>
              <br />
              {status === "PENDING_REVIEW"
                ? "Our team will review your project before publishing."
                : "Saved as draft. You can submit for review anytime."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3">
            <Button onClick={() => (window.location.href = "/dashboard/projects")}>
              Go to projects
            </Button>
            <Button variant="secondary" onClick={() => setSubmitted(false)}>
              List another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="gradient-mesh min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground">Sell your project</h1>
        <p className="mt-2 text-muted">
          Upload source code, docs, and demos. Monetize after your presentation.
        </p>

        <form className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" className="mt-1.5" placeholder="CampusConnect Social Network" {...register("title")} />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={generateDescription} disabled={generating || !title}>
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    AI generate
                  </Button>
                </div>
                <Textarea id="description" placeholder="Describe features, architecture, and what buyers get..." {...register("description")} />
                {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
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
                {["Screenshots", "Demo video", "Documentation PDF", "Source code ZIP"].map((label) => (
                  <label
                    key={label}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-foreground/[0.03] p-6 text-center transition hover:border-primary/40"
                  >
                    <Upload className="mb-2 h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground/80">{label}</span>
                    <span className="mt-1 text-xs text-muted-foreground">Click to upload</span>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
              <div>
                <Label>Demo URL</Label>
                <Input className="mt-1.5" placeholder="https://..." {...register("demoUrl")} />
              </div>
              <div>
                <Label>GitHub repository (optional)</Label>
                <Input className="mt-1.5" placeholder="https://github.com/..." {...register("githubRepo")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & license</CardTitle>
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
                  <Label>Price (TZS)</Label>
                  <Input type="number" step="1" min="1" className="mt-1.5" {...register("price")} />
                </div>
              )}
              <div>
                <Label>License</Label>
                <div className="mt-2 space-y-2">
                  {LICENSE_TYPES.map((lic) => (
                    <label
                      key={lic.value}
                      className="flex cursor-pointer gap-3 rounded-xl border border-border p-3 hover:bg-foreground/5"
                    >
                      <input type="radio" value={lic.value} {...register("license")} className="mt-1" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{lic.label}</p>
                        <p className="text-xs text-muted-foreground">{lic.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, true))}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((v) => onSubmit(v, false))}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit for review
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
