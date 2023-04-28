import { MODULE_METADATA as metadataConstants } from '../constants';

const metadataKeys = [
  metadataConstants.IMPORTS,
  metadataConstants.EXPORTS,
  metadataConstants.CONTROLLERS,
  metadataConstants.PROVIDERS,
];
  
/**
 * Проверяет, чтобы были указаны только правильные массивы,
 * соответствующие metadataKeys
 */
export function validateModuleKeys(keys: string[]) {
  const validateKey = (key: string) => {
    if (metadataKeys.includes(key)) {
      return;
    }
    throw new Error(`NOT INVALID KEY: ${key}`);
  };
  keys.forEach(validateKey);
}

/**
 * Сохраняет зависимости в объект Reflect.
 * Где property название одной из зависимости,
 * например controllers. Именно благодаря этому,
 * у нас есть возможность извлекать данные после.
 */
export function Module(metadata: any): ClassDecorator {
  const propsKeys = Object.keys(metadata);
  validateModuleKeys(propsKeys);

  return (target: Function) => {
    for (const property in metadata) {
      if (metadata.hasOwnProperty(property)) {
        Reflect.defineMetadata(property, (metadata as any)[property], target);
      }
    }
  };
}