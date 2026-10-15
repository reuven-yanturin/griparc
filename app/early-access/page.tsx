import type { Metadata } from "next";
import EarlyAccessForm from "@/components/early-access-form";
export const metadata: Metadata = { title: "Join Free Early Access" };
export default function Page() {
  return <EarlyAccessForm />;
}
