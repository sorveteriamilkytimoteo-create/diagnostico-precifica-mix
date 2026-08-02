"use client";

import { useEffect, useRef } from "react";

export function TrackedYouTubeVideo({
  src,
  onStarted,
}: {
  src: string;
  onStarted: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/i.test(event.origin)) return;
      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (message?.event === "onStateChange" && message?.info === 1) onStarted();
      } catch {
        // Mensagens externas inválidas são ignoradas sem afetar o player.
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onStarted]);

  function connectPlayer() {
    const player = iframeRef.current?.contentWindow;
    if (!player) return;
    player.postMessage(JSON.stringify({ event: "listening", id: "pm-product-video" }), "*");
    player.postMessage(
      JSON.stringify({
        event: "command",
        func: "addEventListener",
        args: ["onStateChange"],
        id: "pm-product-video",
      }),
      "*",
    );
  }

  return (
    <div className="mx-auto mt-10 aspect-[9/16] w-full max-w-[390px] overflow-hidden rounded-[26px] border border-white/10 bg-black shadow-[0_20px_60px_rgba(0,0,0,.32)]">
      <iframe
        ref={iframeRef}
        className="h-full w-full"
        src={src}
        title="Vídeo do Precifica Mix"
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        onLoad={connectPlayer}
      />
    </div>
  );
}
