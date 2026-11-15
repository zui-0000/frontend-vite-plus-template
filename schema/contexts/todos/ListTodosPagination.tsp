import "../../common/pagination/index.tsp";

@summary("ListTodosPagination")
model ListTodosPagination {
  totalCount: TotalCount;
  totalPages: TotalPages;
  currentPage: CurrentPage;
  perPage: PerPage;
}
