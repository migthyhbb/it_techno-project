import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Partners } from "@/components/partners";
import { Network } from "@/components/network";
import { Leaderboard } from "@/components/leaderboard";
import { PartnersMarquee } from "@/components/partners-marquee";
import { CtaFooter } from "@/components/cta-footer";
import { getLeaderboardEntries } from "@/lib/get-leaderboard";

export default async function Home() {
  const leaderboardEntries = await getLeaderboardEntries();

  return (
    <main>
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
