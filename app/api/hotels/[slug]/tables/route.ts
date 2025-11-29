import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const hotel = store.getHotel(params.slug);
  if (!hotel) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ tables: hotel.tables });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const body = await req.json().catch(() => ({}));
  const table = store.upsertTable(params.slug, body);
  return NextResponse.json({ table });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  store.deleteTable(params.slug, id);
  return NextResponse.json({ ok: true });
}

