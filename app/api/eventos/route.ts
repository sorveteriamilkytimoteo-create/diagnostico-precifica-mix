import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getAdminDb } from "../../lib/firebase-admin";

export const runtime = "nodejs";

const PRODUCT = "precifica_mix";
const FUNNEL = "diagnostico_precifica_mix";

function clean(value: unknown, limit = 200) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessionId?: unknown;
      tipo?: unknown;
      pergunta?: unknown;
      diagnosticoId?: unknown;
    };
    const sessionId = clean(body.sessionId, 100);
    const tipo = clean(body.tipo, 100);
    if (!sessionId || !tipo) {
      return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
    }

    const pergunta = typeof body.pergunta === "number" ? body.pergunta : null;
    const diagnosticoId = clean(body.diagnosticoId, 100);
    const id = createHash("sha256")
      .update([PRODUCT, sessionId, tipo, String(pergunta ?? ""), diagnosticoId].join("|"))
      .digest("hex");
    await getAdminDb().collection("eventos").doc(id).set({
      id,
      produto: PRODUCT,
      funil: FUNNEL,
      session_id: sessionId,
      tipo,
      pergunta,
      diagnostico_id: diagnosticoId,
      timestamp: Date.now(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
    return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 500 });
  }
}
