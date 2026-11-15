# TanStack Query・Router・MSW・Zustand の導入

記録日: 2026-11-15 / 対象: `@tanstack/react-query` 5.107.1、`@tanstack/react-router` 1.170.46、`@tanstack/router-plugin` 1.169.0、`msw` 3.0.5、`@faker-js/faker` 10.6.0、`zustand` 5.1.0、`orval` 8.47.0

docs/09 で入れた「TypeSpec → OpenAPI → orval」の仕組みに、データ取得（TanStack Query）・ルーティング（TanStack Router）・API のモック（MSW）・クライアントの状態管理（Zustand）を足した。手順と、それぞれの理由を残す。

## まとめ

```bash
vp add zustand @tanstack/react-query @tanstack/react-router
vp add -D @tanstack/router-plugin msw @faker-js/faker
```

- orval の出力を fetch のクライアントから **TanStack Query のフック + MSW のハンドラー** に変えた（`useListTodos`・`getTodosMock` など）
- ルーティングは **ファイルベース**。`src/routes/` から `src/routeTree.gen.ts` が生成される（これはコミットする）
- `vp dev` は既定で **MSW のモックで動く**（`src/env/.env` の `VITE_ENABLE_MSW=true`）。バックエンドがなくても画面を作れる
- 単体テストはロジック（ストアなど）だけに書く。コンポーネントの単体テストは書かない。API を呼ぶテストは MSW（`msw/node`）で差し替える
- サンプルとして `/todos`（一覧・作成・「完了したものを隠す」）を置いた
- `vp check`・`vp test`・`vp build` が通り、本番のバンドルに MSW が入らないことを確かめた

| 役割 | 担当 | 置き場所 |
| --- | --- | --- |
| サーバーから取るデータ（サーバーの状態） | TanStack Query | orval が生成するフック（`src/generated/api/`） |
| 画面の中だけの状態（クライアントの状態） | Zustand | `src/stores/{ドメイン}/*Store.ts` |
| URL とページの対応 | TanStack Router | `src/routes/` |
| API のモック | MSW | `src/mocks/`（ハンドラーは orval が生成） |

## 構成

```
src/
├── main.tsx                  # 入口。MSW を（必要なら）起動してから RouterProvider を描画する
├── router.tsx                # createAppRouter。QueryClient を作り、ルーターの context に渡す
├── routeTree.gen.ts          # 生成物（TanStack Router）。コミットする
├── routes/                   # ルートの定義だけを書く（コンポーネントは components/ に置く）
│   ├── __root.tsx
│   ├── index.tsx             # /
│   └── todos/index.tsx       # /todos。loader でデータを先に取る
├── components/
│   ├── pages/                # ページ。features の部品を並べるだけ（ルートの数だけある）
│   │   ├── Home/             #   index.tsx + index.module.css
│   │   └── Todo/             #   index.tsx + index.module.css
│   ├── features/             # 機能ごとの部品・状態（package by feature）
│   │   └── Todo/
│   │       ├── TodoList/index.tsx        # 一覧（TanStack Query のキャッシュを読む）
│   │       ├── TodoCreateForm/index.tsx  # 作成（mutation）
│   │       └── todoListParams.ts
│   ├── layouts/
│   │   └── RootLayout/index.tsx  # 全ページ共通のレイアウト
│   └── ui/                   # 機能に依らない汎用の部品（ボタンなど）。今は空（.gitkeep）
├── stores/                   # Zustand のストア。ドメインごとにフォルダを切る
│   └── todo/
│       └── todoFilterStore.ts (+ .test.ts)
├── styles/
│   └── main.css              # 全体に効くスタイル（CSS 変数・body・見出しなど）。main.tsx で読む
├── env/
│   ├── .env                  # 環境変数の既定値（vite.config.ts の envDir で指定）
│   └── env.d.ts              # import.meta.env の型
├── mocks/
│   ├── handlers.ts           # orval が生成したハンドラーをまとめる
│   ├── browser.ts            # 開発中のブラウザ用（setupWorker）
│   └── server.ts             # テスト用（setupServer）
├── utils/fetcher.ts          # orval の mutator（ベース URL・エラー処理）
└── generated/api/            # 生成物（orval）。.gitignore 済み
```

`components/` は `pages/`・`features/`・`ui/` の 3 つを必ず置く。

| フォルダ | 置くもの | 依存してよい先 |
| --- | --- | --- |
| `pages/` | ページ。ルート（`src/routes/`）から `component` として使う | `features/`・`ui/`・`layouts/` |
| `features/` | 機能ごとの部品と、それだけが使う値（クエリのパラメーターなど） | `ui/`・`src/stores/`・生成した API |
| `ui/` | 機能に依らない見た目だけの部品 | なし（他の `components/` に依存しない） |

### 1 コンポーネント 1 フォルダ

コンポーネントはフォルダを切り、`index.tsx` とスタイルの `index.module.css`（CSS Modules）を置く（`pages/Todo/index.tsx`）。import は `~/components/pages/Todo` のようにフォルダ名で書ける（TS の解決で `index.tsx` が選ばれる）。フォルダ名はコンポーネントと同じ PascalCase にした。クエリのパラメーターのような、その機能だけが使うコンポーネントでないファイルは、機能のフォルダ（`features/Todo/`）の直下に置く。Zustand のストアは `src/stores/` に置く（下の「Zustand: クライアントの状態」を参照）。

ファイル名の付け方:

| 種類 | 形 | 例 |
| --- | --- | --- |
| コンポーネントのフォルダ | PascalCase | `TodoList/index.tsx` |
| それ以外の `.ts` | lowerCamelCase（ケバブケースにしない） | `todoFilterStore.ts`・`todoListParams.ts` |
| ツールが名前を決めているもの | そのツールの決まりのまま | `routes/__root.tsx`（TanStack Router）・`routeTree.gen.ts`・`vite.config.ts` |

lowerCamelCase にしたのは、ファイルが export する関数・変数の名前（`useTodoFilterStore`・`todoListParams`）と見た目を揃えるため。

スタイルは、全体に効くもの（`src/styles/main.css`）と、コンポーネントごとのもの（`index.module.css`）に分けた。CSS Modules はビルド時にクラス名を一意な名前（`._center_19ud2_60` など）に変えるので、別のコンポーネントと同じクラス名を付けてもぶつからない。Vite が標準で扱えるので、設定は要らない。TS で言えば、クラス名をファイルのスコープに閉じ込める仕組み（グローバル変数ではなく module のスコープ）。

Vite の雛形の `App.css` を `pages/Home/index.module.css` にしたときは、次の 3 つを直した。

- `id`（`#center` など）の指定を `class` に変えた。CSS Modules の書き方に揃え、`className={styles.center}` で付ける
- クラス名のハイフンを camelCase にした（`.button-icon` → `.buttonIcon`）。`styles.buttonIcon` と書けるようにするため（ハイフンのままだと `styles["button-icon"]` になる）
- 全体のスタイルにあった `.counter` の指定（フォント・`inline-flex`）は、モジュールの `.counter` に移した。モジュールのクラス名は一意な名前に変わるので、全体のスタイルの `.counter` はもう当たらないため

macOS のファイルシステムは大文字と小文字を区別しないので、`home/` を `Home/` に変えるときは、別の名前を挟んで 2 回リネームした（`mv home _tmp && mv _tmp Home`）。Git は `core.ignorecase = true` でも、パスの大文字と小文字を正しく記録していた（`git ls-files` で確認）。

### 依存の向き

依存の向きを `pages → features → ui` の一方向にしておくと、`ui/` の部品はどの機能からでも使え、`features/` は他のページに持っていける。`ui/` は今回作っていないが、置き場所を先に決めておくために `.gitkeep` だけ置いた（Git は空のフォルダを管理しないため）。レイアウトはページでも機能でもないので、`layouts/` に分けた。

ルートのファイル（`src/routes/`）にはルートの定義だけを書き、コンポーネントは `components/` に置いた。理由は 2 つ。

- 同じファイルでコンポーネントと `Route`（コンポーネントではない値）を export すると、React の Fast Refresh が効かなくなる（oxlint の `react/only-export-components` が警告する）
- `src/routes/` の中のファイルはすべてルートとして扱われるので、部品やテストを置けない（置くなら `-` で始まる名前にして除外する）

### `router.tsx` を `routes/` の中に置かない理由

`src/router.tsx` と `src/routes/` は同じ階層（`src/` の直下）にある。`routes/` の**中**に入れることもできるが、そうしなかった。

- `src/routes/` の中のファイルは、プラグインがすべてルートの候補として読む。`router.tsx` を置くと、ルートの定義（`Route` の export）がないファイルとして扱われ、警告やエラーになる
- 避けるには `-router.tsx` のように `-` で始まる名前にする（`routeFileIgnorePrefix` の既定が `-`）か、`routeFileIgnorePattern` で除外する必要があり、ファイル名や設定に特別なルールが増える
- `routeTree.gen.ts` を `src/` 直下に置くのが既定で、`router.tsx` はそれを import する。同じ階層に並べるのが公式の例と同じ形

### 環境変数を `src/env/` に置く

`.env` と型の `env.d.ts` を `src/env/` にまとめた。Vite は既定でプロジェクトのルートから `.env` を読むので、`vite.config.ts` に `envDir: "src/env"` を書いた。`vp dev` で `import.meta.env.VITE_ENABLE_MSW` が `"true"` になる（`src/env/.env` の値が読まれている）ことを確かめた。自分の環境だけ変えるときは `src/env/.env.local`（`.gitignore` の `*.local` で除外される）に書く。

## TanStack Query: orval にフックを生成させる

```ts
// orval.config.ts（抜粋）
client: "react-query",
httpClient: "fetch",
override: {
  fetch: { forceSuccessResponse: true },
  query: { useSuspenseQuery: true, usePrefetch: true },
  mutator: { path: "./src/utils/fetcher.ts", name: "customFetch" },
},
```

| 設定 | 理由 |
| --- | --- |
| `client: "react-query"` | `useListTodos()`・`useCreateTodo()` などのフックと、クエリキー（`getListTodosQueryKey()`）まで生成される。手で書くのは `QueryClientProvider` だけになる |
| `httpClient: "fetch"` | 通信は fetch のまま。axios は入れない |
| `fetch.forceSuccessResponse: true` | 下の「エラーを Query の `error` に入れる」を参照 |
| `query.useSuspenseQuery: true` | `useListTodosSuspense()` を作る。loader で先に取ったデータを、読み込み中の分岐なしで読める |
| `query.usePrefetch: true` | `prefetchListTodosQuery(queryClient, params)` を作る。ルートの loader から呼ぶ |

docs/09 では「データ取得のライブラリは使う側で選ぶ」として `client: "fetch"` にしていたが、テンプレートに TanStack Query を入れると決めたので、フックまで生成させるほうに変えた。

### エラーを Query の `error` に入れる

`client: "fetch"` のときの `customFetch` は、404 や 500 でも throw せずに `{ data, status }` を返していた。このままフックにすると、TanStack Query からは**エラーの応答も成功に見える**（`isError` が `true` にならず、`data` にエラーの本文が入る）。

そこで次のようにした。

1. `forceSuccessResponse: true` で、生成される関数の戻り値の型を**成功の応答だけ**にする
2. `customFetch` は `response.ok` でないとき、エラーの本文（`ResourceNotFoundError` など）を throw する

orval が生成するフックのエラーの型（`TError`）は、もともと `ResourceNotFoundError | InternalServerError` のようなエラーの本文の型になっている。本文をそのまま throw すると、この型と実際の値が一致する。

```ts
const { data, error } = useGetTodo(id);
if (error) {
  error.code; // "4040" | "5000"（リテラル型。docs/09 のエラー設計がそのまま効く）
}
```

ただし、ネットワークのエラー（fetch 自体が失敗したときの `TypeError`）は本文ではないので、`TError` の型とは一致しない。厳密に扱いたくなったら、`customFetch` で `ApiError` のようなクラスに包む。

### loader で先に取り、コンポーネントでキャッシュを読む

```tsx
// src/routes/todos/index.tsx
loader: ({ context }) => prefetchListTodosQuery(context.queryClient, todoListParams),

// src/components/features/Todo/TodoList/index.tsx
const { data: { data } } = useListTodosSuspense(todoListParams);
```

Router が遷移のときに loader を動かし、データをキャッシュに入れてから描画する。コンポーネントは同じクエリキーでキャッシュを読むだけなので、読み込み中の表示が出ない。リンクにマウスを乗せた時点で loader を動かす設定（`defaultPreload: "intent"`）も入れた。

TanStack Router の公式の組み合わせ方（`@tanstack/react-router` に同梱されている skill の `router-query`）に従い、ルーターに `defaultPreloadStaleTime: 0` を指定した。Router にもプリロードしたデータのキャッシュ（既定 30 秒）があり、これが効いていると、データの鮮度を TanStack Query が管理できなくなるため。

## TanStack Router: ファイルベースのルーティング

```ts
// vite.config.ts
plugins: lazyPlugins(() => [
  tanstackRouter({ target: "react", autoCodeSplitting: true }),
  react({ compiler: true }),
  ...
]),
```

| 決めたこと | 理由 |
| --- | --- |
| ファイルベース（コードで書く方式ではなく） | 公式の推奨。`src/routes/` のファイルからルートの型が生成され、`<Link to="/todos">` の打ち間違いが型エラーになる |
| `autoCodeSplitting: true` | ルートごとにコードが分割される（ルートの `component` が別のファイルとして出力される）。`lazy` を手で書かなくてよい |
| `tanstackRouter()` を `react()` より前に置く | 公式に「後ろに置くと、生成とコード分割が黙って動かない」とある |
| `QueryClient` をルーターの context で渡す | loader から `context.queryClient` で使える。`__root.tsx` の `createRootRouteWithContext<{ queryClient: QueryClient }>()` で型を付ける |
| `createAppRouter()` を関数にした | `history` と `QueryClient` を外から渡せるようにするため（Storybook や E2E で、決まったパス・設定で作るとき） |

Vite+ では `vite` が `vite-plus-core` に置き換わっているが、プラグインはそのまま動いた（`vp build` でルート定義の生成とコード分割を確かめた）。

### `routeTree.gen.ts` はコミットする

orval の生成物（`src/generated/`）は `.gitignore` にしたが、`routeTree.gen.ts` はコミットする。

- 公式（`@tanstack/router-plugin` に同梱されている skill）に「`routeTree.gen.ts` はコミットする。アプリが実行時に使う生成されたソースだから」とある
- orval の生成物は `vp install` の `prepare` で作り直せるが、`routeTree.gen.ts` を作るのは Vite のプラグインで、`vp dev`・`vp build` を動かすまで生成されない。`vp run build` は `tsc -b` を先に動かすので、`.gitignore` にすると clone 直後の型チェックが失敗する

置き場所は既定の `src/routeTree.gen.ts` のまま。`src/generated/` は「`.gitignore` するもの」に揃えておきたいので、そこには入れなかった。lint と fmt の対象からは外した（生成し直したときに差分が出ないように）。

## MSW: orval にハンドラーを生成させる

```ts
// orval.config.ts（抜粋）
mock: {
  indexMockFiles: true,
  generators: [{ type: "msw", delay: false }],
},
```

orval が OpenAPI から、faker でデータを作るハンドラー（`todos.msw.ts`）と、全タグのハンドラーをまとめる `index.msw.ts` を生成する。手でハンドラーを書かずに、**スキーマと揃ったモック**が手に入る。`schema/` を変えて `vp run gen:api` すれば、モックも一緒に変わる。

- データは `@example` ではなく faker で作る（`useExamples` を使うと、一覧の全件が同じ値になる）。faker は TypeSpec の `@pattern`・`@minLength` などの制約を見て値を作る（`TodoId` は UUID v7 の形になる）
- `delay: false` にした。既定では応答が遅れて返り、テストが遅くなる
- 決まった値を返したいときは、生成された関数に値を渡す（`server.use(getListTodosMockHandler(getListTodosResponseMock({ todos })))`）

### 開発中のブラウザで使う

```ts
// src/main.tsx
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === "true") {
  const { worker } = await import("~/mocks/browser");
  await worker.start({ onUnhandledFrame: "bypass" });
}
```

- `src/env/.env` で `VITE_ENABLE_MSW=true` を既定にした。テンプレートにはバックエンドがないので、`vp dev` してすぐに画面が動くほうがよい。本物のバックエンドにつなぐときは `src/env/.env.local` に `VITE_ENABLE_MSW=false` と書く
- `import.meta.env.DEV` は本番ビルドで `false` に置き換わるので、`import("~/mocks/browser")` ごと消える（`dist/` に MSW のコードがないことを確かめた）

### Service Worker のスクリプトは `msw/vite` プラグインで配信する

MSW 2 までは `msw init public` で `public/mockServiceWorker.js` をコピーし、コミットしていた。MSW 3 には Vite のプラグイン（`msw/vite`）が入り、開発サーバーがスクリプトを配信してくれる。

```ts
// vite.config.ts
{ ...msw({ mode: "worker-only" }), apply: "serve" },
```

| 決めたこと | 理由 |
| --- | --- |
| プラグインで配信する（`public/` にコピーしない） | msw を上げたときに、`public/mockServiceWorker.js` の更新し忘れ（版のずれの警告）が起きない |
| `mode: "worker-only"` | 既定の `auto` は `virtual:msw` という仮想モジュールを使う方式で、中身は `msw/experimental`（実験的な API）。テンプレートでは安定した `setupWorker` を使い、プラグインにはスクリプトの配信だけをさせる |
| `apply: "serve"` | `worker-only` のときは、ビルドの出力にも `mockServiceWorker.js` が出る（プラグインのソースで確認）。本番には要らないので、開発サーバーのときだけ使う |

### テストで使う

`src/__setup__/setup.ts` で、全テストの前に `server.listen()` する。テストごとに `server.resetHandlers()` で、`server.use()` で差し替えたハンドラーを戻す。

`onUnhandledFrame: "error"` にして、モックしていない API を呼んだらテストが失敗するようにした。

## Zustand: クライアントの状態

サンプルとして「完了したものを隠す」の ON/OFF を Zustand に置いた（`src/stores/todo/todoFilterStore.ts`）。

| 状態の種類 | 例 | 置き場所 |
| --- | --- | --- |
| サーバーの状態 | Todo の一覧 | TanStack Query（キャッシュ・再取得・無効化を任せる） |
| クライアントの状態（ページをまたぐ） | 絞り込みの設定 | Zustand |
| クライアントの状態（その部品の中だけ） | 入力中のタイトル | `useState` |

サーバーのデータを Zustand にコピーすると、キャッシュが 2 つになって同期の問題が起きる。Zustand には「サーバーにないもの」だけを置く。

ストアは `components/` の外の `src/stores/{ドメイン}/` に置いた（`src/stores/todo/todoFilterStore.ts`）。

- ストアはコンポーネントではなく、どの画面・部品からでも読み書きできるアプリ全体の状態。特定の機能（`features/Todo/`）の中に置くと、別の機能やレイアウトから使うときに「他の機能の中身を import する」形になる
- `src/stores/` にまとめると、クライアントの状態としてどんなものを持っているかが 1 か所で見渡せる
- フォルダはドメイン（`todo`）で切る。ストアが増えても、ドメインごとにまとまる

ストアの単体テスト（`todoFilterStore.test.ts`）は、コンポーネントを描画せずに `useTodoFilterStore.getState()` で操作と値を確かめる。ストアがモジュールに 1 つしかないので、`beforeEach` で `useTodoFilterStore.setState({ hideCompleted: false })` として初期値に戻す。

## 単体テストはロジックだけに書く

コンポーネントの単体テスト（Testing Library で描画してボタンを押すもの）は書かない。単体テストは、ストア・計算・変換などのロジックだけに書く。

- コンポーネントのテストは、見た目や DOM の構造の変更で壊れやすく、直す手間のわりに守れるものが少ない
- 画面の振る舞いは、ロジックを部品から切り出してテストし、画面全体は必要になったら E2E（Playwright など）で確かめる

テストの環境（`test.environment`）は `jsdom` のまま残し、Testing Library の依存も消していない。単体テストとは別に、DOM を使わないと確かめられない検証（ブラウザの API に依存するロジックなど）を書くことがあるため。

最初はページ（`/todos`）をルーターごと描画するテストと、Vite の雛形のカウンターのテストを置いていたが、この方針に合わせて消した。そのために入れていた `window.scrollTo` の差し替え（下の「ハマった点」）も消した。

## ハマった点

### MSW は 3.0.6 ではなく 3.0.5 で入った

3.0.6 の公開は 2026-11-15 01:14（UTC）で、追加した時点ではまだ 1 日たっていなかった。`pnpm-workspace.yaml` の `minimumReleaseAge: 1440`（1 日）が止めた結果なので、そのままにした（docs/09 の orval と同じ）。

### MSW 3 では `onUnhandledRequest` が `onUnhandledFrame` になった

`server.listen({ onUnhandledRequest: "error" })` は型エラーになる。MSW 3 は HTTP だけでなく WebSocket なども同じ仕組みで扱うようになり、リクエストではなく「フレーム」と呼ぶようになった。`onUnhandledFrame` に書き換えた（値は同じく `"bypass"`・`"warn"`・`"error"`）。

### orval の QueryOptions を `queryClient.query()` に渡すと型エラーになる

loader で `context.queryClient.query(getListTodosSuspenseQueryOptions(params))` や `ensureQueryData(...)` と書くと、`exactOptionalPropertyTypes: true` のせいで型エラーになった。orval が返すオプションの `queryFn` の型は `undefined` を許すが、`query()` の引数は `undefined` を許さない。

orval の `usePrefetch: true` で生成される `prefetchListTodosQuery(queryClient, params)` を使うと、型の受け渡しが生成コードの中で閉じるので解決した。

ただし、生成された prefetch はエラーを握りつぶす（`.catch(() => {})`）。loader では失敗せず、コンポーネントの `useListTodosSuspense` がもう一度取りに行き、そこで失敗するとエラーをルートのエラー表示（`errorComponent`。指定しなければ Router の既定の表示）に投げる。

### jsdom に `window.scrollTo` がない

TanStack Router は遷移のたびにスクロール位置を戻そうとして `window.scrollTo` を呼ぶ。jsdom は実装していないので「Not implemented: Window's scrollTo() method」と出る。テストの setup で何もしない関数にしていたが、コンポーネントのテストをやめたので、今は消してある（ルーターを描画するテストを書くなら、また要る）。

### pnpm が「Agent skills awaiting approval」と出す

`@tanstack/react-router` と `@tanstack/router-plugin` は、AI エージェント向けの説明（`skills/`）を同梱している。pnpm 12 はそれを有効にするかを `pnpm approve` で聞いてくる。ビルドスクリプトとは別物で、承認しなくてもパッケージは動くので、承認していない。中身（`node_modules/@tanstack/*/skills/*/SKILL.md`）は、このドキュメントを書くときの一次資料として読んだ。

## 既存の依存の更新

あわせて、`vp outdated` に出た古い依存を上げた。

| パッケージ | 前 | 後 | メモ |
| --- | --- | --- | --- |
| `@testing-library/user-event` | 14.6.8 | 14.6.10 | パッチ |
| `@vitejs/plugin-react` | 6.1.2 | 6.3.0 | マイナー |
| `oxc-transform-react` | 0.152.0 | 0.156.0 | 最新は 0.158.0 だが、plugin-react 6.3.0 の peer が `>=0.152.0 <0.157.0` なので 0.156.0 で止めた（docs/05 の「バージョンを上げるとき」の手順） |
| `jsdom` | 30.1.3 | 31.0.1 | メジャー。破壊的変更は canvas の実装の入れ替え（`canvas` → `@napi-rs/canvas`）・CSS の実装の入れ替え・ブロッキングスクリプトでの HTML の解析の一時停止で、このリポジトリでは canvas を使っていないので影響なし |

確かめたこと: `vp check`・`vp test`・`vp run build` が通る。開発サーバーで `/src/App.tsx`（いまの `src/components/pages/Home/index.tsx`）を開くと、変換後のコードに `_c(24)` があり、React Compiler が効いている（docs/05 の「有効になっているかの確かめ方」）。

上げなかったもの:

- `orval` 8.48.0（2026-11-14 13:58 UTC 公開）と `msw` 3.0.6（2026-11-15 01:14 UTC 公開）は、まだ 1 日たっていないので `minimumReleaseAge` で入らない。`vp outdated` にも出ない
- `oxc-transform-react` 0.158.0 は上のとおり、plugin-react が受け付けないので上げない。`vp outdated` には出続ける

### `vp add pkg@版` は catalog ではなく `package.json` に版を書く

`catalogMode: prefer` でも、`vp add -D jsdom@31.0.1` のように版を指定すると、`package.json` に `"jsdom": "31.0.1"` と直接書かれ、catalog は古い版のまま残った。版を指定しない `vp add <名前>` なら catalog に入る（docs/08 のとおり）。

版を指定して上げたいときは、`pnpm-workspace.yaml` の catalog の版を書き換え、`package.json` は `catalog:` のまま `vp install` する。今回はそうして直した。

## バージョン

| パッケージ                | バージョン | 公開（UTC） |
| ------------------------- | ---------- | ----------- |
| `@tanstack/react-query`   | 5.107.1    | 2026-11-06  |
| `@tanstack/react-router`  | 1.170.46   | 2026-10-22  |
| `@tanstack/router-plugin` | 1.169.0    | 2026-11-08  |
| `msw`                     | 3.0.5      | 2026-11-11（3.0.6 は 2026-11-15 で、まだ 1 日たっていなかった） |
| `@faker-js/faker`         | 10.6.0     | 2026-08-14  |
| `zustand`                 | 5.1.0      | 2026-11-06  |
| `@testing-library/user-event` | 14.6.10 | 2026-11-12  |
| `@vitejs/plugin-react`    | 6.3.0      | 2026-11-09  |
| `oxc-transform-react`     | 0.156.0    | 2026-10-27  |
| `jsdom`                   | 31.0.1     | 2026-11-13  |
