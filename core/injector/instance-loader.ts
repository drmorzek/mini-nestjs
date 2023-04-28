import { NestContainer } from "./container";
import { Injector } from "./injector";
import { Module } from "./module";

export class InstanceLoader {
    private readonly injector = new Injector();

    constructor(private readonly container: NestContainer) {}

    public async createInstancesOfDependencies() {
        const modules = this.container.getModules();

        await this.createInstances(modules);
    }

    /**
     * Сначала создаются экземпляры провайдеров,
     * потому что если они являются зависимостями контроллеров,
     * при создании экземпляров для контроллеров, они уже должны 
     * существовать.
     */
    private async createInstances(modules: Map<string, Module>) {
        await Promise.all(
            [...modules.values()].map(async module => {
                await this.createInstancesOfProviders(module);
                await this.createInstancesOfControllers(module);
            })
        )
    }

    private async createInstancesOfProviders(module: Module) {
        const { providers } = module;
        const wrappers = [...providers.values()];
        await Promise.all(
            wrappers.map(item => this.injector.loadProvider(item, module)),
        )
    }

    private async createInstancesOfControllers(module: Module) {
        const { controllers } = module;
        const wrappers = [...controllers.values()];
        await Promise.all(
            wrappers.map(item => this.injector.loadControllers(item, module)),
        )
    }
}