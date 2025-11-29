import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const { status, customerRating } = body || {};
  try {
    const order = store.updateOrder(params.id, { status, customerRating });
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "update failed" }, { status: 400 });
  }
}

