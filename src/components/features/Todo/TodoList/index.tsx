import { useTodoFilterStore } from "~/stores/todo/todoFilterStore";
import { todoListParams } from "~/components/features/Todo/todoListParams";
import { useListTodosSuspense } from "~/generated/api/todos/todos";

export function TodoList() {
  // ルートの loader（src/routes/todos/index.tsx）で取ったデータを、キャッシュから読む
  const {
    data: { data },
  } = useListTodosSuspense(todoListParams);
  const hideCompleted = useTodoFilterStore((state) => state.hideCompleted);
  const toggleHideCompleted = useTodoFilterStore((state) => state.toggleHideCompleted);

  const todos = hideCompleted ? data.todos.filter((todo) => !todo.completed) : data.todos;

  return (
    <>
      <label>
        <input type="checkbox" checked={hideCompleted} onChange={toggleHideCompleted} />
        完了したものを隠す
      </label>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.completed ? "✅" : "⬜"} {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
