import { TodoCreateForm } from "~/components/features/Todo/TodoCreateForm";
import { TodoList } from "~/components/features/Todo/TodoList";
import styles from "./index.module.css";

// ページは機能（features）の部品を並べるだけにする。データの取得や状態は features 側が持つ
export function TodoPage() {
  return (
    <main className={styles.page}>
      <h1>Todos</h1>
      <TodoCreateForm />
      <TodoList />
    </main>
  );
}
