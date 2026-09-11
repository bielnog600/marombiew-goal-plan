import { Calculator, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import HeroTransformation from "@/components/landing/HeroTransformation";
import { heroProfileImage, transformations } from "@/data/transformations";

const CONSULTATION_WHATSAPP_LINK = "https://wa.me/351939184666?text=Ol%C3%A1%20Fabiel!%20Vi%20o%20seu%20perfil%20MAROMBEIW%20e%20gostaria%20de%20saber%20mais%20sobre%20a%20Consultoria%20Online.";

const Home = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505]">
      <HeroTransformation profileImage={heroProfileImage} transformations={transformations} />

      <main className="px-4 pb-10 sm:px-6">
        <div className="mx-auto w-full max-w-xl">
          <div className="space-y-4">
            <a
              href={CONSULTATION_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[76px] w-full items-center rounded-3xl bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/10 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/20 active:scale-[0.98]"
              aria-label="Saber mais sobre Consultoria Online pelo WhatsApp"
            >
              <MessageCircle className="h-7 w-7 shrink-0" aria-hidden="true" />
              <span className="flex-1 px-4 text-center">
                <span className="block text-base font-bold tracking-wide">CONSULTORIA ONLINE</span>
                <span className="mt-1 block text-xs font-medium opacity-75">Treino + acompanhamento personalizado</span>
              </span>
              <span className="w-7 shrink-0" aria-hidden="true" />
            </a>

            <Link
              to="/calculadora"
              className="group flex min-h-[76px] w-full items-center rounded-3xl border border-white/15 bg-[#121212] px-5 text-white shadow-lg shadow-black/30 transition-all duration-200 hover:border-primary/70 hover:bg-[#191919] active:scale-[0.98]"
              aria-label="Abrir Calculadora Fitness"
            >
              <Calculator className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex-1 px-4 text-center">
                <span className="block text-base font-bold tracking-wide">CALCULADORA FITNESS</span>
                <span className="mt-1 block text-xs font-medium text-zinc-400">Calcule calorias, macros e sua meta</span>
              </span>
              <span className="w-7 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-10 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Resultados reais • Estratégias reais
          </p>
        </div>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-500">
        MAROMBEIW GOAL PLAN — Treino. Nutrição. Estratégia.
      </footer>
    </div>
  );
};

export default Home;
