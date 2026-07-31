import { NextResponse } from "next/server";
import { demoProjects } from "@/lib/demo-data";
import { createCheckoutSession } from "@/lib/stripe";
import { checkUniversityExclusivityForEmail } from "@/lib/university-exclusivity";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, slug, affiliateCode, email } = body;

    const project =
      demoProjects.find((p) => p.id === projectId) ||
      demoProjects.find((p) => p.slug === slug);

    // User-listed projects live in the client store — always allow demo checkout
    if (!project) {
      return NextResponse.json({
        url: null,
        demo: true,
        message: "Use demo checkout for this listing",
      });
    }

    if (project.price === 0) {
      return NextResponse.json({
        url: null,
        free: true,
        demo: true,
        message: "Free project — claim from checkout",
      });
    }

    const buyerEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (buyerEmail) {
      const lock = await checkUniversityExclusivityForEmail({
        email: buyerEmail,
        projectId: project.id,
        slug: project.slug,
        university:
          typeof body.university === "string" ? body.university : undefined,
      });
      if (!lock.allowed) {
        return NextResponse.json(
          {
            url: null,
            error: lock.message,
            code: lock.code,
            lockedUntil: "lockedUntil" in lock ? lock.lockedUntil : undefined,
          },
          { status: 409 }
        );
      }
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: null,
        demo: true,
        message: "Stripe not configured — use demo checkout",
      });
    }

    const origin = new URL(req.url).origin;
    const session = await createCheckoutSession({
      projectId: project.id,
      projectTitle: project.title,
      amount: project.price,
      buyerEmail: buyerEmail || "buyer@example.com",
      successUrl: `${origin}/checkout?project=${project.slug}&success=1`,
      cancelUrl: `${origin}/projects/${project.slug}`,
      affiliateCode,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      url: null,
      demo: true,
      error: "Checkout failed — use demo checkout",
    });
  }
}
