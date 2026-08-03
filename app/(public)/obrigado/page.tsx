import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  KeyRound,
  MailCheck,
  MessageCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Compra confirmada | Precifica Mix",
  description: "Veja como receber e acessar seu Precifica Mix.",
  robots: { index: false, follow: false },
};

const supportUrl = `https://wa.me/5531983238881?text=${encodeURIComponent(
  "Olá, Luís Fernando! Acabei de adquirir o Precifica Mix e preciso de ajuda com meu acesso.",
)}`;

const firstSteps: Array<{ icon: LucideIcon; text: string }> = [
  { icon: KeyRound, text: "Abra o e-mail da Hotmart e confirme seu acesso." },
  { icon: ClipboardCheck, text: "Cadastre os primeiros insumos e seus preços de compra." },
  { icon: ShieldCheck, text: "Monte uma ficha técnica e confira o preço recomendado." },
];

export default function ThankYouPage() {
  const accessUrl = process.env.NEXT_PUBLIC_PRECIFICA_ACCESS_URL?.trim() || "https://consumer.hotmart.com";

  return (
    <main className="min-h-screen bg-[#f3faf7] px-5 py-8 text-[#101827] sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-center gap-2.5 font-black tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#009b70] text-white shadow-sm">P</span>
          <span className="text-xl">Precifica<span className="text-[#009b70]">Mix</span></span>
        </header>

        <section className="mt-8 overflow-hidden rounded-[30px] border border-[#dcebe5] bg-white shadow-[0_24px_70px_rgba(15,88,65,.10)]">
          <div className="grid lg:grid-cols-[1.12fr_.88fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e5f8f0] text-[#008c66]">
                <CheckCircle2 size={30} strokeWidth={2.4} />
              </span>
              <p className="mt-6 text-sm font-black uppercase tracking-[.18em] text-[#008c66]">Compra recebida</p>
              <h1 className="mt-2 max-w-xl text-3xl font-black leading-tight sm:text-5xl">
                Seu acesso ao Precifica<span className="text-[#009b70]">Mix</span> está a caminho.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#5d6877] sm:text-lg">
                A Hotmart enviará para o e-mail usado na compra as orientações e os dados de acesso. Esse envio pode levar alguns minutos.
              </p>

              <div className="mt-8 rounded-2xl border border-[#cce9de] bg-[#f2fbf7] p-5">
                <div className="flex gap-3">
                  <MailCheck className="mt-0.5 shrink-0 text-[#008c66]" size={22} />
                  <div>
                    <h2 className="font-extrabold">Confira sua caixa de entrada</h2>
                    <p className="mt-1 text-sm leading-6 text-[#5d6877]">
                      Procure por uma mensagem da Hotmart. Se não encontrar, verifique Spam, Promoções e Lixo eletrônico.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={accessUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#009b70] px-5 text-center font-black text-white shadow-[0_12px_25px_rgba(0,155,112,.22)] transition hover:-translate-y-0.5 hover:bg-[#008661] sm:w-fit sm:min-w-72"
              >
                ACESSAR MEU PRODUTO <ArrowRight size={19} />
              </a>
              <p className="mt-3 text-xs text-[#7a8491]">Use o mesmo e-mail informado no momento da compra.</p>
            </div>

            <aside className="border-t border-[#e2eee9] bg-[#0c2b25] p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[.16em] text-[#63d4ad]">Primeiros passos</p>
              <h2 className="mt-2 text-2xl font-black">Comece do jeito certo</h2>
              <div className="mt-7 space-y-5">
                {firstSteps.map(({ icon: Icon, text }, index) => (
                  <div key={text} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#63d4ad]">
                      <Icon size={18} />
                    </span>
                    <p className="pt-1 text-sm leading-6 text-white/80"><b className="text-white">{index + 1}.</b> {text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-9 border-t border-white/10 pt-7">
                <h2 className="font-extrabold">Precisa de ajuda?</h2>
                <p className="mt-2 text-sm leading-6 text-white/65">Fale diretamente com Luís Fernando no suporte.</p>
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#20ba72] px-4 font-extrabold text-white transition hover:bg-[#18a362]"
                >
                  <MessageCircle size={19} /> FALAR NO WHATSAPP
                </a>
                <p className="mt-3 text-center text-xs text-white/50">(31) 98323-8881</p>
              </div>
            </aside>
          </div>
        </section>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-[#77818d]">
          O pagamento e a entrega do acesso são processados pela Hotmart. Guarde o comprovante e o e-mail da compra.
        </p>
      </div>
    </main>
  );
}
