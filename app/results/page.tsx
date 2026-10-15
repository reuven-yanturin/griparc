import type { Metadata } from "next";
import ResultsPreview from "@/components/results-preview";
export const metadata: Metadata = {
  title: "Your Journey Preview",
  robots: { index: false, follow: true },
};
export default function Page() {
  return <ResultsPreview />;
}
