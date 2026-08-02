import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade | Precifica Mix",
  description: "Como os dados informados no diagnóstico do Precifica Mix são utilizados e protegidos.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f5f8f7] px-5 py-12 text-[#111827] md:py-20">
      <article className="mx-auto max-w-3xl rounded-[28px] border border-[#dfe8e3] bg-white p-7 shadow-[0_20px_70px_rgba(12,71,54,.08)] md:p-12">
        <p className="text-sm font-extrabold uppercase tracking-[.15em] text-[#008c66]">Precifica Mix</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Política de Privacidade</h1>
        <p className="mt-4 leading-7 text-[#68756f]">Esta política explica como utilizamos os dados informados no Diagnóstico Precifica Mix.</p>

        <div className="mt-9 space-y-7 leading-7 text-[#4e5c55]">
          <section>
            <h2 className="text-xl font-extrabold text-[#21182c]">Dados coletados</h2>
            <p className="mt-2">Coletamos seu nome, WhatsApp, respostas do diagnóstico e informações técnicas básicas de acesso, como origem da visita, parâmetros de campanha, navegador e região aproximada.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold text-[#21182c]">Como utilizamos</h2>
            <p className="mt-2">Esses dados são utilizados para gerar o resultado personalizado, permitir contato sobre o Precifica Mix, analisar a eficiência do diagnóstico e melhorar a experiência do usuário.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold text-[#21182c]">Analytics e publicidade</h2>
            <p className="mt-2">Podemos utilizar Google Tag Manager, Google Analytics, Meta Pixel e UTMify para medir o funil. Nome, telefone, WhatsApp e e-mail não são enviados a essas plataformas.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold text-[#21182c]">Proteção e compartilhamento</h2>
            <p className="mt-2">Não vendemos seus dados. O acesso é restrito à equipe responsável e aos serviços necessários para operar, medir e proteger a aplicação.</p>
          </section>
          <section>
            <h2 className="text-xl font-extrabold text-[#21182c]">Seus direitos</h2>
            <p className="mt-2">Você pode solicitar informações, correção ou exclusão dos seus dados por meio dos canais oficiais do Precifica Mix.</p>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-flex rounded-xl bg-[#009b70] px-5 py-3 font-bold text-white">Voltar ao diagnóstico</Link>
      </article>
    </main>
  );
}
