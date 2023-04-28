import { SCOPE_OPTIONS_METADATA } from '../constants';

export enum Scope {
    DEFAULT,
    TRANSIENT,
    REQUEST,
}

export interface ScopeOptions {
    scope?: Scope;
}

export type InjectableOptions = ScopeOptions;

export function Injectable(options?: InjectableOptions): ClassDecorator {
    return (target: object) => {
      Reflect.defineMetadata(SCOPE_OPTIONS_METADATA, options, target);
    };
}