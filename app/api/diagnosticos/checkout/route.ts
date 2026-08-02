import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

const PRODUCT = "precifica_mix";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: unknown; sessionId?: unknown };
    const id = typeof body.id === "string" ? body.id : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";

    if (!id || !sessionId) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const reference = getAdminDb().collection("diagnosticos").doc(id);
    const snapshot = await reference.get();
    if (
      !snapshot.exists
      || snapshot.data()?.session_id !== sessionId
      || snapshot.data()?.produto !== PRODUCT
    ) {
      return NextResponse.json({ error: "Diagnóstico não encontrado." }, { status: 404 });
    }

    await reference.update({
      clicou_checkout: 1,
      checkout_clicked_at: new Date().toISOString(),
      funnel_status: "checkout_iniciado",
      produto_checkout: PRODUCT,
      valor_checkout: 37,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao registrar checkout:", error);
    return NextResponse.json({ error: "Não foi possível registrar o checkout." }, { status: 500 });
  }
}
