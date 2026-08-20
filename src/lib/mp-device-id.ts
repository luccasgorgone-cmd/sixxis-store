// O SDK do Mercado Pago (initMercadoPago, via @mercadopago/sdk-react) injeta
// o script de segurança automaticamente e cria esta variável global assim que
// carrega — é o "Device ID" que o antifraude deles usa pra distinguir compra
// legítima de dispositivo desconhecido. Documentado como X-meli-session-id.
// Sem isso, o motor de risco tem menos sinal e fica mais conservador (mais
// cc_rejected_high_risk falso-positivo).
export function capturarDeviceIdMp(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { MP_DEVICE_SESSION_ID?: string }).MP_DEVICE_SESSION_ID
}
