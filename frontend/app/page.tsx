import { Navbar } from '@/components/website/Navbar'
import { HeroSection } from '@/components/website/HeroSection'
import { ProblemSection } from '@/components/website/ProblemSection'
import { SolutionSection } from '@/components/website/SolutionSection'
import { HowItWorksSection } from '@/components/website/HowItWorksSection'
import { FeaturesSection } from '@/components/website/FeaturesSection'
import { DemoSection } from '@/components/website/DemoSection'
import { TechStackSection } from '@/components/website/TechStackSection'
import { FutureVisionSection } from '@/components/website/FutureVisionSection'
import { TeamSection } from '@/components/website/TeamSection'
import { ContactSection } from '@/components/website/ContactSection'
import { Footer } from '@/components/website/Footer'
import { ScrollProgress } from '@/components/website/ScrollProgress'
import { BackToTop } from '@/components/website/BackToTop'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <FeaturesSection />
      <DemoSection />
      <TechStackSection />
      <FutureVisionSection />
      <TeamSection />
      <ContactSection />
      <Footer />
      <BackToTop />
    </main>
  )
}
