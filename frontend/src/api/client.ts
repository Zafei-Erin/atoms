// 开发环境：VITE_API_URL 不设置，走 Vite proxy（/api → localhost:3000）
// 生产环境：在 .env.production 中设置 VITE_API_URL=https://api.yourdomain.com
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function request<T = void>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    headers: {
      ...(serializedBody !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: serializedBody,
    ...rest,
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  if (res.status === 204) return undefined as T;
  return res.json();
}
