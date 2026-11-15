// orval が生成したクライアントは、fetch を直接呼ばずにこの関数を呼ぶ（orval.config.ts の mutator）。
// ベース URL・認証ヘッダー・共通のエラー処理など、全 API で共通の処理はここに書く

const parseBody = async (response: Response): Promise<unknown> => {
  // 204 No Content などは本文がないので、json() を呼ぶと失敗する
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    return response.json();
  }
  return response.text();
};

// 戻り値の型 T は、orval が生成する成功の応答（{ data, status, headers }）。
// orval.config.ts の forceSuccessResponse により、エラーの応答は戻り値の型に入らない
export const customFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  // 呼ぶたびに読む（テストで vi.stubEnv を使って差し替えられるように、モジュールの読み込み時に固定しない）
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  const response = await fetch(`${baseUrl}${url}`, options);
  const data = await parseBody(response);
  if (!response.ok) {
    // エラーの本文（ResourceNotFoundError など）をそのまま投げる。
    // TanStack Query の error に入り、orval が生成するエラーの型（TError）と一致する
    // oxlint-disable-next-line typescript/only-throw-error
    throw data;
  }
  return { data, status: response.status, headers: response.headers } as T;
};
