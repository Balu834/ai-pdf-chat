import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { upsertUserPlan, getUserIdByCustomer } from "@/lib/user-plan";

export const config = { api: { bodyParser: false } };

async function resolveUserId(session) {
  const fromMeta = session.metadata?.supabase_user_id
    || session.subscription_data?.metadata?.supabase_user_id;
  if (fromMeta) return fromMeta;
  if (session.customer) return getUserIdByCustomer(session.customer);
  return null;
}

export async function POST(req) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;
        const userId = await resolveUserId(session);
        if (!userId) break;
        await upsertUserPlan(userId, {
          plan: "pro",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if (invoice.billing_reason === "subscription_create") break;
        const userId = await getUserIdByCustomer(invoice.customer);
        if (!userId) break;
        await upsertUserPlan(userId, { plan: "pro" });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const userId = await getUserIdByCustomer(invoice.customer);
        if (!userId) break;
        await upsertUserPlan(userId, { plan: "free" });
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const sub = event.data.object;
        const userId = await getUserIdByCustomer(sub.customer);
        if (!userId) break;
        await upsertUserPlan(userId, { plan: "free", stripe_subscription_id: null });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = await getUserIdByCustomer(sub.customer);
        if (!userId) break;
        const active = ["active", "trialing"].includes(sub.status);
        await upsertUserPlan(userId, { plan: active ? "pro" : "free" });
        break;
      }
    }
  } catch (err) {
    console.error("[WEBHOOK] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
