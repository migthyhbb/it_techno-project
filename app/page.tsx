import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Partners } from "@/components/partners";
import { Network } from "@/components/network";
import { Leaderboard } from "@/components/leaderboard";
import { PartnersMarquee } from "@/components/partners-marquee";
import { CtaFooter } from "@/components/cta-footer";
import { getLeaderboardEntries } from "@/lib/get-leaderboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboardEntries = await getLeaderboardEntries();

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden relative bg-cream">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Partners />
      <Network />
      <Leaderboard entries={leaderboardEntries} />
      <PartnersMarquee />
      <CtaFooter />
    </main>
  );
}