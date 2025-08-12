export default class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly details?: string,
    public readonly body?: unknown
  ) {
    super(`HTTP ${status}: ${url}${details ? ` — ${details}` : ""}`);
    this.name = "HttpError";
  }

  get errors() {
    return this.body;
  }
}
