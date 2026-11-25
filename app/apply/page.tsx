import type { Metadata } from "next";
import { ApplyForm } from "@/components/apply/ApplyForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Apply | Didact Capital",
  description:
    "Complete a Didact Capital financing application and upload 3–5 months of business bank statements.",
};

export default function ApplyPage() {
  return (
    <>
      <Header />
      <main id="main" className="bg-sand-50">
        <ApplyForm />
      </main>
      <Footer />
    </>
  );
}
