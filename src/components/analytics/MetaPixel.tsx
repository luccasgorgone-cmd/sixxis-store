import Script from 'next/script'

// Base do Meta Pixel — espelha o padrão de GtmScript.tsx (server component,
// next/script afterInteractive, guard por env). NÃO instale o Pixel também via
// GTM: disparo dobrado. A camada de eventos vive em lib/analytics/meta-pixel.ts
// e os PageViews de troca de rota em <MetaPixelRouter/>.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function MetaPixelScript() {
  if (!PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
// LGPD — init UMA vez; PageView só em estado 'grant'. Ler o consentimento ANTES
// de qualquer track: 'consent','revoke' antes do init trava a fila do fbq (queue
// nunca drena, configCount=0) e o PageView acabava contado em 'revoke' sem beacon.
// Visitante recorrente que já consentiu → grant ANTES do track. Sem consentimento
// → revoke e NENHUM track; <MetaPixelRouter/> dispara o PageView ao aceitar o banner.
fbq('init','${PIXEL_ID}');
(function(){var ok=false;try{var m=document.cookie.match(/(?:^|; )sixxis_consent=([^;]+)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));ok=(c.m===1||c.marketing===true);}}catch(e){}if(ok){fbq('consent','grant');fbq('track','PageView');}else{fbq('consent','revoke');}})();
        `,
      }}
    />
  )
}

export function MetaPixelNoScript() {
  if (!PIXEL_ID) return null

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        alt=""
        src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  )
}
