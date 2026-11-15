// import.meta.env の型。VITE_ で始まる環境変数だけがクライアントに渡る
interface ImportMetaEnv {
  // API のベース URL（例: http://localhost:8080）。未設定なら同じオリジンに送る
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
