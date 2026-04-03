import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server-client";
import { getStripe } from "@/lib/stripe";
import { getUserPlan } from "@/lib/user-plan";

export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { stripe_customer_id } = await getUserPlan(user.id);
  if (!stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
