# TypeSpec と Orval による API クライアント生成

記録日: 2026-11-15 / 対象: リポジトリ名 `vite-plus-prac` → `frontend-vite-plus-template`、`@typespec/*` 1.18.0、`orval` 8.47.0、`schema/`・`src/api/` の追加、スキーマの書き方を `typespec-schema-template` に合わせた、出力先を `schema/dist/`・`src/generated/api/` に変更（後者は `.gitignore`）

> 追記: orval の出力は [docs/10](10-TanStack%20Query・Router・MSW・Zustand%20の導入.md) で、fetch のクライアントから TanStack Query のフックと MSW のハンドラーに変えた。`customFetch` もエラーの応答で throw するようにし、`src/utils/fetcher.ts` に移した。`.env` と `env.d.ts` も `src/env/` に移した。以下は、この時点の記録。

検証用のリポジトリを、フロントエンドのテンプレートとして使えるようにした。あわせて、API の型とクライアントをスキーマから生成する仕組みを入れた。手順と、それぞれの理由を残す。

## まとめ

```bash
# リポジトリ（GitHub 側）
gh repo rename frontend-vite-plus-template   # 旧 URL は GitHub がリダイレクトする

# 依存
vp add -D @typespec/compiler @typespec/http @typespec/openapi @typespec/openapi3 orval

# 生成（vite.config.ts の run.tasks）
vp run gen:api   # gen:schema（tsp compile）→ gen:api（orval）の順に動く
```

- GitHub の「Template repository」の設定は ON にしなかった（下の「Template repository にしなかった理由」を参照）
- `schema/` に TypeSpec で API を定義し、`schema/dist/openapi.yaml`（OpenAPI 3.2）を出力する
- スキーマの書き方（構成・命名・エラー・レスポンス）は、別リポジトリの [typespec-schema-template](https://github.com/zui-0000/typespec-schema-template) の規約に合わせた
- orval が `openapi.yaml` を読み、`src/generated/api/` に fetch クライアントと型を生成する
- 生成したクライアントは fetch を直接呼ばず、`src/api/fetcher.ts` の `customFetch` を通す
- `openapi.yaml` はコミットし、`src/generated/` は `.gitignore` にする。`vp install` の `prepare` で生成されるので、clone 直後も `vp install` だけで揃う
- 生成は Vite Task のタスクにしたので、`schema/` を変えていなければキャッシュから結果を戻すだけになる
- `vp check` / `vp test` / `vp run build` が成功し、pre-commit フック（`vp staged`）も `.tsp` を含めて動くことを確かめた

## Template repository にしなかった理由

GitHub には「Template repository」という設定があり、ON にするとリポジトリ名の横に「Public template」と出て、**Use this template** ボタンから中身をコピーした新しいリポジトリを作れる。

| | Use this template | Fork |
| --- | --- | --- |
| 履歴 | 引き継がない（コミット 1 つから始まる） | 全部引き継ぐ |
| 元リポジトリとのつながり | なし（"generated from 〜" と出るだけ） | あり（上流に PR を出せる・同期できる） |

一度 ON にしたが、このリポジトリは普通の public リポジトリとして育てることにして OFF に戻した。名前の「template」は「雛形として使う構成」という意味で付けている。必要になったら `gh repo edit --template` で ON にできる。

## 全体の流れ

```
schema/*.tsp                    ← 手で書く（API 契約の原本）
   │  vp run gen:schema（tsp compile schema）
   ▼
schema/dist/openapi.yaml        ← 生成・コミットする
   │  vp run gen:api（orval）
   ▼
src/generated/api/              ← 生成・コミットしない（手で直さない）
   │  import
   ▼
src/api/fetcher.ts（customFetch） ← 手で書く（ベース URL・認証などの共通処理）
   │
   ▼
fetch
```

TS で言えば、`schema/` は「API の `.d.ts` の原本」で、そこからクライアントと型を codegen している。tRPC は TS 同士でしか型を共有できないが、間に OpenAPI を挟むので、バックエンドの言語を問わない。

## なぜ TypeSpec か

OpenAPI の YAML を直接書くこともできるが、TypeSpec で書いて OpenAPI に変換するほうを選んだ。

| 観点                 | OpenAPI を直接書く                         | TypeSpec で書く                                                    |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| 書き味               | YAML。`$ref` やインデントが多くて長い      | TS に近い構文。同じ API が数分の 1 の行数で書ける                  |
| 型の再利用           | `allOf` などで組み立てる                   | `PickProperties` / `OptionalProperties` など、TS のユーティリティ型と同じ感覚で使える |
| 間違いに気づく時点   | 生成ツールや実行時                         | `tsp compile` の時点（未定義の型、名前の重複など）                 |
| エディタ             | スキーマ補完程度                           | 公式の VS Code 拡張で、補完・定義ジャンプ・エラー表示が効く        |
| 必要なもの           | なし                                       | `@typespec/*` の devDependencies と、コンパイルの手順              |

TS との対応（`schema/` で使っているもの）:

| TypeSpec                                               | TS                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| `model GetTodoResponse { title: TodoTitle; }`          | `interface GetTodoResponse { title: TodoTitle }`           |
| `scalar TodoTitle extends string;`（`@maxLength` など） | `type TodoTitle = string`（ただし制約が OpenAPI に出る）     |
| `title?: TodoTitle;`                                   | optional プロパティ `title?: TodoTitle`                    |
| `code: "4040";`                                        | リテラル型 `code: "4040"`                                  |
| `model SuccessOkResponse<T> { ... }`                   | ジェネリクス `type SuccessOkResponse<T> = { ... }`         |
| `SuccessOkResponse<GetTodoResponse> \| NotFoundErrorResponse`（戻り値） | ユニオン型。HTTP ではステータスコードごとのレスポンスになる |
| `import "./model/index.tsp";`                          | barrel export（`index.ts` で re-export）からの import      |

バックエンドを Kotlin + Spring Boot で書くときも、同じ `openapi.yaml` から openapi-generator（`kotlin-spring`）などでサーバー側のインターフェースを生成できる。契約の原本が言語から独立しているのが、OpenAPI を挟む一番の理由。

### `schema/` の構成

[typespec-schema-template](https://github.com/zui-0000/typespec-schema-template) の構成に合わせた。テンプレートは `src/{service-name}/` でサービスごとに分けているが、フロントが呼ぶバックエンドは基本 1 つなので、1 階層浅くしてサービスのフォルダは作らない。

```
schema/
├── tspconfig.yaml
├── main.tsp                  # 入口。@service・@server とルーティング（operation）を書く
├── common/                   # リソースをまたいで使う型
│   ├── error/                # 汎用エラー（BadRequestError・ResourceNotFoundError など）
│   ├── model/                # ドメインに依らない scalar（CreatedAt）
│   ├── pagination/           # ページネーションの scalar（TotalCount・CurrentPage など）
│   └── response/             # ステータスコードと本文を束ねる型（SuccessOkResponse<T>・NotFoundErrorResponse など）
├── contexts/                 # リソース（境界づけられたコンテキスト）ごとのフォルダを置く
│   └── todos/                # Todo の API（サンプル）
│       ├── model/                # Todo だけの scalar（TodoId・TodoTitle・TodoCompleted）
│       ├── CreateTodoRequest.tsp
│       ├── CreateTodoResponse.tsp
│       ├── GetTodoResponse.tsp
│       ├── ListTodosPagination.tsp
│       ├── ListTodosResponse.tsp
│       ├── ListTodosResult.tsp
│       ├── UpdateTodoRequest.tsp
│       └── index.tsp         # このフォルダの .tsp をまとめて import する
└── dist/
    └── openapi.yaml          # 生成物（コミットする）
```

リソースを足すときは `contexts/todos/` と同じ形のフォルダを作り、`main.tsp` から `index.tsp` を import する（package by feature と同じ考え方）。

`contexts/` を 1 段挟むのは、`common/`（横断的な型）とリソースのフォルダを同じ階層に混ぜないため。リソースが増えても `schema/` の直下は `common/`・`contexts/`・`main.tsp`・`tspconfig.yaml`・`dist/` のままで、どこに何を置くかが迷わない。結果として、リソースのファイルから見た `common/` の位置（`../../common/`）がテンプレートと同じになった。

### テンプレートに合わせた理由と、主な規約

最初は `todos.tsp` 1 ファイルに `Todo` モデルを置き、`PickProperties` などで派生させていた。バックエンド側のスキーマを書くときの規約を `typespec-schema-template` にまとめてあるので、フロントのテンプレートもそれに揃えた。リポジトリごとに書き方が違うと、テンプレートを用意した意味が薄れるため。規約の全文はテンプレートの `.claude/docs/implementation-conventions.md` にある。ここでは要点と、前の書き方からの違いだけを残す。

| 規約 | 内容 | 理由 |
| --- | --- | --- |
| 1 モデル 1 ファイル + `index.tsp` | ファイル名 = モデル名。フォルダの `index.tsp` が import をまとめる（アルファベット順） | どこに何があるかがファイル一覧で分かる。TS の barrel export と同じ |
| 命名 `{Action}{Resource}{Type}` | `GetTodoResponse`・`ListTodosResult` など。1 件なら単数、一覧なら複数 | `@operationId`（`getTodo`）と語順が同じなので、操作から型を名前で引ける |
| 共通の `Todo` を使い回さない | 操作ごとに Request / Response を定義する | 「作成時の入力」と「取得時の出力」は別物。片方の変更がもう片方に漏れない |
| 項目ごとに scalar | `TodoTitle`（`@minLength`・`@maxLength`）など。`@summary` は全部に、`@example` は scalar に必須 | 制約と例を 1 か所に書き、使う側は型名を書くだけになる |
| エンベロープを使わない | 本文はデータそのもの。一覧だけ `{ todos: [...], pagination: {...} }` | `data.result.id` のような意味のない階層を、生成したクライアントの型にまで持ち込まない |
| 作成は `{ id }` だけ返す | 201 で採番した ID を返す。全体が欲しければ `GET /todos/{id}` | テンプレートの方針 |
| 更新・削除は 204 | 返すデータがない操作は本文なし。`Response` モデルも作らない | 同上 |
| エラーの `status`・`code` はリテラル | `status: 404; code: "4040";`。`title` に人が読む文を入れ、入力エラーは `errors[]` で項目ごとに返す | 同じステータスのエラーが複数あっても、`code` で型を絞り込める（下の「生成されるコード」を参照） |
| エラーコード | `<HTTP ステータス><連番>` の 4 桁。汎用は `4000`・`4040`・`5000` など | 汎用のエラーとドメインだけのエラー（`4041` など）を `code` で見分けられる |

前の書き方からの主な違い:

- 入力エラーを 422（`ValidationError`）から 400（`BadRequestError`）に変えた（テンプレートに合わせた）
- 500 も `InternalServerError` の本文を返すように定義した。クライアントの受け口がどのステータスでも同じ形になる
- `listTodos` に `currentPage`・`perPage`（必須のクエリ）を足した。サンプルは見本なので、一番形が複雑な一覧の書き方も入れておく
- `Todo` の ID は UUID v7 の pattern を持つ `TodoId` になった（以前は `@format("uuid")`）
- `@info(#{ version })` はテンプレートにないので外した（生成物のヘッダーの `OpenAPI spec version` は `0.0.0` になる）

### `tspconfig.yaml` で決めたこと

| 設定                 | 値                          | 理由                                                                                              |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| `kind`               | `project`                   | TypeSpec 1.13.0 で入った設定。このディレクトリがプロジェクトの境界だと宣言する。IDE が `.tsp` の属するプロジェクトを正しく判定でき、`--config` で別の設定を指定したときに `entrypoint` などを引き継ぐ |
| `entrypoint`         | `main.tsp`                  | 既定値と同じだが、テンプレートに合わせて明示する                                                  |
| `emitter-output-dir` | `{project-root}/dist`       | 既定は `{output-dir}/@typespec/openapi3`（`output-dir` の既定は `{cwd}/tsp-output`）で、パスに `@` が入って深い。`schema/` の中の `dist/` に収める（下を参照） |
| `openapi-versions`   | `3.2.0`                     | テンプレートに合わせた。3.1 以降は JSON Schema に揃っていて、`nullable` が `type: [T, "null"]` になる。3.2 は 3.1 の上位互換 |
| `warn-as-error`      | `true`                      | 警告を放置しないため。テンプレートにはない、このリポジトリだけの設定                              |

`tsp-output` という名前は、TypeSpec コンパイラーの `output-dir` の既定値（`{cwd}/tsp-output`）から来ている。公式が「この名前にせよ」と推奨しているわけではなく、設定しなければそうなるというだけ。テンプレートは `{cwd}/dist` に出しているので、名前を揃えて `dist/` にした。

ただし、Vite の雛形の `.gitignore` には `dist`（どの階層でも当たる書き方）があるので、そのままだと `schema/dist/` も無視される。`openapi.yaml` はコミットしたいので、`!schema/dist/` を足して打ち消した。

3.2.0 にする前に、orval 8.47.0 が読めるかを確かめた。同じスキーマを 3.1.0 と 3.2.0 で出力し、それぞれ orval で生成して `diff -r` を取ると、生成された TS は完全に同じだった。

## なぜ orval か・どう生成するか

orval は OpenAPI から TS のクライアントを生成するツールで、fetch・axios・React Query・SWR・Zod など出力先を選べる。

| 設定           | 値                             | 理由                                                                                         |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `client`       | `fetch`                        | 最小構成にした。データ取得のライブラリ（React Query など）は、テンプレートを使う側で選ぶ      |
| `target`       | `src/generated/api`            | 生成物は `src/generated/` にまとめて `.gitignore` する。`clean: true` は target のフォルダごと消すので、直下ではなく `api/` を target にする。あとで別の生成物（TanStack Router のルート定義など）を `src/generated/` に置いても巻き込まない |
| `mode`         | `tags-split`                   | TypeSpec の `@tag` ごとにファイルを分ける（`Todos` → `generated/api/todos/todos.ts`）       |
| `clean`        | `true`                         | 生成のたびに出力先を消す。消えた API のファイルが残らないようにする                          |
| `override.mutator` | `src/api/fetcher.ts` の `customFetch` | ベース URL・認証ヘッダーなどの共通処理を 1 か所にまとめる                                |

### 生成されるコード

```ts
// 実際は getTodoResponse200 などに分かれているが、展開するとこの形
export type getTodoResponse =
  | { data: GetTodoResponse; status: 200; headers: Headers }
  | { data: ResourceNotFoundError; status: 404; headers: Headers }
  | { data: InternalServerError; status: 500; headers: Headers };

const res = await getTodo(id);
if (res.status === 200) {
  res.data.title; // GetTodoResponse として扱える
} else if (res.status === 404) {
  res.data.code; // "4040"（リテラル型）
}
```

戻り値は `status` で判別できるユニオン型（discriminated union）になる。TypeSpec の `SuccessOkResponse<GetTodoResponse> | NotFoundErrorResponse | ...` が、そのまま TS の型の絞り込みで使える。

エラーの `code` もリテラル型になる（orval は `export const ResourceNotFoundErrorCode = { NUMBER_4040: "4040" } as const` と、その値の型を出す）。あとで同じ 404 の別エラー（`4041` など）を足しても、`switch (res.data.code)` で型を絞り込める。

### mutator（`src/api/fetcher.ts`）

axios でいう interceptor の役割。生成コードは `customFetch(url, options)` を呼ぶので、ここでベース URL（`VITE_API_BASE_URL`）を付け、レスポンスを `{ data, status, headers }` の形にして返す。204 のように本文がないレスポンスで `json()` が失敗しないようにもしている。

ベース URL は `.env` に書き、自分の環境だけ変えるときは `.env.local`（`.gitignore` 済み）に書く。型は `src/env.d.ts` で定義している。

## `openapi.yaml` だけをコミットする理由

| 方針                                | 良い点                                                      | 悪い点                                                  |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| 両方コミット（最初はこれだった）    | clone 直後から型が揃っている。CI も生成の手順がいらない     | 生成コードの差分で PR がふくらむ。生成し忘れに気づきにくい |
| **`openapi.yaml` だけコミット（採用）** | API 契約の変更が PR の差分で見える。生成コードの差分は出ない | dev・build・test の前に生成が必要                       |
| 両方 `.gitignore`                   | リポジトリが一番きれい                                      | 契約の差分は `.tsp` でしか見えない                      |

最初は「`package-lock.json` と同じく生成結果を固定する」理屈で両方コミットしていた。だが `src/generated/` は `openapi.yaml` と orval の版から決まる出力で、lockfile のように「解決のたびに変わりうる結果」を固定する意味は薄い。生成コードの差分が PR に混ざるほうが邪魔なので、`.gitignore` にした。TS で言えば、`tsc` の出力（`dist/`）や Prisma Client をコミットしないのと同じ扱い。

`openapi.yaml` はコミットする。バックエンド（Kotlin など）の人が `.tsp` を読まなくても、PR で契約の変化を OpenAPI の差分として見られるから。

「生成が必要」という悪い点は、`package.json` の `prepare` で埋めた。

```json
"prepare": "vp run gen:api"
```

pnpm は `install` の後にルートの `prepare` を動かすので、clone して `vp install` すれば `src/generated/` ができる（node_modules も `src/generated/` もない状態のコピーで `vp install` して、生成されることを確かめた）。2 回目以降の `vp install` で「Already up to date」のときは動かないが、そのときは `src/generated/` も残っている。`schema/` を変えたときは、これまでどおり `vp run gen:api` を実行する。

生成物は手で直さないので、`src/generated/` は lint と fmt の対象から外した。型チェック（`tsc -b`）の対象には残している。orval の `hooks.afterAllFilesWrite: "vp fmt"`（コミットする生成物の見た目を揃えるためのもの）も、コミットしなくなったので外した。

## 生成を Vite Task にした

`package.json` の scripts ではなく、`vite.config.ts` の `run.tasks` に書いた。

```ts
run: {
  tasks: {
    "gen:schema": { command: "tsp compile schema" },
    "gen:api": { command: "orval", dependsOn: ["gen:schema"] },
  },
},
```

| 観点       | `package.json` の scripts           | `run.tasks`                                     |
| ---------- | ----------------------------------- | ----------------------------------------------- |
| キャッシュ | 既定では効かない（`--cache` が必要） | 既定で効く                                      |
| 依存       | `&&` でつなぐ                        | `dependsOn` で書く                              |
| 出力       | —                                   | キャッシュヒット時に、書き出したファイルを戻す  |

確かめたこと:

| 操作                                    | 結果                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------- |
| 何も変えずに 2 回目を実行               | `2/2 cache hit`。実行を飛ばした                                        |
| `src/generated/api/` を消してから実行   | `2/2 cache hit` のまま、消したファイルが戻った                         |
| `.tsp` を変えたが、出力が変わらない変更だった（非推奨オプションの削除とコメント） | `1/2 cache hit`。`gen:schema` は動いたが、出力の `openapi.yaml` が同じだったので orval は飛ばした |

## ハマった点

### orval が 8.48.0 ではなく 8.47.0 で入った

`vp add -D orval` で入ったのは 8.47.0 だった。8.48.0 の公開は 2026-11-14 13:58（UTC）で、追加した時点（2026-11-15 09:00）ではまだ 19 時間しかたっていなかった。`pnpm-workspace.yaml` の `minimumReleaseAge: 1440`（1 日）が意図どおりに止めた結果なので、そのままにした。

### esbuild のビルドスクリプトで `ERR_PNPM_IGNORED_BUILDS`

orval が依存する esbuild には postinstall がある。pnpm は `allowBuilds` に書いていないパッケージのスクリプトを動かさず、`strictDepBuilds`（既定 `true`）のためエラーになる。

esbuild の postinstall はバイナリの確認と最適化だけで、なくてもプラットフォーム別の optionalDependencies（`@esbuild/darwin-arm64` など）から動く。そのため `allowBuilds` に `esbuild: false` と書き、動かさないことを明示した（orval の生成とテストが動くことを確かめた）。

### `npx tsp` が `EBADDEVENGINES` で失敗する

npm は `devEngines.packageManager`（pnpm）を見て、自分は npm なので失敗する。ローカルのバイナリは `vpx tsp ...` で実行する。タスクの中では `tsp` と書くだけでよい。

### `.tsp` だけをコミットすると pre-commit が失敗する

`staged` の `"*": "vp check --fix"` は `.tsp` にもマッチするが、oxfmt・oxlint は `.tsp` を扱わないので、対象ファイルが 0 件になり「Expected at least one target file」で止まる。生成物の `openapi.yaml`（fmt の対象外にした）だけをコミットしたときも同じ。

- `vp check --fix --no-error-on-unmatched-pattern` にして、0 件でも止まらないようにした
- `.tsp` は `"*.tsp": "tsp format"` で、TypeSpec の整形コマンドで整形する

### oxfmt が `openapi.yaml` を整形し直す

oxfmt は YAML も整形するので、そのままだとコミット時に `openapi.yaml` が書き換わり、「生成した結果」と「コミットした内容」がずれる。`fmt.ignorePatterns` に `schema/dist/**` を足した。

### `PickProperties` の説明文が OpenAPI に出る

`model CreateTodoRequest is PickProperties<Todo, "title">;` と書くと、OpenAPI の `description` に `The template for picking properties.`（テンプレート側の説明）が入った。`@doc` を書いて上書きした。いまは操作ごとにモデルを定義する書き方にしたので、`PickProperties` は使っていない。

### テンプレートからコピーすると import のパスがずれる

テンプレートは `src/{service-name}/{resource}/` の 3 階層なので、リソースのファイルは `import "../../common/..."` で共通の型を読む。最初はサービスのフォルダを作らず `schema/{resource}/` に置いたので、`../common/...` に直す必要があった（そのままだと `import-not-found` になる）。いまは `schema/contexts/{resource}/` にしたので、テンプレートと同じ `../../common/...` に戻っている。

### `@patch` の `implicitOptionality` は非推奨

`@patch(#{ implicitOptionality: false })` は、本文を暗黙に optional にするかどうかのオプションだが、`@typespec/http` 1.18.0 の定義で非推奨（将来削除）になっていた。オプションは付けず、全項目に `?` を付けた `UpdateTodoRequest` を明示的に `@body` に使う。テンプレートの更新は `@put`（全体の置き換え）だが、ここは送った項目だけを変える `@patch` のままにした。JSON Merge Patch にしたいときは `MergePatchUpdate<T>` を使う（Content-Type が `application/merge-patch+json` になる）。

## API を足す手順

1. `schema/contexts/{resource}/` に Request / Response のモデルと `model/` の scalar を足し、同じフォルダの `index.tsp` に import を足す（新しいリソースなら `main.tsp` からそのフォルダの `index.tsp` を import する）
2. `main.tsp` に operation を足す
3. `vp run gen:api` で `openapi.yaml` と `src/generated/api/` を作り直す
4. `~/generated/api` から関数を import して使う
5. `.tsp` と `openapi.yaml` をまとめてコミットする（`src/generated/` はコミットしない）

## バージョン

| パッケージ           | バージョン | 公開（UTC）       |
| -------------------- | ---------- | ----------------- |
| `@typespec/compiler` | 1.18.0     | 2026-11-11        |
| `@typespec/http`     | 1.18.0     | 2026-11-11        |
| `@typespec/openapi`  | 1.18.0     | 2026-11-11        |
| `@typespec/openapi3` | 1.18.0     | 2026-11-11        |
| `orval`              | 8.47.0     | 2026-11-07（8.48.0 は 2026-11-14 で、まだ 1 日たっていなかった。上の「ハマった点」を参照） |
