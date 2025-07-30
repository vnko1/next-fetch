export type QueryParams = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | object
  | (string | number | boolean | undefined | object)[]
>;

export interface NextFetchReqConfig {
  revalidate?: false | 0 | number;
  tags?: string[];
}

export interface ApiConstructor {
  baseUrl: string;
  config?: Omit<RequestInit, "method">;
}

export interface RequestParams<T extends object = {}>
  extends Pick<RequestInit, "cache" | "headers"> {
  body: T;
  params?: QueryParams;
  next?: NextFetchReqConfig;
}

export interface IRequestInit extends RequestInit {
  next?: NextFetchReqConfig;
}
