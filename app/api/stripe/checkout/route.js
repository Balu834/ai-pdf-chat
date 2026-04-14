import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getStripe } from "@/lib/stripe";
import { getUserPlan, upsertUserPlan } from "@/lib/user-plan";

export async function POST() {
  try {
    // ── Validate env vars ─────────────────────────────────────
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[checkout] STRIPE_SECRET_KEY is missing");
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }
    if (!process.env.STRIPE_PRO_PRICE_ID) {
      console.error("[checkout] STRIPE_PRO_PRICE_ID is missing");
      return NextResponse.json({ error: "Stripe price not configured" }, { status: 503 });
    }

    // ── Auth ──────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[checkout] User:", user.id);

    // ── Check existing plan ───────────────────────────────────
    let customerId = null;
    try {
      const { plan, stripe_customer_id } = await getUserPlan(user.id);
      if (plan === "pro") {
        return NextResponse.json({ error: "Already on Pro plan." }, { status: 400 });
      }
      customerId = stripe_customer_id;
    } catch {
      // user_plans table may not exist yet — continue without it
      console.warn("[checkout] getUserPlan failed, continuing without plan check");
    }

    // ── Create / reuse Stripe customer ────────────────────────
    const stripe = getStripe();

    if (!customerId) {
      try {
        const existing = await stripe.customers.list({ email: user.email, limit: 1 });
        customerId = existing.data[0]?.id ?? null;
      } catch {
        console.warn("[checkout] customer lookup failed");
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      try {
        await upsertUserPlan(user.id, { stripe_customer_id: customerId });
      } catch {
        console.warn("[checkout] upsertUserPlan failed (non-fatal)");
      }
    }

    // ── Create checkout session ───────────────────────────────
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://intellixy.vercel.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/dashboard`,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
    });

    console.log("[checkout] Session created:", session.id);
    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("[checkout] Error:", err.message);
    return NextResponse.json({ error: err.message || "Checkout failed" }, { status: 500 });
  }
}
