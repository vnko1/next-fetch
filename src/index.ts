import { InterceptorManager } from "./services";
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
  public readonly interceptors: Interceptors;

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

    this.interceptors = {
      request: new InterceptorManager<FetchRequestInit>(),
      response: new InterceptorManager<Response>(),
    };
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return null as T;
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    } else if (contentType.includes("text/")) {
      return response.text() as T;
    }
    return response.blob() as T;
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
    let fetchConfig: FetchRequestInit = {
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

    for (const interceptor of this.interceptors.request.getAll()) {
      fetchConfig = await interceptor(fetchConfig);
    }

    const response = await fetch(url, fetchConfig);

    for (const interceptor of this.interceptors.response.getAll()) {
      await interceptor(response);
    }

    return response;
  }

  private async send<T, K extends object>(
    method: Methods,
    url: string,
    { body = null, params, ...config }: RequestParams<K> = {}
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

    return this.handleResponse<T>(response);
  }

  public async get<T>(
    url: string,
    config: Omit<RequestParams, "body">
  ): Promise<T> {
    return this.send("GET", url, config);
  }

  public async post<T, K extends object>(
    url: string,
    config: RequestParams<K>
  ): Promise<T> {
    return this.send("POST", url, config);
  }

  public async put<T, K extends object>(
    url: string,
    config: RequestParams<K>
  ): Promise<T> {
    return this.send("PUT", url, config);
  }

  public async patch<T, K extends object>(
    url: string,
    config: RequestParams<K>
  ): Promise<T> {
    return this.send("PATCH", url, config);
  }

  public async delete<T>(
    url: string,
    config: Omit<RequestParams, "body">
  ): Promise<T> {
    return this.send("DELETE", url, config);
  }
}
