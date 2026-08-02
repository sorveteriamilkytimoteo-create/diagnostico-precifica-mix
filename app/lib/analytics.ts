"use client";

export const trackingKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "fbclid",
  "gclid",
  "src",
  "sck",
  "xcod",
] as const;

export type TrackingKey = (typeof trackingKeys)[number];
export type TrackingParams = Partial<Record<TrackingKey, string>>;

export type AnalyticsConfig = {
  gtmId: string | null;
  ga4Id: string | null;
  metaPixelId: string | null;
  utmifyPixelId: string | null;
  youtubeVideoUrl: string | null;
  hotmartCheckoutUrl: string | null;
  debug: boolean;
};

type DataLayerValue = string | number | boolean | null | undefined;
type DataLayerPayload = Record<string, DataLayerValue>;
type DedupeScope = "none" | "page" | "session";

declare global {
  interface Window {
    dataLayer?: DataLayerPayload[];
    pixelId?: string;
  }
}

const PRODUCT = "precifica_mix";
const FUNNEL = "diagnostico_precifica_mix";
const TRACKING_STORAGE_KEY = "pm_tracking_params";
const SESSION_STORAGE_KEY = "pm_session_id";
const SESSION_EVENTS_KEY = "pm_analytics_session_events";
const DIAGNOSTIC_STARTED_AT_KEY = "pm_diagnostic_started_at";
const blockedPayloadKeys = new Set(["nome", "name", "telefone", "phone", "whatsapp", "email"]);
const pageEvents = new Set<string>();

let runtimeConfig: AnalyticsConfig | null = null;
let configPromise: Promise<AnalyticsConfig> | null = null;
let lastCheckoutAt = 0;

function isPublicRoute() {
  if (typeof window === "undefined") return false;
  return !window.location.pathname.startsWith("/admin") && !window.location.pathname.startsWith("/painel");
}

function safeJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function sanitizeValue(value: string) {
  return value.trim().slice(0, 500);
}

function cleanPayload(payload: DataLayerPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => !blockedPayloadKeys.has(key.toLowerCase()) && value !== undefined && value !== "",
    ),
  ) as DataLayerPayload;
}

function addScript(id: string, src: string, attributes: Record<string, string> = {}) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
  document.head.appendChild(script);
}

function initializeGtm(gtmId: string) {
  window.dataLayer = window.dataLayer || [];
  if (!window.dataLayer.some((item) => item.event === "gtm.js")) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  }
  addScript("pm-gtm", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
}

function initializeUtmify(pixelId: string) {
  window.pixelId = pixelId;
  addScript("pm-utmify-pixel", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  addScript("pm-utmify-utms", "https://cdn.utmify.com.br/scripts/utms/latest.js", {
    "data-utmify-prevent-subids": "",
  });
}

export function captureTrackingParams() {
  if (typeof window === "undefined") return {};
  const stored = safeJson<TrackingParams>(sessionStorage.getItem(TRACKING_STORAGE_KEY), {});
  const search = new URLSearchParams(window.location.search);
  const merged: TrackingParams = { ...stored };

  trackingKeys.forEach((key) => {
    const value = search.get(key);
    if (value) merged[key] = sanitizeValue(value);
  });
  sessionStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function getTrackingParams() {
  if (typeof window === "undefined") return {};
  return captureTrackingParams();
}

export function getSessionId() {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) return stored;
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function markSessionEvent(key: string) {
  const sent = new Set(safeJson<string[]>(sessionStorage.getItem(SESSION_EVENTS_KEY), []));
  if (sent.has(key)) return false;
  sent.add(key);
  sessionStorage.setItem(SESSION_EVENTS_KEY, JSON.stringify([...sent]));
  return true;
}

function shouldDispatch(key: string, scope: DedupeScope) {
  if (scope === "none") return true;
  if (scope === "page") {
    if (pageEvents.has(key)) return false;
    pageEvents.add(key);
    return true;
  }
  return markSessionEvent(key);
}

function debugEvent(eventName: string, payload: DataLayerPayload) {
  if (runtimeConfig?.debug && process.env.NODE_ENV !== "production") {
    console.info(`[Analytics] ${eventName}`, payload);
  }
}

export function pushToDataLayer(
  eventName: string,
  payload: DataLayerPayload = {},
  options: { dedupe?: DedupeScope; key?: string } = {},
) {
  if (!isPublicRoute()) return false;
  const dedupeKey = options.key || eventName;
  if (!shouldDispatch(dedupeKey, options.dedupe || "none")) return false;

  const tracking = getTrackingParams();
  const eventPayload = cleanPayload({
    event: eventName,
    origem: "diagnostico",
    produto: PRODUCT,
    funil: FUNNEL,
    ...tracking,
    ...payload,
  });
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);
  debugEvent(eventName, eventPayload);
  return true;
}

export async function getAnalyticsConfig() {
  if (runtimeConfig) return runtimeConfig;
  if (configPromise) return configPromise;

  configPromise = fetch("/api/analytics-config", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Configuração de analytics indisponível");
      return (await response.json()) as AnalyticsConfig;
    })
    .then((config) => {
      runtimeConfig = config;
      return config;
    })
    .catch(() => {
      runtimeConfig = {
        gtmId: null,
        ga4Id: null,
        metaPixelId: null,
        utmifyPixelId: null,
        youtubeVideoUrl: null,
        hotmartCheckoutUrl: null,
        debug: false,
      };
      return runtimeConfig;
    });
  return configPromise;
}

export async function initializeAnalytics() {
  if (!isPublicRoute()) return getAnalyticsConfig();
  captureTrackingParams();
  window.dataLayer = window.dataLayer || [];

  const config = await getAnalyticsConfig();
  pushToDataLayer(
    "analytics_config",
    {
      ga4_measurement_id: config.ga4Id,
      meta_pixel_id: config.metaPixelId,
    },
    { dedupe: "page" },
  );
  if (config.gtmId) initializeGtm(config.gtmId);
  if (config.utmifyPixelId) initializeUtmify(config.utmifyPixelId);
  return config;
}

export function trackPageView() {
  return pushToDataLayer(
    "page_view",
    {
      page_title: document.title,
      page_path: window.location.pathname,
      page_url: window.location.href,
      meta_event_name: "PageView",
      content_name: FUNNEL,
      content_category: "diagnostico",
    },
    { dedupe: "page", key: `page_view:${window.location.pathname}` },
  );
}

export function trackDiagnosticViewed() {
  return pushToDataLayer(
    "diagnostico_visualizado",
    {
      session_id: getSessionId(),
      meta_event_name: "ViewContent",
      content_name: FUNNEL,
      content_category: "diagnostico",
    },
    { dedupe: "session" },
  );
}

export function trackDiagnosticStarted() {
  const startedAt = sessionStorage.getItem(DIAGNOSTIC_STARTED_AT_KEY) || new Date().toISOString();
  sessionStorage.setItem(DIAGNOSTIC_STARTED_AT_KEY, startedAt);
  return pushToDataLayer(
    "diagnostico_iniciado",
    {
      session_id: getSessionId(),
      data_inicio: startedAt,
    },
    { dedupe: "session" },
  );
}

export function trackDiagnosticAnswer(input: {
  questionNumber: number;
  questionId: string;
  category: string;
  totalSteps: number;
}) {
  return pushToDataLayer(
    "diagnostico_pergunta_respondida",
    {
      session_id: getSessionId(),
      numero_pergunta: input.questionNumber,
      id_pergunta: input.questionId,
      categoria_pergunta: input.category,
      etapa_atual: input.questionNumber,
      total_etapas: input.totalSteps,
    },
    { dedupe: "session", key: `diagnostico_pergunta_respondida:${input.questionNumber}` },
  );
}

export function trackDiagnosticProgress(percent: 25 | 50 | 75 | 100, currentStep: number) {
  return pushToDataLayer(
    "diagnostico_progresso",
    {
      session_id: getSessionId(),
      percentual: percent,
      etapa_atual: currentStep,
    },
    { dedupe: "session", key: `diagnostico_progresso:${percent}` },
  );
}

export function trackDiagnosticCompleted(input: {
  score: number;
  risk: string;
  answerCount: number;
  leadId?: string;
  segment?: string;
}) {
  const startedAt = Date.parse(sessionStorage.getItem(DIAGNOSTIC_STARTED_AT_KEY) || "");
  const elapsedSeconds = Number.isFinite(startedAt) ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
  return pushToDataLayer(
    "diagnostico_concluido",
    {
      session_id: getSessionId(),
      lead_id: input.leadId,
      pontuacao: input.score,
      nivel_risco: input.risk,
      quantidade_respostas: input.answerCount,
      segmento: input.segment,
      tempo_conclusao_segundos: elapsedSeconds,
    },
    { dedupe: "session" },
  );
}

export function trackLeadFormViewed() {
  return pushToDataLayer(
    "formulario_lead_visualizado",
    { session_id: getSessionId() },
    { dedupe: "session" },
  );
}

export function trackLeadCaptured(input: { leadId: string; score: number; risk: string; segment: string }) {
  return pushToDataLayer(
    "lead_capturado",
    {
      lead_id: input.leadId,
      session_id: getSessionId(),
      nivel_risco: input.risk,
      pontuacao: input.score,
      segmento: input.segment,
      meta_event_name: "Lead",
      content_name: FUNNEL,
      content_category: "diagnostico",
    },
    { dedupe: "session" },
  );
}

function lossRange(value: number) {
  if (value <= 500) return "ate_500";
  if (value <= 1500) return "de_500_a_1500";
  if (value <= 3000) return "de_1500_a_3000";
  return "acima_de_3000";
}

export function trackResultViewed(input: {
  leadId: string;
  score: number;
  risk: string;
  estimatedLoss: number;
  segment: string;
}) {
  return pushToDataLayer(
    "resultado_visualizado",
    {
      lead_id: input.leadId,
      session_id: getSessionId(),
      pontuacao: input.score,
      nivel_risco: input.risk,
      perda_estimada_faixa: lossRange(input.estimatedLoss),
      segmento: input.segment,
    },
    { dedupe: "session" },
  );
}

export function trackVideoStarted(leadId?: string) {
  return pushToDataLayer(
    "video_iniciado",
    {
      video_id: "7eZMWOIN3VU",
      video_title: "historia_precifica_mix",
      lead_id: leadId,
      session_id: getSessionId(),
    },
    { dedupe: "session" },
  );
}

export function trackCheckoutStarted(input: {
  leadId?: string;
  score: number;
  risk: string;
  segment: string;
}) {
  const now = Date.now();
  if (now - lastCheckoutAt < 1500) return false;
  lastCheckoutAt = now;
  return pushToDataLayer("checkout_iniciado", {
    lead_id: input.leadId,
    session_id: getSessionId(),
    pontuacao: input.score,
    nivel_risco: input.risk,
    segmento: input.segment,
    produto: PRODUCT,
    valor: 37,
    currency: "BRL",
    meta_event_name: "InitiateCheckout",
    content_name: PRODUCT,
    content_category: "pagamento_unico",
  });
}

export function buildCheckoutUrl(baseUrl: string, tracking: TrackingParams) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" || !/(^|\.)hotmart\.com$/i.test(url.hostname)) return null;
    trackingKeys.forEach((key) => {
      const value = tracking[key];
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    return url.toString();
  } catch {
    return null;
  }
}

export function buildYoutubeEmbedUrl(sourceUrl: string | null) {
  if (!sourceUrl) return null;
  try {
    const url = new URL(sourceUrl);
    const id = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1`;
  } catch {
    return null;
  }
}
