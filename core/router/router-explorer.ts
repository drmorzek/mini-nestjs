import { NestContainer } from '../injector/container';
import { RouterProxyCallback } from './router-proxy';
import { addLeadingSlash } from '../../common/utils/shared.utils';
import { Type } from '../../common/interfaces/type.interface';
import { Controller } from '../../common/interfaces/controller.interface';
import { PATH_METADATA, METHOD_METADATA, ROUTE_ARGS_METADATA, PARAMTYPES_METADATA } from '../../common/constants';
import { RequestMethod } from '../../common/enums/request-method.enum';
import { HttpServer } from '../../common/interfaces/http-server.interface';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { RouterMethodFactory } from '../helpers/router-method-factory';
import {
  isConstructor,
  isFunction,
  isString,
} from '../../common/utils/shared.utils';
import { RouteParamtypes } from '../../common/enums/route-paramtypes.enum';


export interface RoutePathProperties {
    path: string[];
    requestMethod: RequestMethod;
    targetCallback: RouterProxyCallback;
    methodName: string;
  }
  
export class RouterExplorer {
    private readonly routerMethodFactory = new RouterMethodFactory();

    constructor (
        private readonly container: NestContainer,
    ) {
    }    

    public explore<T extends HttpServer = any>(
        instanceWrapper: InstanceWrapper,
        module: string,
        router: T,
        basePath: string,
      ) {
        const { instance } = instanceWrapper;
        const routePaths: RoutePathProperties[] = this.scanForPaths(instance);
        
        // Для каждого метода контроллера запускает регистрацию роутеров
        (routePaths || []).forEach((pathProperties: any) => {
            this.applyCallbackToRouter(
              router,
              pathProperties,
              instanceWrapper,
              module,
              basePath,
            );
        })
    }

    /**
     * Метод, который сканирует контроллер, и находит у него методы
     * запроса с определенными путями, например метод, на который
     * навешен декоратор @post('add_to_database').
     * В таком случае эта функция возвращает массив методов контроллера
     * с путями, телами этих методов, методом request и именами, которые
     * получаются в методе exploreMethodMetadata
     */
    public scanForPaths(
        instance: Controller,
      ): RoutePathProperties[] {
        const instancePrototype = Object.getPrototypeOf(instance);
        let methodNames = Object.getOwnPropertyNames(instancePrototype);

        const isMethod = (prop: string) => {
          const descriptor = Object.getOwnPropertyDescriptor(instancePrototype, prop);
          if (descriptor?.set || descriptor?.get) {
            return false;
          }
          return !isConstructor(prop) && isFunction(instancePrototype[prop]);
        };
    
        return methodNames.filter(isMethod).map(method => this.exploreMethodMetadata(instance, instancePrototype, method))
    }

    /**
     * Для определенного метода контроллера возвращает его свойства,
     * для метода scanForPaths
     */
    public exploreMethodMetadata(
      instance: Controller,
      prototype: object,
      methodName: string,
    ): RoutePathProperties {
      const instanceCallback = (instance as any)[methodName];
      const prototypeCallback = (prototype as any)[methodName];
      const routePath = Reflect.getMetadata(PATH_METADATA, prototypeCallback);

      const requestMethod: RequestMethod = Reflect.getMetadata(
        METHOD_METADATA,
        prototypeCallback,
      );
      const path = isString(routePath)
        ? [addLeadingSlash(routePath)]
        : routePath.map((p: string) => addLeadingSlash(p));
      return {
        path,
        requestMethod,
        targetCallback: instanceCallback,
        methodName,
      };
    }

    private applyCallbackToRouter<T extends HttpServer>(
        router: T,
        pathProperties: RoutePathProperties,
        instanceWrapper: InstanceWrapper,
        moduleKey: string,
        basePath: string,
      ) {
        const {
          path: paths,
          requestMethod,
          targetCallback,
          methodName,
        } = pathProperties;
        const { instance } = instanceWrapper;
        // Получает определенный http метод
        const routerMethod = this.routerMethodFactory
          .get(router, requestMethod)
          .bind(router);
    
        // Создает callback для определенного метода
        const handler = this.createCallbackProxy(
          instance,
          targetCallback,
          methodName,
        );
    
        // Если декоратор используется как @Post('add_to_database'),
        // то будет вызвано один раз для этого пути.
        paths.forEach(path => {
          const fullPath = this.stripEndSlash(basePath) + path;
          // Региструет http метод. Сопоставляет путь метода, и его callback,
          // полученный из контроллера. Ответ же производится reply методом,
          // реализованным в классе ExpressAdapter
          routerMethod(this.stripEndSlash(fullPath) || '/', handler);
        });
    }

    public stripEndSlash(str: string) {
      return str[str.length - 1] === '/' ? str.slice(0, str.length - 1) : str;
    }

    public createCallbackProxy(
      instance: Controller,
      callback: (...args: any[]) => unknown,
      methodName: string,
    ) {
      // Достает ключи данных запроса указанных раннее в декораторах @Body() и @Param()
      const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, instance.constructor, methodName) || {};
      const keys = Object.keys(metadata);
      const argsLength = Math.max(...keys.map(key => metadata[key].index)) + 1
      // Было создано автоматически
      const paramtypes = Reflect.getMetadata(PARAMTYPES_METADATA, instance, methodName);

      const mergeParamsMetatypes = (paramsProperties: any, paramtypes_: any) => {
        paramsProperties.map((param: any) => ({
          ...param,
          metatype: paramtypes_[param.index],
        }));
      }
      // const paramsOptions = mergeParamsMetatypes(
      //   this.exchangeKeysForValues(keys, metadata),
      //   paramtypes,
      // );
      // Извлеченные данные из request, такие как тело и параметры запроса.
      const paramsOptions = this.exchangeKeysForValues(keys, metadata);

      const fnApplyParams = this.resolveParamsOptions(paramsOptions)
      const handler = <TRequest, TResponse>(
        args: any[],
        req: TRequest,
        res: TResponse,
        next: Function,
      ) => async () => {
        // так как args это объект, а не примитивная переменная,
        // то он передается по ссылке, а не по значению,
        // поэтому он изменяется, и после вызова fnApplyParams,
        // в args хранятся аргументы, полученные из request
        fnApplyParams && (await fnApplyParams(args, req, res, next));
        // Здесь мы привязываем один из методов контроллера, 
        // например, добавление данных в базу данных, и аргументы из request,
        // и теперь он может ими управлять, как и задумано
        return callback.apply(instance, args);
      };
      const targetCallback = async <TRequest, TResponse>(
          req: TRequest,
          res: TResponse,
          next: Function,
        ) => {
          // Заполняется undefined для дальнейшего изменения реальными данными
          // из request
          const args = Array.apply(null, { argsLength } as any).fill(undefined);
          // result это экземпляр контроллера с пространством данных аргументов
          // из request
          const result = await handler(args, req, res, next)()
          const applicationRef = this.container.getHttpAdapterRef()
          if(!applicationRef) {
            throw new Error(`Http server not created`)
          }
          return await applicationRef.reply(res, result);
        }
      return async <TRequest, TResponse>(
        req: TRequest,
        res: TResponse,
        next: () => void,
      ) => {
        try {
          await targetCallback(req, res, next);
        } catch (e) {
          throw e
        }
      };
    }

    /**
     * extractValue здесь это метод exchangeKeyForValue.
     * И ему передается request, для извлечения данных запросаю
     */
    public resolveParamsOptions(paramsOptions: any) {
      const resolveFn = async (args: any, req: any, res: any, next: any) => {
        const resolveParamValue = async (param: any) => {
          const { index, extractValue } = param;
          const value = extractValue(req, res, next);
          args[index] = value
        }
        await Promise.all(paramsOptions.map(resolveParamValue));
      }
      return paramsOptions && paramsOptions.length ? resolveFn : null;
    }

    /**
     * Перебирает ключи данных запроса для вызова для каждого
     * метода exchangeKeyForValue, который достанет соответствующие данные,
     * которые были определены раннее в декораторах @Body() и @Param(),
     * из request.
     */
    public exchangeKeysForValues(
      keys: string[],
      metadata: Record<number, any>,
    ): any[] {
      return keys.map((key: any) => {
        const { index, data } = metadata[key];
        const numericType = Number(key.split(':')[0]);
        const extractValue = <TRequest, TResponse>(
          req: TRequest,
          res: TResponse,
          next: Function,
        ) =>
          this.exchangeKeyForValue(numericType, data, {
            req,
            res,
            next,
        });
        return { index, extractValue, type: numericType, data }
      })
    }

    /**
     * Проверяет чему соответствует ключ данных, телу или параметрам запроса.
     * Это определяется в соответствующих декораторах @Body() и @Param().
     * И теперь, когда запрос на соответсвтующий api выполнен, мы пытаемся
     * достать их из request, если они были переданы.
     */
    public exchangeKeyForValue<
      TRequest extends Record<string, any> = any,
      TResponse = any,
      TResult = any
    >(
      key: RouteParamtypes | string,
      data: string | object | any,
      { req, res, next }: { req: TRequest; res: TResponse; next: Function },
    ): TResult | null {
      switch (key) {
        case RouteParamtypes.BODY:
          return data && req.body ? req.body[data] : req.body;
        case RouteParamtypes.PARAM:
          return data ? req.params[data] : req.params;
        default:
          return null;
      }
    }

    public extractRouterPath(metatype: Type<Controller>, prefix = ''): string[] {
        let path = Reflect.getMetadata(PATH_METADATA, metatype);
    
        if (Array.isArray(path)) {
          path = path.map(p => prefix + addLeadingSlash(p));
        } else {
          path = [prefix + addLeadingSlash(path)];
        }
    
        return path.map((p: string) => addLeadingSlash(p));
    }
}