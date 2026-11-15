import "../../common/model/index.tsp";
import "./model/index.tsp";

@summary("ListTodosResult")
model ListTodosResult {
  id: TodoId;
  title: TodoTitle;
  completed: TodoCompleted;
  createdAt: CreatedAt;
}
