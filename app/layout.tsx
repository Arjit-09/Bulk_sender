import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Pulse Connect — Business messaging, together",
  description:
    "A workspace for consent-based WhatsApp, email and SMS campaigns for businesses in India.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
