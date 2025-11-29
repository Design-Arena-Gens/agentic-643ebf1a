import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ hotels: store.listHotels() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, slug, googleReviewUrl } = body || {};
  if (!name || !slug) {
    return NextResponse.json({ error: "name and slug are required" }, { status: 400 });
  }
  if (store.getHotel(slug)) {
    return NextResponse.json({ hotel: store.getHotel(slug) });
  }
  const hotel = store.createHotel({ name, slug, googleReviewUrl });
  return NextResponse.json({ hotel });
}

