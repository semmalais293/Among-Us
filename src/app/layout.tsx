import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dogfood Hackathon",
  description: "A self-hosted hackathon submission and judging portal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
