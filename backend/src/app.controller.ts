import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get()
  getHello(): string {
    this.logger.info('Hello World');
    this.logger.info('Reservation created');
    this.logger.warn('Overbooking attempt');
    this.logger.error('Reservation failed');
    return this.appService.getHello();
  }
}
