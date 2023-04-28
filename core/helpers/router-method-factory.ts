import { HttpServer } from '../../common/interfaces/http-server.interface';
import { RequestMethod } from '../../common/enums/request-method.enum';

export class RouterMethodFactory {
  public get(target: HttpServer, requestMethod: RequestMethod): Function {
    switch (requestMethod) {
      case RequestMethod.POST:
        return target.post;
      default: {
        return target.get;
      }
    }
  }
}