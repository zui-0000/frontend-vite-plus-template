import { defineConfig } from "orval";

// schema/ の TypeSpec から出力した OpenAPI を読んで、src/generated/api/ に TanStack Query のフックと
// MSW のモック（ハンドラー）を生成する。
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
      // TanStack Query のフック（useListTodos など）とクエリキーを生成する。通信は fetch で行う
      client: "react-query",
      httpClient: "fetch",
      // OpenAPI のスキーマから、faker でデータを作る MSW のハンドラーを生成する（todos.msw.ts）。
      // indexMockFiles で全タグのハンドラーをまとめた index.msw.ts も作る
      mock: {
        indexMockFiles: true,
        generators: [{ type: "msw", delay: false }],
      },
      // 生成のたびに出力先を消してから作る。消えた API のファイルが残らないようにする。
      // 消すのは target のフォルダごとなので、src/generated/ 直下ではなく api/ を target にして、他の生成物を巻き込まない
      clean: true,
      override: {
        // エラー応答（4xx・5xx）は customFetch が throw し、TanStack Query の error に入れる。
        // 戻り値の型は成功の応答だけになる（data.status で毎回絞り込まなくてよい）
        fetch: { forceSuccessResponse: true },
        // useListTodos（読み込み中の状態あり）に加えて、useListTodosSuspense（Suspense で読む）と
        // prefetchListTodosQuery（ルートの loader で先に取る）を作る
        query: { useSuspenseQuery: true, usePrefetch: true },
        // fetch を直接呼ばず、ベース URL などを足す自前の関数を通す
        mutator: {
          path: "./src/utils/fetcher.ts",
          name: "customFetch",
        },
      },
    },
  },
});
