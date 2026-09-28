import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-emerald-200 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Dogfood Hackathon
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-bold leading-tight text-neutral-900">
          Build something worth showing.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-neutral-600">
          The self-hosted submission and judging portal is online and ready for
          local hackathon operations.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-md bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-neutral-300 px-5 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Sign up
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-neutral-300 px-5 py-3 font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
