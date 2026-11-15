// 모노레포 공용 ESLint 설정 (ESLint 10: 각 파일 위치에서 상위로 올라오며 이 파일을 찾습니다)
import { createRequire } from "node:module";
import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import pluginReactHooks from "eslint-plugin-react-hooks";
import turboPlugin from "eslint-plugin-turbo";
import { globalIgnores } from "eslint/config";
import globals from "globals";

// 프리셋을 루트 기준으로 resolve 합니다. (@svgr/webpack 이 쓰는 Babel 7과 섞이지 않도록)
const require = createRequire(import.meta.url);

/** @type {import("eslint").Linter.Config[]} */
export default [
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/out/**",
    "**/build/**",
    "**/dist/**",
    "**/next-env.d.ts",
  ]),
  // .ts / .tsx 도 검사 대상에 포함
  { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"] },
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [require.resolve("@babel/preset-typescript")],
        },
      },
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    plugins: {
      turbo: turboPlugin,
      onlyWarn,
      "@next/next": pluginNext,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  // TSX: Babel 8 은 확장자로 JSX 를 켜지 않으므로 파서 플러그인을 직접 지정
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        babelOptions: {
          presets: [require.resolve("@babel/preset-typescript")],
          parserOpts: { plugins: ["jsx"] },
        },
      },
    },
  },
  // TS: 정의/미사용 식별자는 tsc 가 검사합니다. (noUnusedLocals)
  // Babel 파서는 타입·JSX 에서 쓰인 이름을 인식하지 못해 오탐이 나므로 끕니다.
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  pluginReactHooks.configs.flat.recommended,
  // Next.js (apps 와 apps 에서 렌더링되는 packages 공통)
  {
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      // 이미지는 admin 업로드 때 미리 최적화(WebP · 크기 축소)하므로 next/image 대신 <img> 를 씁니다.
      "@next/next/no-img-element": "off",
    },
  },
];
