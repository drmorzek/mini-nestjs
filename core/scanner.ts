import { MODULE_METADATA } from "../common/constants";
import { NestContainer } from "./injector/container";
import 'reflect-metadata';
import { Module } from "./injector/module";

export class DependenciesScanner {

    constructor(private readonly container: NestContainer) {}

    public async scan(module: any) {
        // Сначала сканирует все модули, которые есть в приложении, и добавляет их в контейнер
        await this.scanForModules(module);
        // После у каждого модуля сканирует зависимости, такие как Controllers и Providers
        await this.scanModulesForDependencies();
    }

    public async scanForModules(module: any) {
        // Добавляет модуль в контейнер и возвращает при этом его экземпляр
        const moduleInstance = await this.insertModule(module);
        // Получает модули, которые были импортированы в этот модуль в массив imports. 
        // Так как AppModule - корневой модуль, то от него идет дерево модулей.
        const innerModules = [...this.reflectMetadata(moduleInstance, MODULE_METADATA.IMPORTS)];

        // Перебирает внутренние модули этого модуля, чтобы сделать с ними тоже самое.
        // То есть, происходит рекурсия.
        for (const [index, innerModule] of innerModules.entries()) {
            await this.scanForModules(innerModule)
        }

        return moduleInstance
    }

    /**
     * Добавляет модуль в контейнер
     */
    public async insertModule(module: any) {
        return this.container.addModule(module);
    }


    /**
     * Получает из контейнера все модули, и сканирует у них 
     * зависимости, которые хранятся в reflect объекте.
     */
    public async scanModulesForDependencies() {
        const modules: Map<string, Module> = this.container.getModules();

        for (const [token, { metatype }] of modules) {
            await this.reflectAndAddImports(metatype, token);
            this.reflectAndAddProviders(metatype, token);
            this.reflectAndAddControllers(metatype, token);
        }
    }

    public async reflectAndAddImports(
        module: any,
        token: string,
    ) {
        // Получает по модулю imports зависимости и добавляет их в контейнер
        const modules = this.reflectMetadata(module, MODULE_METADATA.IMPORTS);
        for (const related of modules) {
            await this.container.addImport(related, token);
        }
    }

    public reflectAndAddProviders(
        module: any,
        token: string,
    ) {
        // Получает по модулю providers зависимости и добавляет их в контейнер
        const providers = this.reflectMetadata(module, MODULE_METADATA.PROVIDERS);
        providers.forEach((provider: any) => 
            this.container.addProvider(provider, token),
        );
    }

    public reflectAndAddControllers(module: any, token: string) {
        // Получает по модулю controllers зависимости и добавляет их в контейнер
        const controllers = this.reflectMetadata(module, MODULE_METADATA.CONTROLLERS);
        controllers.forEach((controller: any) => 
            this.container.addController(controller, token),
        );
    }

    /**
     * Метод, который получает нужные зависимости по модулю и ключу зависимостей.
     */
    public reflectMetadata(metatype: any, metadataKey: string) {
        return Reflect.getMetadata(metadataKey, metatype) || [];
    }
}