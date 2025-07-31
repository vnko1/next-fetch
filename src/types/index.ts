export type OnRequestInterceptor = (
  config: FetchRequestInit & { url: string }
) => Promise<typeof config> | typeof config;

export type OnResponseInterceptor = <T>(
  response: Response,
  data: T
) => Promise<T> | T;

export interface Interceptors {
  onRequest?: OnRequestInterceptor;
  onResponse?: OnResponseInterceptor;
}

export type QueryParams = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | object
  | (string | number | boolean | undefined | object)[]
>;

export type Methods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface NextFetchReqConfig {
  revalidate?: false | 0 | number;
  tags?: string[];
}

export interface FetchRequestInit extends RequestInit {
  next?: NextFetchReqConfig;
}

export interface RequestParams<T extends object = {}>
  extends Pick<FetchRequestInit, "cache" | "headers"> {
  body?: T | null;
  params?: QueryParams;
  next?: NextFetchReqConfig;
}

export interface ApiConstructor
  extends Omit<FetchRequestInit, "method" | "body"> {
  baseUrl: string;
  interceptors?: Interceptors;
}
