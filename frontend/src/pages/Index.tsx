import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import PageTransition from '@/components/PageTransition';

export default function Index() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <HeroSection />
      </div>
    </PageTransition>
  );
}
