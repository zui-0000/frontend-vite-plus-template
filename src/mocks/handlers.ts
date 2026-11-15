import { getTodosMock } from "~/generated/api/index.msw";

// orval が OpenAPI から生成した MSW のハンドラー（faker で作ったデータを返す）。
// ブラウザ（browser.ts）とテスト（server.ts）で同じものを使う
export const handlers = [...getTodosMock()];
