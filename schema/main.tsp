// API 全体の入口。リソースごとのフォルダ（contexts/todos/ など）と common/ を import し、ルーティングを定義する。
// 書き方の規約は typespec-schema-template（zui-0000/typespec-schema-template）に合わせている
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
import "./contexts/todos/index.tsp";
import "./common/index.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Template API" })
@server("http://localhost:8080", "ローカルのバックエンド")
namespace TemplateApi {
  // operationId は orval が生成する関数名になる（listTodos など）
  @tag("Todos")
  @route("/todos")
  namespace Todos {
    /** Todo の一覧を取得する */
    @get
    @operationId("listTodos")
    op list(@query currentPage: CurrentPage, @query perPage: PerPage):
      | SuccessOkResponse<ListTodosResponse>
      | InternalServerErrorResponse;

    /** ID を指定して Todo を取得する */
    @get
    @route("/{id}")
    @operationId("getTodo")
    op get(@path id: TodoId):
      | SuccessOkResponse<GetTodoResponse>
      | NotFoundErrorResponse
      | InternalServerErrorResponse;

    /** Todo を新規作成する */
    @post
    @operationId("createTodo")
    op create(@body body: CreateTodoRequest):
      | SuccessCreatedResponse<CreateTodoResponse>
      | BadRequestErrorResponse
      | InternalServerErrorResponse;

    /** Todo を更新する。送った項目だけを更新する */
    @patch
    @route("/{id}")
    @operationId("updateTodo")
    op update(@path id: TodoId, @body body: UpdateTodoRequest):
      | SuccessNoContentResponse
      | BadRequestErrorResponse
      | NotFoundErrorResponse
      | InternalServerErrorResponse;

    /** Todo を削除する */
    @delete
    @route("/{id}")
    @operationId("deleteTodo")
    op delete(@path id: TodoId):
      | SuccessNoContentResponse
      | NotFoundErrorResponse
      | InternalServerErrorResponse;
  }
}
