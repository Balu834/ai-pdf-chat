import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { upsertUserPlan, getUserIdByCustomer } from "@/lib/user-plan";

export const config = { api: { bodyParser: false } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveUserId(session) {
  const fromMeta =
    session.metadata?.supabase_user_id ||
    session.subscription_data?.metadata?.supabase_user_id;
  if (fromMeta) return fromMeta;
  if (session.customer) return getUserIdByCustomer(session.customer);
  return null;
}

/** Convert a Stripe Unix timestamp (seconds) to an ISO string. */
function toISO(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  const stripe = getStripe();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  console.log("[STRIPE WEBHOOK] Event:", event.type);

  try {
    switch (event.type) {

      // ── New subscription created via Checkout ──────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;

        const userId = await resolveUserId(session);
        if (!userId) {
          console.warn("[STRIPE WEBHOOK] checkout.session.completed — no userId in metadata");
          break;
        }

        // Use the expanded subscription if checkout was created with expand:["subscription"],
        // otherwise fall back to a separate retrieve call.
        let proExpiresAt = null;
        try {
          const sub = typeof session.subscription === "object"
            ? session.subscription                                         // already expanded
            : await stripe.subscriptions.retrieve(session.subscription);  // need to fetch
          proExpiresAt = toISO(sub.current_period_end);
        } catch (err) {
          console.warn("[STRIPE WEBHOOK] Could not get subscription period:", err.message);
          proExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        await upsertUserPlan(userId, {
          plan:                  "pro",
          subscription_status:   "active",
          pro_expires_at:        proExpiresAt,
          grace_until:           null,
          stripe_customer_id:    session.customer,
          stripe_subscription_id: session.subscription,
        });
        console.log(`[STRIPE WEBHOOK] ✅ User ${userId} upgraded to Pro — expires ${proExpiresAt}`);
        break;
      }

      // ── Subscription renewed (recurring payment) ──────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        // Skip the initial creation — checkout.session.completed handles that
        if (invoice.billing_reason === "subscription_create") break;

        const userId = await getUserIdByCustomer(invoice.customer);
        if (!userId) break;

        // invoice.lines.data[0].period.end is the new period end
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        const proExpiresAt = periodEnd
          ? toISO(periodEnd)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await upsertUserPlan(userId, {
          plan:                "pro",
          subscription_status: "active",
          pro_expires_at:      proExpiresAt,
          grace_until:         null,  // clear any lingering grace period
        });
        console.log(`[STRIPE WEBHOOK] ✅ Renewal for user ${userId} — expires ${proExpiresAt}`);
        break;
      }

      // ── Payment failed — 3-day grace, do NOT immediately downgrade ─────────
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const userId = await getUserIdByCustomer(invoice.customer);
        if (!userId) break;

        const graceUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        await upsertUserPlan(userId, {
          subscription_status: "past_due",
          grace_until:         graceUntil,
        });
        console.warn(`[STRIPE WEBHOOK] ⚠️ Payment failed for user ${userId} — grace until ${graceUntil}`);
        break;
      }

      // ── Subscription cancelled or paused ──────────────────────────────────
      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const sub = event.data.object;
        const userId = await getUserIdByCustomer(sub.customer);
        if (!userId) break;

        await upsertUserPlan(userId, {
          plan:                  "free",
          subscription_status:   event.type === "customer.subscription.paused" ? "halted" : "cancelled",
          pro_expires_at:        null,
          grace_until:           null,
          stripe_subscription_id: null,
        });
        console.log(`[STRIPE WEBHOOK] User ${userId} downgraded — ${event.type}`);
        break;
      }

      // ── Subscription status changed (upgrade, downgrade, reactivation) ────
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const userId = await getUserIdByCustomer(sub.customer);
        if (!userId) break;

        const isActive = ["active", "trialing"].includes(sub.status);
        const proExpiresAt = isActive ? toISO(sub.current_period_end) : null;

        await upsertUserPlan(userId, {
          plan:                isActive ? "pro" : "free",
          subscription_status: isActive ? "active" : sub.status,
          pro_expires_at:      proExpiresAt,
          grace_until:         isActive ? null : undefined, // clear grace on reactivation
        });
        console.log(`[STRIPE WEBHOOK] Subscription updated for user ${userId} — status: ${sub.status}`);
        break;
      }

      default:
        // Unhandled event type — not an error, just ignore
        break;
    }
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
