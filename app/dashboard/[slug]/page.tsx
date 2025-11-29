"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type MenuItem = { id: string; name: string; description?: string; priceCents: number; category?: string; available: boolean };
type Table = { id: string; name: string; qrUrl: string };
type Order = { id: string; tableId: string; items: { menuItemId: string; quantity: number; note?: string }[]; status: string; createdAt: number };

export default function DashboardPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ available: true });
  const [newTable, setNewTable] = useState<Partial<Table>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAll = async () => {
    const [m, t, o] = await Promise.all([
      fetch(`/api/hotels/${slug}/menu`).then((r) => r.json()),
      fetch(`/api/hotels/${slug}/tables`).then((r) => r.json()),
      fetch(`/api/hotels/${slug}/orders`).then((r) => r.json())
    ]);
    setMenu(m.menu || []);
    setTables(t.tables || []);
    setOrders(o.orders || []);
  };

  useEffect(() => {
    fetchAll();
    const es = new EventSource(`/api/stream?hotel=${encodeURIComponent(slug)}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data?.type === "order:new") {
          setOrders((prev) => [data.order, ...prev]);
          if (audioRef.current) audioRef.current.play().catch(() => {});
        }
        if (data?.type === "order:update") {
          setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        }
      } catch {}
    };
    return () => es.close();
  }, [slug]);

  const addMenuItem = async () => {
    const res = await fetch(`/api/hotels/${slug}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, priceCents: Number(newItem.priceCents || 0) })
    });
    const data = await res.json();
    if (data.item) {
      setMenu((m) => [data.item, ...m]);
      setNewItem({ available: true });
    }
  };
  const deleteMenuItem = async (id: string) => {
    await fetch(`/api/hotels/${slug}/menu?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMenu((m) => m.filter((i) => i.id !== id));
  };

  const addTable = async () => {
    if (!newTable.id || !newTable.name) return;
    const res = await fetch(`/api/hotels/${slug}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newTable.id, name: newTable.name })
    });
    const data = await res.json();
    if (data.table) {
      setTables((t) => [data.table, ...t]);
      setNewTable({});
    }
  };
  const deleteTable = async (id: string) => {
    await fetch(`/api/hotels/${slug}/tables?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setTables((t) => t.filter((tb) => tb.id !== id));
  };

  const toCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const qrFor = async (url: string) => {
    const abs = `${window.location.origin}${url}`;
    return await QRCode.toDataURL(abs, { width: 240 });
  };

  const groupedOrders = useMemo(() => {
    const byStatus: Record<string, Order[]> = {};
    for (const o of orders) {
      byStatus[o.status] = byStatus[o.status] || [];
      byStatus[o.status].push(o);
    }
    return byStatus;
  }, [orders]);

  const updateOrder = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  };

  return (
    <main className="space-y-6">
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2022/10/09/audio_6bff3b2b6a.mp3?filename=notification-117723.mp3" preload="auto" />
      <div className="bg-white rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Orders</h2>
          <Link href={`/h/${slug}/table/T1`} className="text-sm text-blue-700 hover:underline">
            Open sample customer view
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {["new", "accepted", "preparing", "ready", "served", "paid", "cancelled"].map((status) => (
            <div key={status} className="border rounded-lg p-3">
              <div className="font-medium capitalize mb-2">{status}</div>
              <div className="space-y-2">
                {(groupedOrders[status] || []).map((o) => (
                  <div key={o.id} className="border rounded p-2">
                    <div className="text-sm text-slate-600">Table {o.tableId}</div>
                    <ul className="text-sm list-disc pl-4 my-1">
                      {o.items.map((it, idx) => (
                        <li key={idx}>
                          {it.quantity} ? {menu.find((m) => m.id === it.menuItemId)?.name || it.menuItemId}
                          {it.note ? ` ? ${it.note}` : ""}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["accepted", "preparing", "ready", "served", "paid", "cancelled"].map((s) => (
                        <button key={s} onClick={() => updateOrder(o.id, s)} className="text-xs border rounded px-2 py-1 hover:bg-slate-50">
                          Mark {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input placeholder="Name" className="border rounded px-3 py-2" value={newItem.name || ""} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
            <input placeholder="Category" className="border rounded px-3 py-2" value={newItem.category || ""} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
            <input placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" value={newItem.description || ""} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
            <input
              placeholder="Price (USD)"
              className="border rounded px-3 py-2"
              type="number"
              value={newItem.priceCents != null ? String(Number(newItem.priceCents) / 100) : ""}
              onChange={(e) => setNewItem({ ...newItem, priceCents: Math.round(Number(e.target.value || "0") * 100) })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newItem.available ?? true} onChange={(e) => setNewItem({ ...newItem, available: e.target.checked })} /> Available
            </label>
          </div>
          <button onClick={addMenuItem} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-black">
            Add item
          </button>
          <ul className="divide-y mt-4">
            {menu.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-slate-500">
                    {m.category || "Uncategorized"} ? {toCurrency(m.priceCents)} ? {m.available ? "Available" : "Unavailable"}
                  </div>
                </div>
                <button onClick={() => deleteMenuItem(m.id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-lg p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Tables & QR codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input placeholder="Table ID (e.g., T1)" className="border rounded px-3 py-2" value={newTable.id || ""} onChange={(e) => setNewTable({ ...newTable, id: e.target.value })} />
            <input placeholder="Display name" className="border rounded px-3 py-2 md:col-span-2" value={newTable.name || ""} onChange={(e) => setNewTable({ ...newTable, name: e.target.value })} />
          </div>
          <button onClick={addTable} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-black">
            Add table
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {tables.map((t) => (
              <div key={t.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {t.name} ({t.id})
                  </div>
                  <button onClick={() => deleteTable(t.id)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
                <div className="text-xs text-slate-500 mt-1 break-all">{`${typeof window !== "undefined" ? window.location.origin : ""}${t.qrUrl}`}</div>
                <QRPreview url={t.qrUrl} make={qrFor} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function QRPreview({ url, make }: { url: string; make: (u: string) => Promise<string> }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    make(url).then(setSrc);
  }, [url]);
  return src ? (
    <div className="mt-2 flex items-center gap-3">
      <img src={src} alt="QR" className="w-40 h-40 border rounded" />
      <a className="text-blue-700 hover:underline" download={`qr-${url.split("/").pop()}.png`} href={src}>
        Download
      </a>
    </div>
  ) : null;
}

