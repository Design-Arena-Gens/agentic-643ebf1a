import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  return NextResponse.json({ orders: store.listOrders(params.slug) });
}
