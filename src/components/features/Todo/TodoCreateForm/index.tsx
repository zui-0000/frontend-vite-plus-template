import { useQueryClient } from "@tanstack/react-query";
import { type SubmitEvent, useState } from "react";
import { getListTodosQueryKey, useCreateTodo } from "~/generated/api/todos/todos";

export function TodoCreateForm() {
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateTodo({
    mutation: {
      // 作ったら一覧のキャッシュを古いことにして、取り直す
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() }),
    },
  });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate({ data: { title } }, { onSuccess: () => setTitle("") });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="タイトル"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <button type="submit" disabled={isPending || title === ""}>
        追加
      </button>
    </form>
  );
}
