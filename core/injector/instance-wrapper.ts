import { Type } from '../../common/interfaces/type.interface';

export class InstanceWrapper<T = any> {
    public readonly name: string;
    public metatype: Type<T> | Function;
    public instance: any;

    constructor(metadata: any) {
        Object.assign(this, metadata);
        this.instance = metadata.instance;
        this.metatype = metadata.metatype;
        this.name = metadata.name
    }
}