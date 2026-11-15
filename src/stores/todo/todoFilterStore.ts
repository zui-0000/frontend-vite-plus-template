import { create } from "zustand";

// 画面の中だけの状態（クライアントの状態）は Zustand に置く。サーバーから取るデータは TanStack Query に置く。
// useState と違い、ページを移動して戻っても値が残る
type TodoFilterState = {
  hideCompleted: boolean;
  toggleHideCompleted: () => void;
};

export const useTodoFilterStore = create<TodoFilterState>()((set) => ({
  hideCompleted: false,
  toggleHideCompleted: () => set((state) => ({ hideCompleted: !state.hideCompleted })),
}));
