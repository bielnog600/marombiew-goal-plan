import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

type WhatsAppFloatingButtonProps = {
  href: string;
};

const WhatsAppFloatingButton = ({ href }: WhatsAppFloatingButtonProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 260);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar comigo no WhatsApp"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-black/50 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#050505]"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
};

export default WhatsAppFloatingButton;
