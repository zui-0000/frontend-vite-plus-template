import { useTodoFilterStore } from "~/stores/todo/todoFilterStore";

describe("useTodoFilterStore", () => {
  beforeEach(() => {
    // ストアはモジュールに 1 つなので、テストごとに初期値へ戻す
    useTodoFilterStore.setState({ hideCompleted: false });
  });

  test("初期状態の場合、hideCompleted が false であること", () => {
    expect(useTodoFilterStore.getState().hideCompleted).toBe(false);
  });

  test("toggleHideCompleted を呼んだ場合、hideCompleted が反転すること", () => {
    const { toggleHideCompleted } = useTodoFilterStore.getState();

    toggleHideCompleted();
    expect(useTodoFilterStore.getState().hideCompleted).toBe(true);

    toggleHideCompleted();
    expect(useTodoFilterStore.getState().hideCompleted).toBe(false);
  });
});
