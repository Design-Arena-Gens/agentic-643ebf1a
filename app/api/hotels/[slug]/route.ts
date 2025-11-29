import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const hotel = store.getHotel(params.slug);
  if (!hotel) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ hotel });
}

