import { NextRequest } from "next/server";
import { store } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotel = searchParams.get("hotel");
  if (!hotel) {
    return new Response("hotel required", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const unsub = store.subscribe((evt) => {
        if (evt.hotelSlug === hotel) {
          send(evt);
        }
      });
      // heartbeat
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(": keep-alive\n\n")), 15000);
      // initial note
      send({ type: "connected", hotel });
      controller.enqueue(encoder.encode("event: open\ndata: ok\n\n"));
      controller.enqueue(encoder.encode("\n"));
      controller.enqueue(encoder.encode("\n"));
      controller.enqueue(encoder.encode("\n"));
      controller.enqueue(encoder.encode("\n"));
      controller.enqueue(encoder.encode("\n"));
      (controller as any)._unsub = () => {
        clearInterval(heartbeat);
        unsub();
      };
    },
    cancel() {
      const anyController = this as any;
      if (anyController._unsub) anyController._unsub();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

