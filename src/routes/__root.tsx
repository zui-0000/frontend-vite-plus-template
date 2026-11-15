import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout } from "~/components/layouts/RootLayout";

// ルーターの context の型。createAppRouter（src/router.tsx）で渡す値と一致させる。
// ルート ファイルにはルートの定義だけを書き、コンポーネントは別のファイルに置く
// （同じファイルでコンポーネント以外を export すると、Fast Refresh が効かなくなるため）
type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
