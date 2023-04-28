import { Injectable } from '../common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}