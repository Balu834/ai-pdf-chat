import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/admin-client";
import crypto from "crypto";
import { createClient } from "@/lib/supabase-server-client";
import { addCredits } from "@/lib/credits";
import { CREDIT_PACKS } from "@/lib/credit-packs";


export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      pack_id,
      user_id: bodyUserId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // Verify HMAC signature
    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const pack = CREDIT_PACKS.find((p) => p.id === pack_id);
    if (!pack) return NextResponse.json({ error: "Invalid pack" }, { status: 400 });

    // Resolve user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userId = user?.id ?? null;

    if (!userId && bodyUserId) {
      const { data: adminUser } = await getAdminClient().auth.getAdminClient().getUserById(bodyUserId);
      userId = adminUser?.user?.id ?? null;
    }
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Idempotency
    const { data: existing } = await adminDb
      .from("payments")
      .select("payment_id")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existing) {
      const credits = await import("@/lib/credits").then((m) => m.getCredits(userId));
      return NextResponse.json({ success: true, balance: credits.balance });
    }

    // Add credits
    await addCredits(userId, pack.credits, "purchase", `${pack.label} — ${pack.credits} credits`);

    // Record payment
    await getAdminClient().from("payments").upsert(
      {
        user_id:    userId,
        payment_id: razorpay_payment_id,
        order_id:   razorpay_order_id,
        amount:     pack.paise,
        status:     "captured",
      },
      { onConflict: "payment_id", ignoreDuplicates: true }
    ).catch((e) => console.warn("[verify-credits] ledger write failed:", e.message));

    const { getCredits } = await import("@/lib/credits");
    const updated = await getCredits(userId);

    console.log(`[verify-credits] ✅ User ${userId} purchased ${pack.credits} credits — new balance: ${updated.balance}`);

    return NextResponse.json({ success: true, credits_added: pack.credits, balance: updated.balance });
  } catch (err) {
    console.error("[verify-credits]", err);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}
