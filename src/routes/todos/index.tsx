import { createFileRoute } from "@tanstack/react-router";
import { todoListParams } from "~/components/features/Todo/todoListParams";
import { TodoPage } from "~/components/pages/Todo";
import { prefetchListTodosQuery } from "~/generated/api/todos/todos";

export const Route = createFileRoute("/todos/")({
  // 描画の前にデータを取り、キャッシュに入れておく（読み込み中の表示を出さずに済む）。
  // TodoList（components/features/Todo/TodoList）の useListTodosSuspense は、このキャッシュを読む
  loader: ({ context }) => prefetchListTodosQuery(context.queryClient, todoListParams),
  component: TodoPage,
});
