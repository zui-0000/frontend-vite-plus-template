import "./ListTodosPagination.tsp";
import "./ListTodosResult.tsp";

@summary("ListTodosResponse")
model ListTodosResponse {
  todos: ListTodosResult[];
  pagination: ListTodosPagination;
}
