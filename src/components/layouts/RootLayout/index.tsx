import { Link, Outlet } from "@tanstack/react-router";

// 全ページ共通のレイアウト。src/routes/__root.tsx から使う
export function RootLayout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link> <Link to="/todos">Todos</Link>
      </nav>
      <Outlet />
    </>
  );
}
