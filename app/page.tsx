import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };
import Landing from "@/components/landing";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>;
}) {
  const params = await searchParams;
  console.log("Landing")
  return (
    <Landing
      variant={
        params.variant === "pullup"
          ? "pullup"
          : params.variant === "beginner"
            ? "beginner"
            : undefined
      }
    />
  );
}
