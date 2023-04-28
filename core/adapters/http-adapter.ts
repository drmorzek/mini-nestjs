import { HttpServer } from "../../common/interfaces/http-server.interface";

export abstract class AbstractHttpAdapter<
  TServer = any,
  TRequest = any,
  TResponse = any
> implements HttpServer<TRequest, TResponse> {
  protected httpServer: TServer | undefined;

  constructor(protected readonly instance: any) {}

  public use(...args: any[]) {
    return this.instance.use(...args);
  }

  public get(...args: any[]) {
    return this.instance.get(...args);
  }

  public post(...args: any[]) {
    return this.instance.post(...args);
  }

  public listen(port: any) {
    return this.instance.listen(port);
  }

  public getHttpServer(): TServer {
    return this.httpServer as TServer;
  }

  public setHttpServer(httpServer: TServer) {
    this.httpServer = httpServer;
  }

  public getInstance<T = any>(): T {
    return this.instance as T;
  }

  abstract initHttpServer(): any;
  abstract reply(response: any, body: any, statusCode?: number): any;
  abstract registerBodyParser(prefix?: string): any;
}
