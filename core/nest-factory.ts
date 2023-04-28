import { NestApplication } from "./nest-application";
import { NestContainer } from "./injector/container";
import { InstanceLoader } from "./injector/instance-loader";
import { DependenciesScanner } from "./scanner";
import { ExpressAdapter } from '../platform-express/express.adapter';

export class NestFactoryStatic {

    public async create(module: any) {
        const container = new NestContainer();
        await this.initialize(module, container);

        const httpServer = new ExpressAdapter()
        container.setHttpAdapter(httpServer);
        const instance = new NestApplication(
            container,
            httpServer,
        );
        
        return instance;
    }

    private async initialize(
        module: any, 
        container: NestContainer,
    ) {
        const instanceLoader = new InstanceLoader(container)
        const dependenciesScanner = new DependenciesScanner(container);

        await dependenciesScanner.scan(module);
        await instanceLoader.createInstancesOfDependencies();
    }
}


/**
 * Используйте NestFactory для создания экземпляра приложения.
 * 
 * ### Указание входного модуля
 * 
 * Передайте требуемый *root module* (корневой модуль) для приложения
 * через параметр модуля. По соглашению он обычно называется
 * `ApplicationModule`. Начиная с этого модуля Nest собирает граф
 * зависимостей и создает экземпляры классов, необходимых для запуска
 * вашего приложения.
 * 
 * @publicApi
 */
export const NestFactory = new NestFactoryStatic();