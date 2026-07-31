import { ComputerShowcase } from "./ComputerShowcase";
import { ParticleBackground } from "./ParticleBackground";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-[#121212]"
    >
      <ParticleBackground
        className="absolute inset-0 -z-10"
        config={{ color: "224, 225, 230", opacity: [0.4, 0.4] }}
      />

      <div className="reference-hero-content relative z-20 flex flex-1 flex-col items-center px-5 sm:px-10">
        <div className="hero-computer">
          <ComputerShowcase />
        </div>

        <p className="reference-headline reference-hero-copy text-center text-[#fff0dd]">
          We make brands work for the internet.
          <br />
          Not the other way around.
        </p>
      </div>
    </section>
  );
}
