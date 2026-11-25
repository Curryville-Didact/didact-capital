import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Industries } from "@/components/Industries";
import { MobileFundingBar } from "@/components/MobileFundingBar";
import { Problem } from "@/components/Problem";
import { SocialProof } from "@/components/SocialProof";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <SocialProof />
        <Industries />
      </main>
      <Footer />
      <MobileFundingBar />
    </>
  );
}
