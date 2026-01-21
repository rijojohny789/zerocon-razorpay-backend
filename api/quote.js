const PRICES = {
  STUDENT_CONF: 1500,
  WORKING_CONF: 2000,
  STUDENT_STAY: 4000,
  WORKING_STAY: 4500,
};

const COUPONS = {
  ZERO10: { pct: 10, cap: 1000 },
  ZERO20: { pct: 20, cap: 2000 },
};

function toInt(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.trunc(x) : 0;
}

function calcSubtotal(items) {
  let subtotal = 0;
  for (const [key, qtyRaw] of Object.entries(items)) {
    const qty = toInt(qtyRaw);
    if (qty < 0 || qty > 50) throw new Error("Invalid quantity");
    if (qty === 0) continue;
    if (!PRICES[key]) throw new Error("Invalid ticket type");
    subtotal += PRICES[key] * qty;
  }
  return subtotal;
}

function applyCoupon(subtotal, codeRaw) {
  const code = (codeRaw || "").trim().toUpperCase();
  if (!code) return { code: "", pct: 0, cap: 0, discount: 0, message: "" };

  const coupon = COUPONS[code];
  if (!coupon) return { code, pct: 0, cap: 0, discount: 0, message: "Invalid coupon code" };

  const rawDiscount = Math.round(subtotal * (coupon.pct / 100));
  const discount = Math.min(rawDiscount, coupon.cap);

  return {
    code,
    pct: coupon.pct,
    cap: coupon.cap,
    discount,
    message: `Applied ${code}: ${coupon.pct}% off (max ₹${coupon.cap})`,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { items, couponCode } = req.body || {};
    if (!items || typeof items !== "object") throw new Error("Missing items");

    const subtotal = calcSubtotal(items);
    if (subtotal <= 0) throw new Error("Please select at least one pass");

    const coupon = applyCoupon(subtotal, couponCode);
    const total = subtotal - coupon.discount;

    return res.status(200).json({
      subtotal,
      discount: coupon.discount,
      total,
      coupon: {
        code: coupon.code,
        pct: coupon.pct,
        cap: coupon.cap,
        message: coupon.message,
      },
    });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Quote failed" });
  }
}
