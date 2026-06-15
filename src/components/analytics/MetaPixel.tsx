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
// LGPD: nega por padrão (mirror do Google Consent Mode 'default deny' no layout).
// <MetaPixelRouter/> concede ao vivo quando o marketing é aceito no banner; aqui
// restauramos o consentimento do visitante recorrente lendo o cookie sixxis_consent.
fbq('consent','revoke');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');
try{var m=document.cookie.match(/(?:^|; )sixxis_consent=([^;]+)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));if(c.m===1||c.marketing===true){fbq('consent','grant');}}}catch(e){}
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
