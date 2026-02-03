import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReservationsModule } from './reservations/reservations.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [LoggerModule, AuthModule, UsersModule, ReservationsModule, EventsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
