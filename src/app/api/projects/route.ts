import { NextResponse } from "next/server";
import { projectSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

// In-memory store for demo when DB is unavailable
const drafts: Record<string, unknown>[] = [];

export async function GET() {
  return NextResponse.json({ projects: drafts, count: drafts.length });
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "anon";
    const limited = rateLimit(`projects:${ip}`, 20, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const project = {
      id: `proj_${Date.now()}`,
      ...parsed.data,
      slug: slugify(parsed.data.title),
      status: body.status || "DRAFT",
      createdAt: new Date().toISOString(),
    };

    drafts.push(project);

    // Rate-limit friendly response + audit-style log
    console.info("[audit] project.create", {
      title: project.title,
      status: project.status,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
