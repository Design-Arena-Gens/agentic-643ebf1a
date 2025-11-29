import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <section className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Get started</h2>
        <p className="text-slate-600 mb-4">
          Create a new hotel to manage menus, tables, and receive live orders.
        </p>
        <Link
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          href="/setup"
        >
          Create or open a hotel
        </Link>
      </section>
      <section className="bg-white rounded-lg p-5 shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Test a customer flow</h2>
        <p className="text-slate-600">
          Use a sample hotel and table to place a demo order.
        </p>
        <div className="mt-3">
          <Link
            className="inline-block border border-slate-300 px-4 py-2 rounded hover:bg-slate-50"
            href="/h/demo-hotel/table/T1"
          >
            Open sample table T1
          </Link>
        </div>
      </section>
    </main>
  );
}
