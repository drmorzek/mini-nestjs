import { HttpServer } from '../../common/interfaces/http-server.interface';

export class RouterResponseController {
    constructor(private readonly applicationRef: HttpServer) {}

    public async apply<TInput = any, TResponse = any>(
        result: TInput,
        response: TResponse,
        httpStatusCode?: number,
      ) {
        return this.applicationRef.reply(response, result, httpStatusCode);
      }
}