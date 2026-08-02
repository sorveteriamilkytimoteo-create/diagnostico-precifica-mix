import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://diagnostico-precifica-mix.vercel.app"),
  title: "Diagnóstico gratuito de precificação para food service",
  description: "Descubra em menos de 2 minutos se os preços do seu restaurante, delivery ou negócio de alimentação estão consumindo sua margem.",
  openGraph: {
    title: "Seus preços estão consumindo o lucro do seu negócio?",
    description: "Faça o diagnóstico gratuito e receba uma análise sobre custos, fichas técnicas, taxas e estoque.",
    type: "website",
    locale: "pt_BR",
    siteName: "Precifica Mix",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Diagnóstico de Precificação Precifica Mix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diagnóstico gratuito de precificação",
    description: "Descubra onde a margem do seu negócio pode estar escapando.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#009b70",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Diagnóstico de Precificação Precifica Mix",
              description: "Diagnóstico gratuito de custos, precificação e estoque para food service.",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
