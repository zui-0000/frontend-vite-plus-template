# frontend-vite-plus-template

[Vite+](https://viteplus.dev/)（`vp`）で作ったフロントエンドのテンプレート。

## セットアップ

```bash
curl -fsSL https://vite.plus | bash   # vp を入れる（入れたら新しいターミナルを開く）
vp hooks enable                        # Git フックを有効にする
vp env install                         # devEngines の版の Node.js と pnpm を入れる
vp install                             # 依存関係を入れる（API クライアントの生成もここで動く）
vp dev                                 # http://localhost:5173/
```

## よく使うコマンド

| コマンド                      | 内容                                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| `vp dev`                      | 開発サーバーを起動する                                                   |
| `vp run build`                | 型チェック（`tsc -b`）をしてからビルドする                               |
| `vp preview`                  | ビルド結果を確認する（<http://localhost:4173/>）                         |
| `vp check` / `vp check --fix` | lint・フォーマット・型チェック / 自動修正                                |
| `vp test` / `vp test watch`   | テストを実行する / 監視モードで実行する                                  |
| `vp run gen:api`              | `schema/` から OpenAPI と API クライアントを生成する（キャッシュが効く） |
| `vp add <名前>`               | パッケージを追加する（`-D` で devDependencies）                          |
| `vp outdated` / `vp update`   | 更新を確認する / 更新する                                                |

`schema/` を変えたら `vp run gen:api` を実行し、`schema/` の差分をコミットする（`src/generated/` は `.gitignore` 済み）。

コミット時は pre-commit フックが `vp staged` を実行する。飛ばすときは `VP_GIT_HOOKS=0 git commit`。
