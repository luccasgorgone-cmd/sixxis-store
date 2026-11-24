// Railway Infrastructure as Code — substitui o railway.json (Config as Code),
// que o Railway deixa de ler em 2026-12-01 (hard cutoff).
// Docs: https://docs.railway.com/infrastructure-as-code
//
// Projeto "balanced-luck", ambiente production, serviço único "sixxis-store".
// Partial nomeado: este arquivo só gerencia o que declara (o serviço da loja).
// Variáveis NÃO são gerenciadas aqui (ficam no painel do Railway).
//
// Valores idênticos ao railway.json de origin/main:
//   preDeploy  npx prisma migrate deploy  (migração aditiva antes do deploy)
//   start      npm run start
//   healthcheck /api/health, timeout 300 s
//   restart    ON_FAILURE, 10 tentativas
// Em 24/11 o painel do serviço NÃO tinha startCommand nem preDeployCommand
// (lidos via GraphQL, só leitura): sem migrar, o deploy pararia de rodar as
// migrações do Prisma depois de 01/12.
import { defineRailway, project, service } from "railway/iac";

export const partial = "sixxis-store";

export default defineRailway(() => {
  const store = service("sixxis-store", {
    start: "npm run start",
    preDeploy: "npx prisma migrate deploy",
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    deploy: {
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 10,
    },
  });

  return project("balanced-luck", {
    resources: [store],
  });
});
