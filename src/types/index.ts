import { InterceptorManager } from "../services";

interface NextFetchReqConfig {
  revalidate?: false | 0 | number;
  tags?: string[];
}

export type Interceptor<T> = (value: T) => T | Promise<T>;

export interface Interceptors {
  request: InterceptorManager<FetchRequestInit>;
  response: InterceptorManager<Response>;
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
