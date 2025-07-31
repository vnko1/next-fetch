import { Interceptor } from "../types";

export class InterceptorManager<T> {
  private handlers = new Map<number, Interceptor<T>>();
  private idCounter = 0;

  use(interceptor: Interceptor<T>): number {
    const id = this.idCounter++;
    this.handlers.set(id, interceptor);
    return id;
  }

  eject(id: number): void {
    this.handlers.delete(id);
  }

  getAll(): Interceptor<T>[] {
    return Array.from(this.handlers.values());
  }
}
