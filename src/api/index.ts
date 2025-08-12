import {
  ApiConstructor,
  FetchRequestInit,
  RequestParams,
  QueryParams,
  Methods,
  Interceptors,
  HeadersObject,
} from "../types";
import { HttpError, InterceptorManager } from "../services";
import buildQueryString from "../utils";

export default class Api {
  private readonly baseErrorMessage: string = "HTTP error!";
  private readonly baseURL: string;
  private readonly initConfig: Omit<FetchRequestInit, "body"> = {};
  public readonly interceptors: Interceptors;

  static create(data: ApiConstructor) {
    return new this(data);
  }

  private constructor({
    baseURL,
    interceptors,
    ...initConfig
  }: ApiConstructor) {
    this.baseURL = baseURL;
    this.initConfig = initConfig;

    this.interceptors = interceptors ?? {
      request: new InterceptorManager<FetchRequestInit>(),
      response: new InterceptorManager<Response>(),
    };
  }

  private formatUrl(url: string) {
    if (url.startsWith("/")) return url.replace(/^\/+/, "");
    return url;
  }

  private buildURLString(url: string, params?: QueryParams) {
    const u = new URL(
      this.formatUrl(url),
      this.baseURL.endsWith("/") ? this.baseURL : this.baseURL + "/"
    );
    const qs = params ? buildQueryString(params) : "";
    return qs ? `${u.toString()}?${qs}` : u.toString();
  }

  private formatBody(b?: FormData | unknown | null) {
    if (!b) return null;
    if (typeof FormData !== "undefined" && b instanceof FormData)
      return b;
    if (
      b instanceof Blob ||
      b instanceof ArrayBuffer ||
      b instanceof URLSearchParams
    )
      return b;
    return JSON.stringify(b);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return null as T;
    const ct = response.headers.get("Content-Type") || "";

    if (/\bjson\b/i.test(ct)) {
      return response.json();
    }
    if (ct.startsWith("text/")) {
      return response.text() as T;
    }
    return response.blob() as T;
  }

  private async handleError(response: Response): Promise<never> {
    let parsedBody: unknown = undefined;
    let msg = this.baseErrorMessage;

    try {
      const ct = response.headers.get("Content-Type") || "";
      if (/\bjson\b/i.test(ct)) {
        parsedBody = await response.clone().json();
        const text =
          (parsedBody as any)?.error?.message ??
          (parsedBody as any)?.message;
        if (text) msg += ` ${text}`;
      } else {
        const text = await response.clone().text();
        if (text) msg += ` ${text.slice(0, 500)}`;
        parsedBody = text;
      }
    } catch {
      const text = await response.text().catch(() => "");
      if (text) msg += ` ${text.slice(0, 500)}`;
      parsedBody = text || undefined;
    }

    throw new HttpError(
      response.status,
      response.url,
      msg,
      parsedBody
    );
  }

  private hasHeader(obj: Record<string, string>, name: string) {
    const lower = name.toLowerCase();
    return Object.keys(obj).some((k) => k.toLowerCase() === lower);
  }

  private async request(
    url: string,
    config: Pick<
      FetchRequestInit,
      "method" | "cache" | "next" | "headers" | "body"
    >
  ) {
    const headersObj: HeadersObject = {
      ...(this.initConfig.headers ?? {}),
      ...(config.headers ?? {}),
    };
    const isJsonBody =
      config.body != null &&
      !(config.body instanceof FormData) &&
      !(config.body instanceof Blob) &&
      !(config.body instanceof ArrayBuffer) &&
      !(config.body instanceof URLSearchParams);

    if (isJsonBody && !this.hasHeader(headersObj, "content-type")) {
      headersObj["Content-Type"] = "application/json";
    }
    if (!this.hasHeader(headersObj, "accept")) {
      headersObj["Accept"] = "application/json, text/plain, */*";
    }

    let fetchConfig: FetchRequestInit = {
      ...this.initConfig,
      ...config,
      headers: headersObj,
    };

    for (const interceptor of this.interceptors.request.getAll()) {
      fetchConfig = await interceptor(fetchConfig);
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(fetchConfig.headers ?? {})) {
      headers.set(k, v);
    }

    const finalConfig: RequestInit = {
      ...fetchConfig,
      headers,
    };

    let response = await fetch(url, finalConfig);

    for (const interceptor of this.interceptors.response.getAll()) {
      const maybe = await interceptor(response);
      response = (maybe ?? response) as Response;
    }

    if (response.bodyUsed) {
      throw new Error(
        "[Api] Response body was consumed by a response interceptor. Return a new Response."
      );
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
      this.buildURLString(url, params),
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
    config: Omit<RequestParams, "body"> = {}
  ): Promise<T> {
    return this.send("GET", url, config);
  }

  public async post<T, K extends object>(
    url: string,
    config: RequestParams<K> = {}
  ): Promise<T> {
    return this.send("POST", url, config);
  }

  public async put<T, K extends object>(
    url: string,
    config: RequestParams<K> = {}
  ): Promise<T> {
    return this.send("PUT", url, config);
  }

  public async patch<T, K extends object>(
    url: string,
    config: RequestParams<K> = {}
  ): Promise<T> {
    return this.send("PATCH", url, config);
  }

  public async delete<T>(
    url: string,
    config: Omit<RequestParams, "body"> = {}
  ): Promise<T> {
    return this.send("DELETE", url, config);
  }
}
