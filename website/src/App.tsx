import { BackToTop } from "./components/BackToTop";
import { Nav } from "./components/Nav";
import { Companion } from "./companion/Companion";
import { Architecture } from "./sections/Architecture";
import { Cta } from "./sections/Cta";
import { Demo } from "./sections/Demo";
import { Footer } from "./sections/Footer";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { RunIt } from "./sections/RunIt";
import { Statement } from "./sections/Statement";
import { SwitchFeatures } from "./sections/SwitchFeatures";
import { TwoKeys } from "./sections/TwoKeys";

export function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Statement />
        <Demo />
        <HowItWorks />
        <TwoKeys />
        <SwitchFeatures />
        <Architecture />
        <RunIt />
        <Cta />
      </main>
      <Footer />
      <BackToTop />
      <Companion />
    </>
  );
}
