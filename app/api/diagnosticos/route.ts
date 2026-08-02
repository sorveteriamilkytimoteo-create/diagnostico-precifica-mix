import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DiagnosticBody = {
  nome?: unknown;
  telefone?: unknown;
  origem?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  respostas?: unknown;
  pontuacao?: unknown;
  nivelRisco?: unknown;
  estimativaPerda?: unknown;
  segmento?: unknown;
  tracking?: Record<string, unknown>;
};

const PRODUCT = "precifica_mix";
const FUNNEL = "diagnostico_precifica_mix";
const VALID_SEGMENTS = new Set([
  "restaurante",
  "lanchonete_hamburgueria",
  "pizzaria",
  "marmitaria_delivery",
  "padaria_confeitaria_doceria",
  "sorveteria_acaiteria",
  "outro_food_service",
]);

function clean(value: unknown, limit = 500) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DiagnosticBody;
    const nome = clean(body.nome, 120);
    const telefone = clean(body.telefone, 20).replace(/\D/g, "");
    const requestedSegment = clean(body.segmento, 80);
    const segmento = VALID_SEGMENTS.has(requestedSegment) ? requestedSegment : "outro_food_service";

    if (nome.length < 2 || telefone.length !== 11) {
      return NextResponse.json({ error: "Dados do lead inválidos." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const data = new Date(now).toISOString();
    const userAgent = request.headers.get("user-agent") || "";
    const tracking = body.tracking || {};
    const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";

    const lead = {
      id,
      produto: PRODUCT,
      funil: FUNNEL,
      versao_diagnostico: "v1",
      segmento,
      tipo_oferta: "pagamento_unico",
      valor_oferta: 37,
      valor_original: 97,
      nome,
      telefone,
      data,
      origem: clean(body.origem) || "direto",
      utm_source: clean(body.utm_source),
      utm_medium: clean(body.utm_medium),
      utm_campaign: clean(body.utm_campaign),
      utm_content: clean(body.utm_content),
      utm_term: clean(body.utm_term),
      respostas: JSON.stringify(body.respostas || {}),
      pontuacao: Number(body.pontuacao) || 0,
      nivel_risco: clean(body.nivelRisco, 20),
      estimativa_perda: Number(body.estimativaPerda) || 0,
      clicou_checkout: 0,
      comprou: 0,
      status: "Novo",
      observacoes: "",
      user_agent: clean(userAgent, 700),
      cidade: decodeURIComponent(request.headers.get("x-vercel-ip-city") || ""),
      estado: clean(request.headers.get("x-vercel-ip-country-region"), 100),
      ip: clean(forwardedIp, 100),
      timestamp: now,
      session_id: clean(tracking.sessionId, 100),
      landing_page: clean(tracking.landingPage),
      referrer: clean(tracking.referrer),
      utm_id: clean(tracking.utm_id),
      fbclid: clean(tracking.fbclid),
      gclid: clean(tracking.gclid),
      src: clean(tracking.src),
      sck: clean(tracking.sck),
      xcod: clean(tracking.xcod),
      first_visit_at: clean(tracking.firstVisitAt, 50),
      diagnostic_started_at: clean(tracking.diagnosticStartedAt, 50),
      diagnostic_completed_at: clean(tracking.diagnosticCompletedAt, 50),
      lead_captured_at: clean(tracking.leadCapturedAt, 50),
      checkout_clicked_at: "",
      funnel_status: clean(tracking.funnelStatus, 50) || "lead_capturado",
      questions_answered: Number(tracking.questionsAnswered) || 0,
      abandonment_step: Number(tracking.abandonmentStep) || 0,
      device_type: /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop",
      entry_domain: clean(tracking.entryDomain, 200),
    };

    await getAdminDb().collection("diagnosticos").doc(id).set(lead);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar diagnóstico:", error);
    return NextResponse.json({ error: "Não foi possível salvar o diagnóstico." }, { status: 500 });
  }
}
