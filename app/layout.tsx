import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "GripArc — Your Calisthenics Journey Starts Here",
    template: "%s | GripArc",
  },
  description:
    "Discover your starting point and preview a skill-based approach to calisthenics. Join free early access for GripArc, an iOS app in development.",
  openGraph: {
    title: "Your Calisthenics Journey Starts Here.",
    description:
      "Small steps. Real strength. Your next chapter starts with GripArc.",
    type: "website",
    locale: "en_US",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
