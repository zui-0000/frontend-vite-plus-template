import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  staged: {
    // .tsp や生成した openapi.yaml だけをコミットすると対象ファイルが 0 件になり、エラーで止まるのを防ぐ
    "*": "vp check --fix --no-error-on-unmatched-pattern",
    // oxfmt は TypeSpec を整形できないので、TypeSpec の整形コマンドを使う
    "*.tsp": "tsp format",
  },
  run: {
    tasks: {
      // TypeSpec（schema/）から OpenAPI（schema/dist/openapi.yaml）を出力する
      "gen:schema": {
        command: "tsp compile schema",
      },
      // OpenAPI から fetch クライアント（src/generated/api/、.gitignore 済み）を生成する。先に gen:schema を動かす。
      // どちらもキャッシュが効くので、schema/ を変えていなければ実行を飛ばして結果を戻すだけになる
      "gen:api": {
        command: "orval",
        dependsOn: ["gen:schema"],
      },
    },
  },
  fmt: {
    ignorePatterns: [
      // docs/ は書いた時点の記録なので整形しない（表の桁揃えや、コード例の JSON に末尾カンマが足されるのを防ぐ）
      "docs/**",
      // tsp の出力をそのままコミットする。整形すると、生成し直したときに差分が出る
      "schema/dist/**",
      // 生成物（.gitignore 済み）。整形の対象にしない
      "src/generated/**",
    ],
  },
  lint: {
    // 生成したコードは手で直さないので lint しない（型チェックは tsc -b で行う）
    ignorePatterns: ["src/generated/**"],
    plugins: ["react", "typescript", "oxc"],
    rules: {
      "react/rules-of-hooks": "error",
      "react/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
      // ----------------------------------------------------------------------
      // React Compiler 系のルール。
      // 違反があると Compiler が最適化をスキップするので error にする（docs/05 を参照）
      // ----------------------------------------------------------------------
      "react/error-boundaries": "error",
      "react/globals": "error",
      "react/immutability": "error",
      "react/incompatible-library": "error",
      "react/preserve-manual-memoization": "error",
      "react/purity": "error",
      "react/refs": "error",
      "react/set-state-in-effect": "error",
      "react/set-state-in-render": "error",
      "react/static-components": "error",
      "react/unsupported-syntax": "error",
      "react/use-memo": "error",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__setup__/setup.ts"],
  },
  plugins: lazyPlugins(() => [react({ compiler: true })]),
});
