import { AnalyticsProvider } from "../components/AnalyticsProvider";

function validGtmId(value: string | undefined) {
  return value && /^GTM-[A-Z0-9]+$/i.test(value) ? value : null;
}

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gtmId = validGtmId(process.env.NEXT_PUBLIC_GTM_ID);

  return (
    <>
      {gtmId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
            height="0"
            width="0"
            className="hidden invisible"
            title="Google Tag Manager"
          />
        </noscript>
      )}
      <AnalyticsProvider />
      {children}
    </>
  );
}
