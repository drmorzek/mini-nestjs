import { Controller, Get, Post, Body, Param } from '../common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('body/:id')
  recieveBody(@Body() data: any, @Param('id') id: string) {
    console.log('body: ', data.data);
    return `body: ${data.data} has been recieved and id: ${id}`;
  }
}