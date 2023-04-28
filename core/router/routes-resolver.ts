import { NestContainer } from '../injector/container';
import { Resolver } from '../router/interfaces/resolver.interface';
import { MODULE_PATH } from '../../common/constants';
import { HttpServer } from '../../common/interfaces/http-server.interface';
import { InstanceWrapper } from '../injector/instance-wrapper';
import { RouterExplorer } from './router-explorer';

export class RoutesResolver implements Resolver {
    private readonly routerExplorer: RouterExplorer;

    constructor(
        private readonly container: NestContainer,
      ) {
        this.routerExplorer = new RouterExplorer(
            this.container,
        );
    }

    /**
     * Для каждого модуля сначала находит базовый путь, который
     * указывается в декораторе Module,
     * и передает его и контроллеры в метод registerRouters
     */
    public resolve(applicationRef: any, basePath: string): void {
        const modules = this.container.getModules();
        modules.forEach(({ controllers, metatype }) => {
            let path = metatype ? this.getModulePathMetadata(metatype) : undefined;
            path = path ? basePath + path : basePath;
            this.registerRouters(controllers, metatype.name, path, applicationRef);
        });
    }

    /**
     * Для каждого контроллера в модуле, запускает метод explore
     * класса routerExplorer, который отвечает за всю логику
     * регистрации роутеров
     */
    public registerRouters(
        routes: Map<string, InstanceWrapper<any>>,
        moduleName: string,
        basePath: string,
        applicationRef: HttpServer,
      ) {
        routes.forEach(instanceWrapper => {
          const { metatype } = instanceWrapper;
    
          // Находит путь для декоратора контроллера, например @Controller('cats')
          const paths = this.routerExplorer.extractRouterPath(
            metatype as any,
            basePath,
          );
    
          // Если путь был передан как @Controllers('cats'), то будет вызвано один раз.
          // Дело в том, что reflect возвращает массив
          paths.forEach(path => {
            this.routerExplorer.explore(
              instanceWrapper,
              moduleName,
              applicationRef,
              path,
            );
          });
        });
      }

    private getModulePathMetadata(metatype: object): string | undefined {
        return Reflect.getMetadata(MODULE_PATH, metatype);
    }
}