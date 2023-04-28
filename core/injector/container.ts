import { Module } from "./module";
import { ModuleTokenFactory } from "./module-token-factory";
import { AbstractHttpAdapter } from "../adapters";

export class NestContainer {
    private readonly modules = new Map<string, Module>();
    private readonly moduleTokenFactory = new ModuleTokenFactory();
    private httpAdapter: AbstractHttpAdapter | undefined;

    /**
     * Создает экземпляр класса Module и сохряняет его в контейнер
     */
    public async addModule(module: any) {
        // Создает токен модуля, который будет являться его ключом Map, 
        // который и будет использоваться для проверки и получения этого модуля.
        const token = this.moduleTokenFactory.create(module);

        if (this.modules.has(module.name)) {
            return;
        }

        const moduleRef = new Module(module);
        moduleRef.token = token;
        this.modules.set(token, moduleRef);

        return moduleRef;
    }

    /**
     * Возвращает все модули, для сканирования зависимостей, 
     * создания экземпляров этих зависимостей, и для использования в качестве callbacks
     * при создании роутеров его контроллеров, с разрешенными зависимостями.
     */
    public getModules(): Map<string, Module> {
        return this.modules;
    }

    /**
     * Контейнер также устанавливает и хранит единственный экземпляр http сервера,
     * в нашем случае express. Этот метод вызывается в классе NestFactory.
     */
    public setHttpAdapter(httpAdapter: any) {
        this.httpAdapter = httpAdapter;
    }

    /**
     * Будет вызван при создании роутеров в классе RouterExplorer.
     */
    public getHttpAdapterRef() {
        return this.httpAdapter;
    }    

    /**
     * При сканировании зависимостей для полученых модулей в DependenciesScanner,
     * у них также берется токен, по которому здесь находится модуль, 
     * и с помощью своего метода добавляет к себе импортированный модуль.
     */
    public async addImport(
        relatedModule: any,
        token: string,
    ) {
        if (!this.modules.has(token)) {
            return;
        }
        const moduleRef = this.modules.get(token);
        if (!moduleRef) {
            throw Error('MODULE NOT EXIST')
        }

        const related = this.modules.get(relatedModule.name);
        if (!related) {
            throw Error('RELATED MODULE NOT EXIST')
        }
        moduleRef.addRelatedModule(related);
    }

    /**
     * Также как и для имортированных модулей, подобная функциональность
     * работает и для провайдеров.
     */
    public addProvider(provider: any, token: string) {
        if (!this.modules.has(token)) { 
            throw new Error(`Module with token: ${token} not found.`);
        }
        const moduleRef = this.modules.get(token);
        if (!moduleRef) {
            throw Error('MODULE NOT EXIST')
        }
        moduleRef.addProvider(provider)
    }

    /**
     * Также как и для имортированных модулей, подобная функциональность
     * работает и для контроллеров.
     */
    public addController(controller: any, token: string) {
        if (!this.modules.has(token)) {
            throw new Error(`Module with token: ${token} not found.`);
        }
        const moduleRef = this.modules.get(token);
        if (!moduleRef) {
            throw Error('MODULE NOT EXIST')
        }
        moduleRef.addController(controller);
    }
}