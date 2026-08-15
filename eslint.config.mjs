import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Burndown de lint (WORKORDER Fase 4): 1ª regra levada a zero — nenhum
  // "eslint-disable" órfão (suprimindo um problema que já não existe mais)
  // sobrevive sem barulho. Promovida de warn (default do preset) pra error
  // pra travar a regressão.
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
  },
]);

export default eslintConfig;
