"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Hotel = { slug: string; name: string };

export default function SetupPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => setHotels(d.hotels || []));
  }, []);

  const create = async () => {
    const res = await fetch("/api/hotels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, googleReviewUrl })
    });
    const data = await res.json();
    if (data.hotel) {
      window.location.href = `/dashboard/${data.hotel.slug}`;
    }
  };

  return (
    <main className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <section className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Create a new hotel</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Hotel name</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Slug (used in URLs)</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium">Google Review URL (optional)</label>
            <input className="mt-1 w-full border rounded px-3 py-2" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} />
          </div>
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create hotel
          </button>
        </div>
      </section>

      <section className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Open existing hotel</h2>
        <ul className="divide-y">
          {hotels.map((h) => (
            <li key={h.slug} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-slate-500">{h.slug}</div>
              </div>
              <Link className="text-blue-700 hover:underline" href={`/dashboard/${h.slug}`}>
                Open dashboard
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
