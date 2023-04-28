import { Module } from "./module";
import { InstanceWrapper } from './instance-wrapper';
import { Controller } from '../../common/interfaces/controller.interface';
import { Type } from  '../../common/interfaces/type.interface';

export class Injector {

    public async loadInstance<T>(
        wrapper: InstanceWrapper<T>,
        collection: Map<string, InstanceWrapper>,
        moduleRef: Module,
    ) {
        const { name } = wrapper;

        const targetWrapper = collection.get(name);
        if (!targetWrapper) {
            throw Error('TARGET WRAPPER NOT FOUNDED')
        }
        const callback = async (instances: unknown[]) => { 
            await this.instantiateClass(
                instances,
                wrapper,
                targetWrapper,
            );
        }
        await this.resolveConstructorParams<T>(
            wrapper,
            moduleRef,
            callback,
          );
    }

    public async loadProvider(
        wrapper: any,
        moduleRef: Module,
    ) {
        const providers = moduleRef.providers;
        await this.loadInstance<any>(
            wrapper,
            providers,
            moduleRef,
        );
    }

    public async loadControllers(
        wrapper: any,
        moduleRef: Module,
    ) {
        const controllers = moduleRef.controllers;
        await this.loadInstance<Controller>(
            wrapper,
            controllers,
            moduleRef,
        );
    }

    /**
     * design:paramtypes создается автоматически объектом reflect
     * для зависимостей, указанных в конструктуре класса. 
     * Как видно, если провайдеру нужно разрешить зависимости, 
     * то они также должны быть провайдерами.
     * callback, как видно из метода loadInstance, вызывает метод
     * instantiateClass для найденных зависимостей в виде провайдеров.
     */
    public async resolveConstructorParams<T>(
        wrapper: InstanceWrapper<T>,
        moduleRef: Module,
        callback: (args: unknown[]) => void | Promise<void>,
    ) {
        const dependencies = Reflect.getMetadata('design:paramtypes', wrapper.metatype) 
    
        const resolveParam = async (param: Function, index: number) => {
          try {
            let providers = moduleRef.providers
            const paramWrapper = providers.get(param.name);
            console.log(`paramInstance: ${paramWrapper?.instance}`)
            return paramWrapper?.instance
          } catch (err) {
              throw err;
          }
        };
        const instances = dependencies ? await Promise.all(dependencies.map(resolveParam)) : [];
        await callback(instances);
    }

    /**
     * Создает экземпляр зависимости, которая хранится в InstanceLoader,
     * как metatype, с ее зависимостями, которые являются провайдерами,
     * и добавляет этот экземпляр в instance поле класса InstanceLoader,
     * для дальнейшего извлечения при создании роутеров.
     */
    public async instantiateClass<T = any>(
        instances: any[],
        wrapper: InstanceWrapper,
        targetMetatype: InstanceWrapper,
    ): Promise<T> {
        const { metatype } = wrapper;
        console.log(`instances: ${instances}`)

        targetMetatype.instance = instances 
            ? new (metatype as Type<any>)(...instances) 
            : new (metatype as Type<any>)();
        
        return targetMetatype.instance;
    }
}