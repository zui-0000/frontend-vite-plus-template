import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, type RouterHistory } from "@tanstack/react-router";
import { routeTree } from "~/routeTree.gen";

type CreateAppRouterOptions = {
  queryClient?: QueryClient;
  // テストでは createMemoryHistory を渡して、開くパスを決める
  history?: RouterHistory;
};

export const createAppRouter = ({
  queryClient = new QueryClient(),
  history,
}: CreateAppRouterOptions = {}) =>
  createRouter({
    routeTree,
    // ルートの loader から queryClient を使えるようにする（__root.tsx の createRootRouteWithContext）
    context: { queryClient },
    // Router 側のプリロードのキャッシュ（既定 30 秒）を切り、データの鮮度は TanStack Query に任せる
    defaultPreloadStaleTime: 0,
    // リンクにマウスを乗せたら、遷移先の loader を先に動かす
    defaultPreload: "intent",
    ...(history ? { history } : {}),
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

// useNavigate・Link などの型に、このアプリのルートを教える
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
