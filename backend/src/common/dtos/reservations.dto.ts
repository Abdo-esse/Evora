import { IsString, IsNotEmpty } from 'class-validator';
import { ReservationStatus } from '../enums/reservationStatus';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;
}

export class UpdateReservationDto {
  @IsString()
  @IsNotEmpty()
  status: ReservationStatus;
}
