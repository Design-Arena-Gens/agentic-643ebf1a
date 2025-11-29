"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MenuItem = { id: string; name: string; description?: string; priceCents: number; category?: string; available: boolean };
type Hotel = { slug: string; name: string; googleReviewUrl?: string };

export default function TableOrderPage({ params }: { params: { slug: string; tableId: string } }) {
  const { slug, tableId } = params;
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [cart, setCart] = useState<{ menuItemId: string; quantity: number; note?: string }[]>([]);
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/hotels/${slug}/menu`).then((r) => r.json()),
      fetch(`/api/hotels/${slug}`).then((r) => r.json())
    ]).then(([m, h]) => {
      setMenu((m.menu || []).filter((i: MenuItem) => i.available !== false));
      setHotel(h.hotel);
    });
  }, [slug]);

  const add = (id: string) => {
    setCart((c) => {
      const existing = c.find((x) => x.menuItemId === id);
      if (existing) return c.map((x) => (x.menuItemId === id ? { ...x, quantity: x.quantity + 1 } : x));
      return [...c, { menuItemId: id, quantity: 1 }];
    });
  };
  const remove = (id: string) => setCart((c) => c.filter((x) => x.menuItemId !== id));
  const setQty = (id: string, q: number) => setCart((c) => c.map((x) => (x.menuItemId === id ? { ...x, quantity: q } : x)));

  const totalCents = useMemo(
    () => cart.reduce((sum, it) => sum + (menu.find((m) => m.id === it.menuItemId)?.priceCents || 0) * it.quantity, 0),
    [cart, menu]
  );
  const toCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const placeOrder = async () => {
    setPlacing(true);
    const res = await fetch(`/api/hotels/${slug}/orders/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId, items: cart })
    });
    const data = await res.json();
    setPlacing(false);
    if (data.order) {
      setOrderId(data.order.id);
      setCart([]);
    }
  };

  const submitRating = async () => {
    if (!orderId || rating == null) return;
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerRating: rating }) });
    setThanks(true);
    if (hotel?.googleReviewUrl && rating >= 5) {
      setTimeout(() => {
        window.location.href = hotel.googleReviewUrl!;
      }, 1500);
    }
  };

  return (
    <main className="space-y-6">
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{hotel?.name || "Hotel"}</h2>
            <div className="text-sm text-slate-600">Table {tableId}</div>
          </div>
          <Link className="text-sm text-blue-700 hover:underline" href={`/dashboard/${slug}`}>
            Staff dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="bg-white rounded-lg p-5 shadow-sm md:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Menu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menu.map((m) => (
              <div key={m.id} className="border rounded-lg p-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-slate-600">{m.description}</div>
                <div className="mt-1 text-sm">{toCurrency(m.priceCents)}</div>
                <button onClick={() => add(m.id)} className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Add
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Your order</h3>
          <div className="space-y-3">
            {cart.length === 0 && <div className="text-slate-500 text-sm">Add items to your order</div>}
            {cart.map((it) => {
              const m = menu.find((x) => x.id === it.menuItemId)!;
              return (
                <div key={it.menuItemId} className="border rounded p-2">
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs">Qty</label>
                    <input
                      type="number"
                      min={1}
                      className="w-16 border rounded px-2 py-1 text-sm"
                      value={it.quantity}
                      onChange={(e) => setQty(it.menuItemId, Math.max(1, Number(e.target.value || "1")))}
                    />
                    <div className="ml-auto text-sm">{toCurrency(m.priceCents * it.quantity)}</div>
                  </div>
                  <button onClick={() => remove(it.menuItemId)} className="mt-2 text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-3 border-t pt-3 flex items-center justify-between">
            <div className="font-semibold">Total</div>
            <div>{toCurrency(totalCents)}</div>
          </div>
          <button disabled={cart.length === 0 || placing} onClick={placeOrder} className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {placing ? "Placing..." : "Place order"}
          </button>
          {orderId && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm">
              Your order has been placed. Order ID: <span className="font-mono">{orderId}</span>
            </div>
          )}
        </section>
      </div>

      {orderId && (
        <section className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Rate your experience</h3>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                className={`w-10 h-10 rounded-full border ${rating === s ? "bg-yellow-400" : "bg-white hover:bg-yellow-50"}`}
                onClick={() => setRating(s)}
              >
                {s}?
              </button>
            ))}
          </div>
          <button onClick={submitRating} disabled={rating == null} className="mt-3 bg-slate-800 text-white px-4 py-2 rounded disabled:opacity-50">
            Submit rating
          </button>
          {thanks && <div className="text-sm text-green-700 mt-2">Thanks for your feedback!</div>}
        </section>
      )}
    </main>
  );
}

