import hash from 'object-hash';
import { v4 as uuid } from 'uuid';
import { Type } from '../../common/interfaces/type.interface';

export class ModuleTokenFactory {
    // Здесь хранятся данные о том, какие модули уже были отсканированны.
    // На случай того, если один модуль является зависимостью у нескольких,
    // чтобы не было дубликатов.
    private readonly moduleIdsCashe = new WeakMap<Type<unknown>, string>()

    public create(metatype: Type<unknown>): string {
        const moduleId = this.getModuleId(metatype);
        const opaqueToken = {
            id: moduleId,
            module: this.getModuleName(metatype),
        };
        return hash(opaqueToken, { ignoreUnknown: true });
    }

    public getModuleId(metatype: Type<unknown>): string {
        let moduleId = this.moduleIdsCashe.get(metatype);
        if (moduleId) {
            return moduleId;
        }
        moduleId = uuid();
        this.moduleIdsCashe.set(metatype, moduleId);
        return moduleId;
    }

    public getModuleName(metatype: Type<any>): string {
        return metatype.name;
    }
}