import type { Metadata } from "next";
import AssessmentFlow from "@/components/assessment-flow";
export const metadata: Metadata = {
  title: "Find Your Starting Point",
  robots: { index: false, follow: true },
};
export default function Page() {
  return <AssessmentFlow />;
}
