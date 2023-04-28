import { PATH_METADATA } from "../constants";
import { isUndefined } from "../utils/shared.utils";

export function Controller(
  prefix?: string,
): ClassDecorator {
  const defaultPath = '/';
  
  const path = isUndefined(prefix) ? defaultPath : prefix

  return (target: object) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
}