import { HttpServer } from '../common/interfaces/http-server.interface';
import { Resolver } from './router/interfaces/resolver.interface';
import { addLeadingSlash } from '../common/utils/shared.utils';
import { NestContainer } from './injector/container';
import { RoutesResolver } from './router/routes-resolver';

export class NestApplication {
    private readonly routesResolver: Resolver;
    public httpServer: any;

    constructor(
        private readonly container: NestContainer,
        private readonly httpAdapter: HttpServer,
    ) {
        this.registerHttpServer();

        this.routesResolver = new RoutesResolver(
            this.container,
        );
    }

    public registerHttpServer() {
        this.httpServer = this.createServer();
    }

    /**
     * Начинает процесс инициализации выбранного http сервера
     */
    public createServer<T = any>(): T {
        this.httpAdapter.initHttpServer();
        return this.httpAdapter.getHttpServer() as T;
    }

    public async init(): Promise<this> {
        this.httpAdapter.registerBodyParser();
        await this.registerRouter();
        return this;
    }

    /**
     * Метод, с помощью которого запускается приложение Nest.
     * Он запускает процесс инициализации http сервера, регистрации
     * созданных роутеров, и запуска сервера на выбранном порте.
     */
    public async listen(port: number | string) {
        await this.init();
        this.httpAdapter.listen(port);
        return this.httpServer;
    }

    /**
     * Метод, который запускает регистрацию роутеров,
     * которые были созданны с помощью декораторов http методов,
     * таких как post и get.
     */
    public async registerRouter() {
        const prefix = ''
        const basePath = addLeadingSlash(prefix);
        this.routesResolver.resolve(this.httpAdapter, basePath);
    }
}