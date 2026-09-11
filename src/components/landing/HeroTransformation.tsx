import { useEffect, useState } from "react";
import type { Transformation } from "@/data/transformations";

type HeroTransformationProps = {
  profileImage?: string;
  transformations: Transformation[];
};

const HeroTransformation = ({ profileImage, transformations }: HeroTransformationProps) => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (transformations.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % transformations.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [transformations.length]);

  const transformation = transformations[activeSlide];

  return (
    <section className="relative isolate flex min-h-[calc(100svh-208px)] items-end overflow-hidden px-4 pb-8 pt-safe sm:min-h-[92svh] sm:px-6">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-y-0 left-0 z-0 w-1/2 overflow-hidden" aria-hidden="true">
        <img
          src="/uploads/1-1-nova.png"
          alt=""
          className="h-full w-full object-cover object-bottom opacity-70"
        />
      </div>
      <div
        className="absolute inset-y-0 right-0 z-0 w-1/2 bg-cover bg-bottom opacity-60"
        style={{ backgroundImage: "url('/uploads/2-1-nova.png')" }}
        aria-hidden="true"
      />

      {transformation && (
        <div key={transformation.id} className="transformation-slide absolute inset-0">
          <div className="absolute inset-y-0 left-0 w-[42%] overflow-hidden">
            <img
              src={transformation.after}
              alt={`Resultado depois de ${transformation.name}`}
              className="h-full w-full object-cover opacity-70"
              fetchPriority={activeSlide === 0 ? "high" : "auto"}
            />
          </div>
          <div className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
            <img
              src={transformation.before}
              alt={`Resultado antes de ${transformation.name}`}
              className="h-full w-full object-cover opacity-60"
              loading="lazy"
            />
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-[#050505]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050505] to-transparent" />

      {transformation && (
        <>
          <span className="absolute left-4 top-[22%] z-10 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-white backdrop-blur-sm sm:left-8">DEPOIS</span>
          <span className="absolute right-4 top-[22%] z-10 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-white backdrop-blur-sm sm:right-8">ANTES</span>
        </>
      )}

      {profileImage && (
        <>
          <img
            src={profileImage}
            alt="Fabiew, treinador"
            className="absolute bottom-[31%] left-1/2 z-10 h-[48%] max-h-[420px] w-auto max-w-[60vw] -translate-x-1/2 object-contain object-bottom drop-shadow-[0_20px_28px_rgba(0,0,0,0.7)] sm:h-[36svh]"
            fetchPriority="high"
          />
          <div className="absolute inset-x-0 bottom-0 z-10 h-[48%] bg-gradient-to-b from-transparent via-[#050505]/90 to-[#050505]" />
        </>
      )}

      <div className="relative z-20 mx-auto w-full max-w-xl text-center">
        <h1 className="text-5xl font-bold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">Fabiew Aires</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-300">
          • Personal Trainer •
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Treino • Nutrição • Estratégia</p>

        <div className="mt-7 flex items-center justify-center gap-3 text-left">
          <span className="h-px w-8 bg-primary/70" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-200">Resultados reais • Estratégias reais</p>
          <span className="h-px w-8 bg-primary/70" />
        </div>

      </div>
    </section>
  );
};

export default HeroTransformation;
