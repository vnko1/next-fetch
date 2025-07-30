import { QueryParams } from "./types";
import buildQueryString from "./utils";

interface NextFetchReqConfig {
  revalidate: false | 0 | number;
  tags: string[];
}

interface ApiConstructor {
  baseUrl: string;
  config?: Omit<RequestInit, "method">;
}

interface RequestParams<T extends object = {}>
  extends Pick<RequestInit, "cache" | "headers"> {
  body: T;
  params?: QueryParams;
  next?: NextFetchReqConfig;
}

interface IRequestInit extends RequestInit {
  next?: NextFetchReqConfig;
}

export default class Api {
  private readonly baseError: string = "HTTP error!";
  private readonly baseUrl: string;
  private readonly config: RequestInit = {};

  constructor({ baseUrl, config }: ApiConstructor) {
    this.baseUrl = baseUrl;
    if (config) this.config = config;
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
    let errorString = `${this.baseError} status:${response.status}`;
    if (error.error && error.error.message)
      errorString += ` ${error.error.message}`;
    else if (error.message) errorString += ` ${error.message}`;
    throw new Error(errorString);
  }

  private request(
    url: string,
    config: Pick<
      IRequestInit,
      "method" | "cache" | "next" | "headers" | "body"
    >
  ) {
    return fetch(url, {
      ...this.config,
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...this.config?.headers,
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
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) await this.handleError(response);

    return response.json();
  }
}
