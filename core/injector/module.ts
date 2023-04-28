import { InstanceWrapper } from "./instance-wrapper";
import { randomStringGenerator } from "../../common/utils/random-string-generator.util";

export class Module {
    private readonly _imports = new Set<Module>();
    private readonly _providers = new Map<any, InstanceWrapper>();
    private readonly _controllers = new Map<string, InstanceWrapper>();

    private _token: string | undefined;

    constructor(
        private readonly module: any,
    ) {}

    get providers(): Map<string, any> {
        return this._providers;
    }

    get controllers(): Map<string, any> {
        return this._controllers;
    }

    get metatype() {
        return this.module;
    }

    get token() {
        return this._token!;
    }

    set token(token: string) {
        this._token = token;
    }

    public addProvider(provider: any) {
        this._providers.set(
            provider.name,
            new InstanceWrapper({
              name: provider.name,
              metatype: provider,
              instance: null,
            }),
        )
    }

    public addController(controller: any) {
        this._controllers.set(
            controller.name,
            new InstanceWrapper({
              name: controller.name,
              metatype: controller,
              instance: null,
            }),
        );

        this.assignControllerUniqueId(controller);
    }

    public assignControllerUniqueId(controller: any) {
        Object.defineProperty(controller, 'CONTROLLER_ID', {
          enumerable: false,
          writable: false,
          configurable: true,
          value: randomStringGenerator(),
        });
    }

    public addRelatedModule(module: Module) {
        this._imports.add(module);
    }
}