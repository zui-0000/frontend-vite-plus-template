import "@testing-library/jest-dom/vitest";
import { server } from "~/mocks/server";

// 全テストで MSW を動かす。モックしていない API を呼んだらテストを失敗させる
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
// テストの中で server.use() で差し替えたハンドラーを、次のテストに持ち越さない
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
