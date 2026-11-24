// Código base do Meta Pixel (inline, carregado por <MetaPixelScript/>).
// Fica num módulo próprio para o teste executar exatamente o texto que vai à página.
//
// fbq.disablePushState = true: o fbevents.js instala ganchos em history.pushState,
// replaceState e popstate e manda um PageView AUTOMÁTICO a cada troca de URL.
// Esse PageView não passa pelo nosso gate de consentimento: se o visitante recusar
// em outra aba, esta aba continua destravada e o fbevents envia o PageView da
// próxima navegação. Com o gancho desligado, o único PageView de rota é o do
// <MetaPixelRouter/>, que relê o cookie no momento do envio.
//
// fbq.allowDuplicatePageViews = true: sem isso o fbevents descarta todo
// fbq('track','PageView') depois do primeiro da página (dedupe por pixel), e o
// PageView de rota do <MetaPixelRouter/> nunca sairia.
//
// Os dois flags precisam estar no stub ANTES de o fbevents.js carregar e antes do
// 'init' (o fbevents lê disablePushState ao instalar os ganchos).
export function scriptBasePixel(pixelId: string): string {
  return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq.disablePushState=true;
fbq.allowDuplicatePageViews=true;
// LGPD — init UMA vez; PageView só em estado 'grant'. Ler o consentimento ANTES
// de qualquer track: 'consent','revoke' antes do init trava a fila do fbq (queue
// nunca drena, configCount=0) e o PageView acabava contado em 'revoke' sem beacon.
// Visitante recorrente que já consentiu → grant ANTES do track. Sem consentimento
// → revoke e NENHUM track; <MetaPixelRouter/> dispara o PageView ao aceitar o banner.
fbq('init','${pixelId}');
(function(){var ok=false;try{var m=document.cookie.match(/(?:^|; )sixxis_consent=([^;]+)/);if(m){var c=JSON.parse(decodeURIComponent(m[1]));ok=(c.m===1||c.marketing===true);}}catch(e){}if(ok){fbq('consent','grant');fbq('track','PageView');}else{fbq('consent','revoke');}})();
`
}
