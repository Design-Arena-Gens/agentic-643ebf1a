import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => ({}));
  const { tableId, items } = body || {};
  if (!tableId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "tableId and items required" }, { status: 400 });
  }
  const order = store.createOrder(params.slug, String(tableId), items);
  return NextResponse.json({ order });
}

