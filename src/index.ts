import {
  ApiConstructor,
  IRequestInit,
  QueryParams,
  RequestParams,
} from "./types";
import buildQueryString from "./utils";

export default class Api {
  private readonly baseErrorMessage: string = "HTTP error!";
  private readonly baseUrl: string;
  private readonly initConfig: Omit<IRequestInit, "body"> = {};

  constructor({ baseUrl, initConfig }: ApiConstructor) {
    this.baseUrl = baseUrl;
    if (initConfig) this.initConfig = initConfig;
  }

  private formatUrl(url: string) {
    if (url.startsWith("/")) return url.replace(/^\/+/, "");
    return url;
  }

  private buildUrlString(url: string, params?: QueryParams) {
    const queryString = params ? `?${buildQueryString(params)}` : "";
    return `${this.baseUrl}/${this.formatUrl(url)}${queryString}`;
  }

  private async handleError(response: Response): Promise<never> {
    const error = await response.json();
    let errorString = `${this.baseErrorMessage} status:${response.status}`;
    if (error.error && error.error.message)
      errorString += ` ${error.error.message}`;
    else if (error.message) errorString += ` ${error.message}`;
    throw new Error(errorString);
  }

  private formatBody(body: unknown) {
    return body instanceof FormData ? body : JSON.stringify(body);
  }

  private request(
    url: string,
    config: Pick<
      IRequestInit,
      "method" | "cache" | "next" | "headers" | "body"
    >
  ) {
    return fetch(url, {
      ...this.initConfig,
      ...config,
      headers: {
        ...(config.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...this.initConfig?.headers,
        ...config?.headers,
      },
    });
  }

  public async get<T>(
    url: string,
    { params, ...config }: Omit<RequestParams, "body">
  ): Promise<T> {
    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method: "GET",
      }
    );

    if (!response.ok) await this.handleError(response);

    return response.json();
  }

  public async post<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method: "POST",
        body: this.formatBody(body),
      }
    );
    if (!response.ok) await this.handleError(response);

    return response.json();
  }

  public async put<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method: "PUT",
        body: this.formatBody(body),
      }
    );
    if (!response.ok) await this.handleError(response);

    return response.json();
  }

  public async patch<T, K extends object>(
    url: string,
    { body, params, ...config }: RequestParams<K>
  ): Promise<T> {
    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method: "PATCH",
        body: this.formatBody(body),
      }
    );
    if (!response.ok) await this.handleError(response);

    return response.json();
  }

  public async delete<T>(
    url: string,
    { params, ...config }: Omit<RequestParams, "body">
  ): Promise<T> {
    const response = await this.request(
      this.buildUrlString(url, params),
      {
        ...config,
        method: "DELETE",
      }
    );

    if (!response.ok) await this.handleError(response);

    return response.json();
  }
}
