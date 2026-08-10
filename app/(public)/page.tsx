"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Boxes,
  Calculator,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Layers3,
  LockKeyhole,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnalyticsConfig,
  buildCheckoutUrl,
  getAnalyticsConfig,
  getSessionId,
  getTrackingParams,
  trackCheckoutStarted,
  trackDiagnosticAnswer,
  trackDiagnosticCompleted,
  trackDiagnosticProgress,
  trackDiagnosticStarted,
  trackLeadCaptured,
  trackLeadFormViewed,
  trackResultViewed,
} from "../lib/analytics";

type Answer = {
  label: string;
  score: number;
  value?: string;
  dailyOrders?: number;
};

type Question = {
  title: string;
  hint: string;
  answers: Answer[];
  key: string;
  category: string;
  attentionPoint?: string;
};

const STORAGE_PREFIX = "pm";

const questions: Question[] = [
  {
    key: "segmento",
    category: "segmento",
    title: "Qual é o segmento principal do seu negócio?",
    hint: "Isso deixa seu resultado mais próximo da sua realidade.",
    answers: [
      { label: "Restaurante", score: 0, value: "restaurante" },
      { label: "Lanchonete ou hamburgueria", score: 0, value: "lanchonete_hamburgueria" },
      { label: "Pizzaria", score: 0, value: "pizzaria" },
      { label: "Marmitaria ou delivery", score: 0, value: "marmitaria_delivery" },
      { label: "Padaria, confeitaria ou doceria", score: 0, value: "padaria_confeitaria_doceria" },
      { label: "Sorveteria ou açaíteria", score: 0, value: "sorveteria_acaiteria" },
      { label: "Outro negócio de alimentação", score: 0, value: "outro_food_service" },
    ],
  },
  {
    key: "custo",
    category: "custos",
    title: "Você sabe o custo exato de cada produto que vende?",
    hint: "Considere cada ingrediente, embalagem e quantidade utilizada.",
    attentionPoint: "Custo real dos produtos",
    answers: [
      { label: "Sim, calculo tudo com ficha técnica", score: 0 },
      { label: "Tenho apenas uma estimativa", score: 2 },
      { label: "Não sei com precisão", score: 4 },
    ],
  },
  {
    key: "preco",
    category: "precificacao",
    title: "Como você define seus preços de venda?",
    hint: "Escolha a opção mais próxima da sua rotina atual.",
    attentionPoint: "Método de precificação",
    answers: [
      { label: "Com base no custo e na margem desejada", score: 0 },
      { label: "Comparo com a concorrência", score: 3 },
      { label: "Multiplico o custo ou defino no achismo", score: 4 },
    ],
  },
  {
    key: "ficha",
    category: "ficha_tecnica",
    title: "Seus produtos possuem fichas técnicas atualizadas?",
    hint: "A ficha técnica padroniza ingredientes, quantidades e rendimento.",
    attentionPoint: "Fichas técnicas e rendimento",
    answers: [
      { label: "Sim, todos os produtos", score: 0 },
      { label: "Somente alguns", score: 2 },
      { label: "Ainda não utilizo fichas técnicas", score: 4 },
    ],
  },
  {
    key: "custos_extras",
    category: "custos_indiretos",
    title: "Você inclui embalagens, taxas e outros custos no preço?",
    hint: "Pense em cartão, delivery, impostos, gás e perdas do processo.",
    attentionPoint: "Taxas e custos indiretos",
    answers: [
      { label: "Sim, considero todos os custos", score: 0 },
      { label: "Incluo somente os principais", score: 2 },
      { label: "Não sei como incluir esses valores", score: 4 },
    ],
  },
  {
    key: "atualizacao",
    category: "atualizacao_custos",
    title: "Quando um ingrediente aumenta, você atualiza seus custos?",
    hint: "Uma pequena alta repetida em vários insumos pode consumir a margem.",
    attentionPoint: "Atualização dos custos",
    answers: [
      { label: "Sim, atualizo sempre que o preço muda", score: 0 },
      { label: "Atualizo de tempos em tempos", score: 2 },
      { label: "Quase nunca atualizo", score: 4 },
    ],
  },
  {
    key: "padronizacao",
    category: "padronizacao",
    title: "As porções e receitas seguem um padrão?",
    hint: "Variações na montagem alteram o custo e o rendimento do produto.",
    attentionPoint: "Padronização e desperdício",
    answers: [
      { label: "Sim, usamos medidas e receitas padronizadas", score: 0 },
      { label: "Temos um padrão, mas ele varia", score: 2 },
      { label: "Cada pessoa prepara de um jeito", score: 4 },
    ],
  },
  {
    key: "estoque",
    category: "estoque",
    title: "Como você controla os ingredientes em estoque?",
    hint: "Considere entradas, consumo, perdas e quantidade disponível.",
    attentionPoint: "Controle de estoque",
    answers: [
      { label: "Sistema com entradas e saídas", score: 0 },
      { label: "Planilha ou caderno", score: 2 },
      { label: "Controlo de cabeça ou quando acaba", score: 4 },
    ],
  },
  {
    key: "sistema",
    category: "ferramenta_atual",
    title: "Hoje, como você organiza a precificação do negócio?",
    hint: "Queremos entender quanto ainda depende de trabalho manual.",
    attentionPoint: "Ferramenta de controle",
    answers: [
      { label: "Uso uma ferramenta específica de precificação", score: 0 },
      { label: "Uso planilhas, mas faço muitos cálculos manualmente", score: 2 },
      { label: "Uso caderno, calculadora ou não tenho controle", score: 4 },
    ],
  },
  {
    key: "pedidos",
    category: "volume_vendas",
    title: "Em média, quantos pedidos você realiza por dia?",
    hint: "Usaremos esse volume para criar uma simulação conservadora.",
    answers: [
      { label: "Até 20 pedidos", score: 0, dailyOrders: 15 },
      { label: "De 21 a 40 pedidos", score: 0, dailyOrders: 30 },
      { label: "De 41 a 70 pedidos", score: 0, dailyOrders: 55 },
      { label: "Mais de 70 pedidos", score: 0, dailyOrders: 80 },
    ],
  },
  {
    key: "faturamento",
    category: "faturamento",
    title: "Qual é o faturamento médio mensal do negócio?",
    hint: "A informação é usada somente para qualificar o diagnóstico.",
    answers: [
      { label: "Até R$ 15 mil", score: 0 },
      { label: "De R$ 15 mil a R$ 30 mil", score: 0 },
      { label: "De R$ 30 mil a R$ 60 mil", score: 0 },
      { label: "Acima de R$ 60 mil", score: 0 },
    ],
  },
  {
    key: "intencao",
    category: "intencao_compra",
    title: "Se você pudesse organizar preços e estoque com um pagamento único de R$ 37, faria sentido começar agora?",
    hint: "Um produto precificado errado pode custar mais do que esse investimento.",
    answers: [
      { label: "Sim, quero organizar isso agora", score: 0 },
      { label: "Talvez — quero entender melhor primeiro", score: 0 },
      { label: "Não é uma prioridade neste momento", score: 0 },
    ],
  },
];

const maxRiskScore = questions.reduce(
  (total, question) => total + Math.max(...question.answers.map((answer) => answer.score)),
  0,
);

function PrecificaLogo({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 font-black tracking-tight ${light ? "text-white" : "text-[#0f1728]"}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#009b70] text-white shadow-sm">P</span>
      <span>
        Precifica<span className="text-[#009b70]">Mix</span>
        <small className={`block text-[8px] font-bold tracking-[.15em] ${light ? "text-white/55" : "text-[#7a8595]"}`}>FOOD SERVICE</small>
      </span>
    </div>
  );
}

function CreatorAuthority() {
  return (
    <aside className="mt-9 overflow-hidden rounded-[24px] border border-[#cfe4da] bg-[#f7fcfa]">
      <div className="grid sm:grid-cols-[148px_1fr]">
        <div className="relative aspect-[16/10] min-h-44 sm:aspect-auto sm:min-h-full">
          <Image
            src="/precifica-mix-fundadores-autoridade.webp"
            alt="Luís e Lucas, criadores do Precifica Mix, em frente à Sorvetes Milky Timóteo"
            fill
            sizes="(max-width: 640px) 100vw, 148px"
            className="object-cover object-center"
          />
        </div>

        <div className="p-5">
          <p className="text-xs font-black uppercase tracking-[.13em] text-[#008c66]">Criado dentro de uma operação real</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-[#12231d]">Experiência prática + tecnologia</h3>
          <p className="mt-3 text-sm leading-6 text-[#5f6f67]">
            Lucas vive a rotina de sorveterias há mais de 8 anos. Luís é gerente da operação e bacharel em Sistemas de Informação. Juntos, transformaram a precificação manual em uma ferramenta simples para o food service.
          </p>
        </div>
      </div>

      <a
        href="https://www.instagram.com/milky_timoteo/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conhecer a Sorvetes Milky Timóteo no Instagram"
        className="group flex items-center gap-3 border-t border-[#cfe4da] bg-white px-4 py-3.5 transition hover:bg-[#f0faf6]"
      >
        <Image
          src="/milky-timoteo-logo.webp"
          alt="Logo da Sorvetes Milky"
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-full border border-[#e1e8e5] bg-white object-cover"
        />
        <span className="min-w-0 flex-1">
          <strong className="block text-sm text-[#163029]">Conheça a operação onde tudo começou</strong>
          <span className="mt-0.5 block text-sm font-bold text-[#008c66]">@milky_timoteo</span>
        </span>
        <ExternalLink size={18} className="shrink-0 text-[#7d8b84] transition group-hover:text-[#008c66]" />
      </a>
    </aside>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<"home" | "quiz" | "lead" | "result">("home");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [publicConfig, setPublicConfig] = useState<AnalyticsConfig | null>(null);
  const checkoutLock = useRef(0);
  const answerLock = useRef(false);

  const track = useCallback((tipo: string, pergunta?: number, diagnosticoId?: string) => {
    const activeSessionId = sessionId || getSessionId();
    fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: activeSessionId, tipo, pergunta, diagnosticoId }),
    }).catch(() => undefined);
  }, [sessionId]);

  useEffect(() => {
    const hydrationFrame = requestAnimationFrame(() => {
      const nextSession = getSessionId();
      setSessionId(nextSession);
      if (!sessionStorage.getItem(`${STORAGE_PREFIX}_first_visit_at`)) {
        sessionStorage.setItem(`${STORAGE_PREFIX}_first_visit_at`, new Date().toISOString());
        sessionStorage.setItem(`${STORAGE_PREFIX}_landing_page`, window.location.href);
        sessionStorage.setItem(`${STORAGE_PREFIX}_referrer`, document.referrer || "direto");
      }

      try {
        const saved = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}_diagnostico`) || "null");
        if (saved?.version === 1 && (saved?.screen === "quiz" || saved?.screen === "lead")) {
          setScreen(saved.screen);
          setCurrent(saved.current || 0);
          setAnswers(saved.answers || {});
        }
      } catch {
        localStorage.removeItem(`${STORAGE_PREFIX}_diagnostico`);
      }
    });
    void getAnalyticsConfig().then(setPublicConfig);
    return () => cancelAnimationFrame(hydrationFrame);
  }, []);

  useEffect(() => {
    if (sessionId) track("Entrou na página");
  }, [sessionId, track]);

  useEffect(() => {
    if (screen === "quiz" || screen === "lead") {
      localStorage.setItem(`${STORAGE_PREFIX}_diagnostico`, JSON.stringify({ version: 1, screen, current, answers }));
    }
  }, [screen, current, answers]);

  useEffect(() => {
    if (screen === "home") return;
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  useEffect(() => {
    if (!sessionId || (screen !== "quiz" && screen !== "lead")) return;
    function recordAbandonment() {
      const payload = JSON.stringify({
        sessionId,
        tipo: "Abandonou",
        pergunta: screen === "quiz" ? current + 1 : questions.length,
      });
      navigator.sendBeacon("/api/eventos", new Blob([payload], { type: "application/json" }));
    }
    window.addEventListener("pagehide", recordAbandonment);
    return () => window.removeEventListener("pagehide", recordAbandonment);
  }, [current, screen, sessionId]);

  const score = useMemo(
    () => Object.values(answers).reduce((total, answer) => total + answer.score, 0),
    [answers],
  );
  const risk = score <= 8 ? "Baixo" : score <= 19 ? "Médio" : "Alto";
  const dailyOrders = answers.pedidos?.dailyOrders || 15;
  const lossPerOrder = risk === "Alto" ? 3 : risk === "Médio" ? 2 : 1;
  const estimatedLoss = dailyOrders * lossPerOrder * 30;
  const segment = answers.segmento?.value || "outro_food_service";
  const segmentLabel = answers.segmento?.label || "Food service";
  const attentionPoints = questions
    .filter((question) => question.attentionPoint && (answers[question.key]?.score || 0) >= 2)
    .sort((a, b) => (answers[b.key]?.score || 0) - (answers[a.key]?.score || 0))
    .slice(0, 3)
    .map((question) => question.attentionPoint as string);

  function start() {
    setScreen("quiz");
    track("Começou diagnóstico", 1);
    trackDiagnosticStarted();
  }

  function choose(answer: Answer) {
    if (answerLock.current) return;
    answerLock.current = true;
    const question = questions[current];
    const questionNumber = current + 1;
    const updated = { ...answers, [question.key]: answer };
    const updatedScore = Object.values(updated).reduce((total, item) => total + item.score, 0);
    const updatedRisk = updatedScore <= 8 ? "Baixo" : updatedScore <= 19 ? "Médio" : "Alto";
    setAnswers(updated);
    track("Pergunta atual", questionNumber);
    trackDiagnosticAnswer({
      questionNumber,
      questionId: question.key,
      category: question.category,
      totalSteps: questions.length,
    });
    if ([3, 6, 9, 12].includes(questionNumber)) {
      trackDiagnosticProgress((questionNumber / questions.length * 100) as 25 | 50 | 75 | 100, questionNumber);
    }
    window.setTimeout(() => {
      answerLock.current = false;
      if (current < questions.length - 1) {
        setCurrent((value) => value + 1);
        return;
      }
      setScreen("lead");
      track("Concluiu");
      sessionStorage.setItem(`${STORAGE_PREFIX}_diagnostic_completed_at`, new Date().toISOString());
      trackDiagnosticCompleted({
        score: updatedScore,
        risk: updatedRisk,
        answerCount: Object.keys(updated).length,
        segment: updated.segmento?.value || "outro_food_service",
      });
      trackLeadFormViewed();
    }, 220);
  }

  function formatPhone(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2 || phone.replace(/\D/g, "").length !== 11) {
      setError("Preencha seu nome e um WhatsApp válido com DDD.");
      return;
    }

    setSending(true);
    const trackingParams = getTrackingParams();
    const leadCapturedAt = new Date().toISOString();
    try {
      const response = await fetch("/api/diagnosticos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name.trim(),
          telefone: phone.replace(/\D/g, ""),
          respostas: answers,
          pontuacao: score,
          nivelRisco: risk,
          estimativaPerda: estimatedLoss,
          segmento: segment,
          origem: document.referrer || "direto",
          ...trackingParams,
          tracking: {
            sessionId,
            landingPage: sessionStorage.getItem(`${STORAGE_PREFIX}_landing_page`) || window.location.href,
            referrer: sessionStorage.getItem(`${STORAGE_PREFIX}_referrer`) || document.referrer || "direto",
            ...trackingParams,
            firstVisitAt: sessionStorage.getItem(`${STORAGE_PREFIX}_first_visit_at`),
            diagnosticStartedAt: sessionStorage.getItem(`${STORAGE_PREFIX}_diagnostic_started_at`),
            diagnosticCompletedAt: sessionStorage.getItem(`${STORAGE_PREFIX}_diagnostic_completed_at`),
            leadCapturedAt,
            funnelStatus: "lead_capturado",
            questionsAnswered: Object.keys(answers).length,
            abandonmentStep: questions.length,
            entryDomain: window.location.hostname,
          },
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar diagnóstico");
      const data = await response.json() as { id?: string };
      setLeadId(data.id || "");
      setScreen("result");
      localStorage.removeItem(`${STORAGE_PREFIX}_diagnostico`);
      track("Preencheu dados", undefined, data.id);
      track("Visualizou resultado", undefined, data.id);
      trackLeadCaptured({ leadId: data.id || "", score, risk, segment });
      trackResultViewed({ leadId: data.id || "", score, risk, estimatedLoss, segment });
    } catch {
      setError("Não foi possível salvar agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  function checkout() {
    if (Date.now() - checkoutLock.current < 1500) return;
    checkoutLock.current = Date.now();
    const finalUrl = publicConfig?.hotmartCheckoutUrl
      ? buildCheckoutUrl(publicConfig.hotmartCheckoutUrl, getTrackingParams())
      : null;
    if (!finalUrl) {
      checkoutLock.current = 0;
      window.alert("O checkout está temporariamente indisponível. Tente novamente em instantes.");
      return;
    }
    if (!trackCheckoutStarted({ leadId, score, risk, segment })) return;
    track("Clicou checkout", undefined, leadId);
    fetch("/api/diagnosticos/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, sessionId }),
      keepalive: true,
    }).catch(() => undefined);
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  }

  if (screen === "home") return <Landing onStart={start} />;

  return (
    <main id="app" className="min-h-screen bg-[#f5f8f7] text-[#111827]">
      <header className="border-b border-[#e3ebe7] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#52605a]">
            <ShieldCheck size={18} className="text-[#009b70]" /> Diagnóstico seguro
          </span>
          <span className="text-xs font-medium text-[#7a8781]">Seus dados estão protegidos</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {screen === "quiz" ? (
          <motion.section
            key={`question-${current}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto max-w-3xl px-5 py-10 md:py-16"
          >
            <div className="mb-8">
              <div className="mb-3 flex justify-between text-sm font-semibold">
                <span>Pergunta {current + 1} de {questions.length}</span>
                <span className="text-[#008c66]">{Math.round((current + 1) / questions.length * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dfeae6]">
                <motion.div
                  animate={{ width: `${(current + 1) / questions.length * 100}%` }}
                  className="h-full rounded-full bg-[#009b70]"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e1e9e5] bg-white p-6 shadow-[0_18px_60px_rgba(12,71,54,.08)] md:p-10">
              <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-[#e6f8f1] text-[#008c66]">
                {current === 0 ? <Store size={22} /> : <Gauge size={22} />}
              </span>
              <h1 className="text-2xl font-bold tracking-tight md:text-4xl">{questions[current].title}</h1>
              <p className="mt-3 text-[#68756f]">{questions[current].hint}</p>
              <div className="mt-8 grid gap-3">
                {questions[current].answers.map((answer) => (
                  <button
                    type="button"
                    key={answer.label}
                    onClick={() => choose(answer)}
                    className={`group flex min-h-16 items-center justify-between rounded-2xl border p-4 text-left font-semibold transition hover:-translate-y-0.5 hover:border-[#009b70] hover:bg-[#f5fcf9] ${
                      answers[questions[current].key]?.label === answer.label
                        ? "border-[#009b70] bg-[#edf9f5]"
                        : "border-[#e0e8e4]"
                    }`}
                  >
                    <span>{answer.label}</span>
                    <ChevronRight className="text-[#9aa6a1] transition group-hover:translate-x-1 group-hover:text-[#009b70]" size={20} />
                  </button>
                ))}
              </div>
              {current > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrent((value) => value - 1)}
                  className="mt-6 text-sm font-semibold text-[#68756f] hover:text-[#008c66]"
                >
                  ← Voltar à pergunta anterior
                </button>
              ) : null}
            </div>
          </motion.section>
        ) : null}

        {screen === "lead" ? (
          <motion.section
            key="lead"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-xl px-5 py-12 md:py-20"
          >
            <div className="rounded-[30px] border border-[#e0e9e4] bg-white p-7 text-center shadow-[0_20px_70px_rgba(12,71,54,.10)] md:p-11">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e5f8f0] text-[#008c66]">
                <ClipboardCheck size={28} />
              </span>
              <p className="mt-6 text-sm font-extrabold uppercase tracking-[.16em] text-[#008c66]">Análise concluída</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Seu diagnóstico está pronto.</h1>
              <p className="mt-3 text-[#68756f]">Falta apenas um passo para liberar seu nível de risco e a simulação de perda mensal.</p>
              <form onSubmit={submitLead} className="mt-8 space-y-4 text-left">
                <label className="block text-sm font-bold">
                  Seu nome
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    className="mt-2 w-full rounded-2xl border border-[#d9e3de] px-4 py-4 outline-none transition focus:border-[#009b70] focus:ring-4 focus:ring-[#009b70]/10"
                  />
                </label>
                <label className="block text-sm font-bold">
                  WhatsApp com DDD
                  <input
                    value={phone}
                    onChange={(event) => setPhone(formatPhone(event.target.value))}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(31) 99999-9999"
                    className="mt-2 w-full rounded-2xl border border-[#d9e3de] px-4 py-4 outline-none transition focus:border-[#009b70] focus:ring-4 focus:ring-[#009b70]/10"
                  />
                </label>
                {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
                <button disabled={sending} className="cta mt-2 w-full">
                  {sending ? "Preparando resultado..." : "VER MEU DIAGNÓSTICO"}
                  <ArrowRight size={19} />
                </button>
              </form>
              <p className="mt-5 text-xs leading-5 text-[#7c8882]">
                Ao continuar, você concorda com o uso dos seus dados para gerar o diagnóstico e receber contato sobre o Precifica Mix, conforme nossa{" "}
                <a href="/privacidade" className="font-bold text-[#008c66] underline underline-offset-2">Política de Privacidade</a>.
              </p>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#7c8882]">
                <LockKeyhole size={14} /> Sem spam. Seus dados não serão compartilhados.
              </p>
            </div>
          </motion.section>
        ) : null}

        {screen === "result" ? (
          <Result
            risk={risk}
            score={score}
            estimatedLoss={estimatedLoss}
            dailyOrders={dailyOrders}
            segmentLabel={segmentLabel}
            attentionPoints={attentionPoints}
            onCheckout={checkout}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function Landing({ onStart }: { onStart: () => void }) {
  return (
    <main className="overflow-hidden bg-white text-[#111827]">
      <nav className="relative z-20 mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        <span className="flex items-center gap-2 text-sm font-bold text-[#008c66]">
          <Sparkles size={18} /> Diagnóstico de Precificação
        </span>
        <span className="hidden items-center gap-2 text-sm text-[#66736d] sm:flex">
          <ShieldCheck size={17} /> Gratuito • menos de 2 minutos
        </span>
      </nav>

      <section className="precifica-hero relative px-5 pb-20 pt-12 md:pb-28 md:pt-20">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[#ccecdf] bg-[#f0fbf7] px-4 py-2 text-sm font-bold text-[#008c66]">
            <Store size={16} /> Para restaurantes, delivery e todo food service
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-6xl md:text-7xl">
            Descubra se os preços do seu negócio estão <span className="precifica-gradient-text">consumindo seu lucro.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#637069] md:text-xl">
            Responda 12 perguntas sobre custos, fichas técnicas, taxas e estoque e veja onde sua margem pode estar escapando.
          </p>
          <button type="button" onClick={onStart} className="cta mx-auto mt-9 text-base">
            COMEÇAR DIAGNÓSTICO <ArrowRight size={20} />
          </button>
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#6f7c75]">
            <span className="flex items-center gap-1.5"><Check size={16} className="text-[#009b70]" /> Resultado imediato</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-[#009b70]" /> 100% gratuito</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-[#009b70]" /> Sem compromisso</span>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-4 text-left md:grid-cols-3">
            {[
              ["Custo real", "Veja se ingredientes, embalagens e taxas estão entrando na conta.", Calculator],
              ["Preço ideal", "Entenda se o valor cobrado protege a margem desejada.", CircleDollarSign],
              ["Estoque", "Descubra se falta de padrão e perdas estão consumindo resultado.", PackageCheck],
            ].map(([title, description, Icon]) => (
              <div key={String(title)} className="soft-card">
                <span className="icon-box"><Icon size={22} /></span>
                <h2 className="mt-5 font-extrabold">{String(title)}</h2>
                <p className="mt-2 text-sm leading-6 text-[#67746d]">{String(description)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e5ece8] bg-[#f8faf9] px-5 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[.16em] text-[#008c66]">Uma análise baseada na sua operação</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">Não é um formulário genérico.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#68756f]">
            Cruzamos suas respostas para mostrar o risco atual e transformar pequenos erros repetidos em uma simulação mensal fácil de entender.
          </p>
        </div>
      </section>
    </main>
  );
}

function Result({
  risk,
  score,
  estimatedLoss,
  dailyOrders,
  segmentLabel,
  attentionPoints,
  onCheckout,
}: {
  risk: string;
  score: number;
  estimatedLoss: number;
  dailyOrders: number;
  segmentLabel: string;
  attentionPoints: string[];
  onCheckout: () => void;
}) {
  const high = risk === "Alto";
  const medium = risk === "Médio";
  const color = high ? "#dc3b45" : medium ? "#e59b1a" : "#009b70";
  const points = attentionPoints.length ? attentionPoints : ["Atualização dos custos", "Padronização das receitas"];

  return (
    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-24">
      <section className="px-5 py-12 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[.18em] text-[#008c66]">Diagnóstico concluído</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Seus preços merecem atenção.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-[#68756f]">
              Analisamos as respostas do seu negócio de {segmentLabel.toLowerCase()} e encontramos pontos que podem estar reduzindo sua margem.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-[.8fr_1.2fr]">
            <div className="rounded-[28px] bg-[#063f36] p-7 text-white shadow-xl">
              <p className="text-sm text-white/65">Nível de risco na precificação</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 0 7px ${color}22` }} />
                <strong className="text-4xl">{risk}</strong>
              </div>
              <div className="mt-8 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${Math.max(12, score / maxRiskScore * 100)}%`, background: color }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/65">Pontuação de risco: {score} de {maxRiskScore} pontos</p>
            </div>

            <div className="rounded-[28px] border border-[#e0e8e4] bg-white p-7 shadow-[0_18px_60px_rgba(12,71,54,.08)]">
              <span className="icon-box"><TriangleAlert size={22} /></span>
              <h2 className="mt-5 text-xl font-extrabold">
                {high
                  ? "Existem sinais claros de margem escapando."
                  : medium
                    ? "Há pontos importantes sem controle."
                    : "Sua base é boa, mas ainda pode ficar mais protegida."}
              </h2>
              <p className="mt-3 leading-7 text-[#68756f]">
                {high
                  ? "Custos aproximados, receitas sem padrão e estoque incompleto podem fazer produtos venderem bem sem deixarem o lucro esperado."
                  : "Pequenos desvios de custo e estoque, repetidos em dezenas de vendas, tornam-se relevantes no fechamento do mês."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {points.map((point) => (
                  <span key={point} className="rounded-full bg-[#edf8f4] px-3 py-1.5 text-xs font-bold text-[#08775a]">{point}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-[#efdfb0] bg-[#fffaf0] p-7 md:p-10">
            <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[.14em] text-[#9a6810]">Simulação conservadora</p>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">
                  Se apenas R$ {risk === "Alto" ? "3,00" : risk === "Médio" ? "2,00" : "1,00"} escaparem em cada pedido...
                </h2>
                <p className="mt-3 text-[#75694f]">Com aproximadamente {dailyOrders} pedidos por dia, isso pode representar:</p>
              </div>
              <div className="rounded-2xl bg-white px-7 py-5 text-center shadow-sm">
                <strong className="text-3xl font-black text-[#008c66]">
                  {estimatedLoss.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
                <p className="mt-1 text-sm text-[#6f7c75]">por mês</p>
              </div>
            </div>
            <p className="mt-6 border-t border-[#eadfca] pt-5 text-xs leading-5 text-[#8b7e66]">
              Esta é uma simulação educativa baseada no volume informado. O valor real depende dos custos, preços e desperdícios da sua operação.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#063f36] px-5 py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_.9fr]">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[.16em] text-[#79e2bd]">O próximo passo</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Transforme o diagnóstico em controle.</h2>
              <p className="mt-5 max-w-xl leading-7 text-white/70">
                O Precifica Mix foi criado para simplificar custos, fichas técnicas, preços e estoque sem exigir planilhas complicadas.
              </p>
              <div className="mt-7">
                <PrecificaLogo light />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              {[
                ["Insumos por segmento", "Comece mais rápido com modelos prontos.", Layers3],
                ["Cálculo automático", "Descubra o custo exato de cada receita.", Calculator],
                ["Preço ideal", "Defina sua margem sem depender do achismo.", ReceiptText],
                ["Estoque organizado", "Acompanhe ingredientes e quantidades.", Boxes],
              ].map(([title, description, Icon]) => (
                <div key={String(title)} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#00a979] text-white"><Icon size={20} /></span>
                  <div><h3 className="font-extrabold">{String(title)}</h3><p className="mt-1 text-sm text-white/60">{String(description)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="oferta" className="scroll-mt-6 px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-[#dfe8e3] bg-white shadow-[0_24px_80px_rgba(12,71,54,.12)]">
          <div className="grid md:grid-cols-[1.1fr_.9fr]">
            <div className="p-8 md:p-12">
              <PrecificaLogo />
              <p className="mt-8 text-sm font-extrabold uppercase tracking-[.15em] text-[#008c66]">Sistema de precificação inteligente</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Organize custos, preços e estoque em um só lugar.</h2>
              <p className="mt-4 leading-7 text-[#68756f]">
                Tenha clareza para tomar decisões sem depender de cálculos soltos, cadernos ou planilhas confusas.
              </p>
              <div className="mt-8 grid gap-4">
                {[
                  "Calcule o custo exato de cada produto",
                  "Monte fichas técnicas completas",
                  "Inclua embalagens, taxas e outros custos",
                  "Encontre o preço ideal para cada canal",
                  "Controle insumos e estoque",
                  "Comece com modelos preparados para seu segmento",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 font-semibold">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e3f7ef] text-[#008c66]"><Check size={15} /></span>
                    {benefit}
                  </div>
                ))}
              </div>

              <CreatorAuthority />
            </div>

            <div className="flex flex-col justify-center bg-[#eff9f5] p-8 md:p-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#063f36] px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-white">
                <Sparkles size={14} /> Oferta especial por tempo limitado
              </div>
              <p className="mt-6 text-sm font-bold text-[#617069]">Acesso completo ao Precifica Mix</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="mb-1 text-xl font-bold text-[#7d8983] line-through decoration-2">R$ 97</span>
                <span className="text-5xl font-black tracking-tight text-[#0f1728]">R$ 37</span>
              </div>
              <p className="mt-2 font-extrabold text-[#007e5c]">Pagamento único • sem mensalidade</p>

              <div className="mt-5 rounded-2xl border border-[#c9e8dc] bg-white/85 p-4">
                <p className="font-extrabold text-[#075c47]">Você economiza R$ 60.</p>
                <p className="mt-1 text-sm leading-6 text-[#68756f]">Menos do que o valor de uma única venda para corrigir preços que afetam todas as vendas.</p>
              </div>

              <button type="button" onClick={onCheckout} className="cta mt-7 w-full">
                QUERO APROVEITAR POR R$ 37 <ArrowRight size={19} />
              </button>
              <p className="mt-4 text-center text-xs text-[#7a8781]">
                <LockKeyhole size={13} className="mr-1 inline" /> Acesso imediato após a confirmação • compra segura pela Hotmart
              </p>
              <div className="mt-6 rounded-2xl border border-[#c9e8dc] bg-white/80 p-4 text-center">
                <p className="text-sm font-extrabold text-[#075c47]">CONDIÇÃO ESPECIAL</p>
                <p className="mt-1 text-xs leading-5 text-[#68756f]">O valor promocional pode ser encerrado a qualquer momento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
