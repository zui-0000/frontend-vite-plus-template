import "../../common/model/index.tsp";
import "./model/index.tsp";

@summary("GetTodoResponse")
model GetTodoResponse {
  id: TodoId;
  title: TodoTitle;
  completed: TodoCompleted;
  createdAt: CreatedAt;
}
