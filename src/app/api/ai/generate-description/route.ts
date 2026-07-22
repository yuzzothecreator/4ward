import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, tech = [] } = await req.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const stack = Array.isArray(tech) && tech.length ? tech.join(", ") : "modern web technologies";

  const shortDescription = `${title} — a production-ready student project built with ${stack}.`;

  const description = `${title} is a complete, presentation-ready digital product designed for real-world use.

What's included:
• Full source code with clean architecture and comments
• Setup documentation and environment guide
• Screenshots / demo assets for portfolio use
• Technology stack: ${stack}

Ideal for students, startups, and developers who need a battle-tested foundation. Built following best practices for security, performance, and maintainability.

Purchase unlocks instant download of source files and documentation under your selected license.`;

  return NextResponse.json({ description, shortDescription });
}
