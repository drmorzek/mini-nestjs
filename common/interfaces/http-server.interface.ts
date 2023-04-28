export type ErrorHandler<TRequest = any, TResponse = any> = (
    error: any,
    req: TRequest,
    res: TResponse,
    next?: Function,
) => any;

export type RequestHandler<TRequest = any, TResponse = any> = (
    req: TRequest,
    res: TResponse,
    next?: Function,
) => any;

export interface HttpServer<TRequest = any, TResponse = any> {
    reply(response: any, body: any, statusCode?: number): any;
    get(handler: RequestHandler<TRequest, TResponse>): any;
    get(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    post(handler: RequestHandler<TRequest, TResponse>): any;
    post(path: string, handler: RequestHandler<TRequest, TResponse>): any;
    listen(port: number | string): any;

    getInstance(): any;
    getHttpServer(): any;
    initHttpServer(): void;
    registerBodyParser(): void
}