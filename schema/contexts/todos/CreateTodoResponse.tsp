import "./model/index.tsp";

@summary("CreateTodoResponse")
model CreateTodoResponse {
  // 採番された ID。クライアントはこれを使って GET /todos/{id} を呼べる。
  id: TodoId;
}
