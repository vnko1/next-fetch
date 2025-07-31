import {
  ApiConstructor,
  FetchRequestInit,
  RequestParams,
  QueryParams,
  Methods,
  Interceptors,
} from "./types";
import buildQueryString from "./utils";

export default class Api {
  private readonly baseErrorMessage: string = "HTTP error!";
  private readonly baseUrl: string;
  private readonly initConfig: Omit<FetchRequestInit, "body"> = {};
  private readonly interceptors?: Interceptors;

  static create(data: ApiConstructor) {
    return new this(data);
  }

  private constructor({
    baseUrl,
    interceptors,
    ...initConfig
  }: ApiConstructor) {
    this.baseUrl = baseUrl;
    this.initConfig = initConfig;
    this.interceptors = interceptors;
  }

  private formatUrl(url: string) {
    if (url.startsWith("/")) return url.replace(/^\/+/, "");
    return url;
  }

  private buildUrlString(url: string, params?: QueryParams) {
    const queryString = params ? `?${buildQueryString(params)}` : "";
    return `${this.baseUrl}/${this.formatUrl(url)}${queryString}`;
  }

  private formatBody(body?: FormData | unknown | null) {
    if (!body) return null;
    return typeof FormData !== "undefined" && body instanceof FormData
      ? body
      : JSON.stringify(body);
  }

  private async handleError(response: Response): Promise<never> {
    const error = await response.json();
    let errorString = `${this.baseErrorMessage} status:${response.status}`;
    if (error.error && error.error.message)
      errorString += ` ${error.error.message}`;
    else if (error.message) errorString += ` ${error.message}`;
    throw new Error(errorString);
  }

  private async request(
    url: string,
    config: Pick<
      FetchRequestInit,
      "method" | "cache" | "next" | "headers" | "body"
    >
  ) {
    const fetchConfig = {
      ...this.initConfig,
      ...config,
      headers: {
        ...(config.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...this.initConfig?.headers,
        ...config?.headers,
      },
    };
    const interceptedConfig = this.interceptors?.onRequest
      ? await this.interceptors.onRequest({ ...fetchConfig, url })
      : fetchConfig;

    return fetch(url, interceptedConfig);
  }

  private async send<T, K extends object>(
    method: Methods,
    url: string,
    { body = null, params, ...config }: RequestParams<K>
  ): Promise<T> {
    const prepareBody =
      method === "GET" || method === "DELETE"
        ? {}
        : { body: this.formatBody(body) };

    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method,
        ...prepareBody,
      }
    );

    if (!response.ok) await this.handleError(response);

    if (response.status === 204) return {} as T;

    const data = (await response.json()) as T;

    return this.interceptors?.onResponse
      ? this.interceptors.onResponse<T>(response, data)
      : data;
  }

  public async get<T>(
    url: string,
    config: Omit<RequestParams, "body">
  ): Promise<T> {
    return this.send("GET", url, config);
  }

  public async post<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    return this.send("POST", url, config);
  }

  public async put<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    return this.send("PUT", url, config);
  }

  public async patch<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    return this.send("PATCH", url, config);
  }

  public async delete<T>(
    url: string,
    { params, ...config }: Omit<RequestParams, "body">
  ): Promise<T> {
    return this.send("DELETE", url, config);
  }
}
