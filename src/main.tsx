import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "~/styles/main.css";
import { createAppRouter } from "~/router";

// 開発中で VITE_ENABLE_MSW が "true" のときだけ、MSW で API をモックする。
// import.meta.env.DEV は本番ビルドで false に置き換わるので、MSW のコードはバンドルに入らない
const enableMocking = async () => {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW !== "true") {
    return;
  }
  const { worker } = await import("~/mocks/browser");
  // モックしていないリクエスト（画像など）は、そのままネットワークに流す
  await worker.start({ onUnhandledFrame: "bypass" });
};

const router = createAppRouter();

await enableMocking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
