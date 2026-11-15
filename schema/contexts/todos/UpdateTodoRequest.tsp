import "./model/index.tsp";

// PATCH の本文。送った項目だけを更新するので、全項目を optional にする。
// @patch の implicitOptionality オプション（本文を暗黙に optional にする）は非推奨なので、明示的に `?` を付ける
@summary("UpdateTodoRequest")
model UpdateTodoRequest {
  title?: TodoTitle;
  completed?: TodoCompleted;
}
