import { ImageResponse } from "next/og";

export const alt = "Diagnóstico de Precificação Precifica Mix";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #effaf6 0%, #ffffff 58%, #dff6ed 100%)",
        color: "#111827",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "70px 100px",
        textAlign: "center",
        width: "100%",
      }}
    >
      <div style={{ color: "#008c66", display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 2 }}>
        DIAGNÓSTICO GRATUITO PARA FOOD SERVICE
      </div>
      <div style={{ display: "flex", fontSize: 70, fontWeight: 900, lineHeight: 1.05, marginTop: 30, maxWidth: 980 }}>
        Seus preços estão consumindo o lucro do seu negócio?
      </div>
      <div style={{ color: "#64716a", display: "flex", fontSize: 30, marginTop: 30 }}>
        Descubra em menos de 2 minutos.
      </div>
      <div style={{ alignItems: "center", display: "flex", marginTop: 45 }}>
        <div style={{ alignItems: "center", background: "#009b70", borderRadius: 16, color: "white", display: "flex", fontSize: 28, fontWeight: 900, height: 58, justifyContent: "center", width: 58 }}>P</div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 900, marginLeft: 14 }}>Precifica<span style={{ color: "#009b70" }}>Mix</span></div>
      </div>
    </div>,
    size,
  );
}
