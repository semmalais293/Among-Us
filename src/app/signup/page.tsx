"use client";

import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [name, setName] = useState("New Participant");
  const [email, setEmail] = useState("new@dogfood.local");
  const [password, setPassword] = useState("StrongPass123!");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const payload = await response.json();
    setMessage(
      response.ok
        ? "Account created successfully."
        : payload.error ?? "Signup failed."
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-neutral-900">Sign up</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-medium text-white"
          >
            Create account
          </button>
          {message ? (
            <p className="text-sm text-neutral-700">{message}</p>
          ) : null}
        </div>
      </form>
    </main>
  );
}
