import { defineConfig } from "orval";

// schema/ の TypeSpec から出力した OpenAPI を読んで、src/generated/api/ に fetch クライアントを生成する。
// 生成物は .gitignore 済み（コミットしない）。`vp install` の prepare でも生成する
// 生成は `vp run gen:api`（vite.config.ts の run.tasks を参照）
export default defineConfig({
  api: {
    input: {
      target: "./schema/dist/openapi.yaml",
    },
    output: {
      // タグ（TypeSpec の @tag）ごとにファイルを分ける。Todos タグなら generated/api/todos/todos.ts
      mode: "tags-split",
      target: "./src/generated/api",
      schemas: "./src/generated/api/models",
      client: "fetch",
      // 生成のたびに出力先を消してから作る。消えた API のファイルが残らないようにする。
      // 消すのは target のフォルダごとなので、src/generated/ 直下ではなく api/ を target にして、他の生成物を巻き込まない
      clean: true,
      override: {
        // fetch を直接呼ばず、ベース URL などを足す自前の関数を通す
        mutator: {
          path: "./src/api/fetcher.ts",
          name: "customFetch",
        },
      },
    },
  },
});
