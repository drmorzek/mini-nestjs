import { ROUTE_ARGS_METADATA } from "../constants";
import { RouteParamtypes } from "../enums/route-paramtypes.enum";
import { isNil, isString } from "../utils/shared.utils";

/**
 * Здесь используется неизменяемость данных, для того, чтобы
 * использовать один метод для нескольких типов запроса.
 */
const createPipesRouteParamDecorator = (paramtype: RouteParamtypes) => (
    data?: any,
  ): ParameterDecorator => (target, key, index) => {
    console.log('paramtype: ', paramtype)
    console.log('key: ', key)
    console.log('index: ', index)
    const hasParamData = isNil(data) || isString(data);
    const paramData = hasParamData ? data : undefined;
    const args =
      Reflect.getMetadata(ROUTE_ARGS_METADATA, target.constructor, key) || {};
  
    // Где paramtype это body или param, а index его
    // положение в параметрах функции, где находится декоратор,
    // для правильного присвоения после получения из request
    Reflect.defineMetadata(
      ROUTE_ARGS_METADATA,
      {
        ...args,
        [`${paramtype}:${index}`]: {
          index,
          data: paramData,
        },
      },
      target.constructor,
      key,
    );
};

export function Body(
    property?: string,
  ): ParameterDecorator {
    return createPipesRouteParamDecorator(RouteParamtypes.BODY)(
      property,
    );
}

export function Param(
    property?: string,
  ): ParameterDecorator {
    return createPipesRouteParamDecorator(RouteParamtypes.PARAM)(
      property,
    );
}