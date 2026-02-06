import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../enums/eventStatus';
export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @IsEnum(EventStatus)
  @IsNotEmpty()
  status: EventStatus;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @IsNotEmpty()
  maxAttendees: number;
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  description?: string;

  @Type(() => Date)
  @IsOptional()
  @IsNotEmpty()
  startDate?: Date;

  @Type(() => Date)
  @IsOptional()
  @IsNotEmpty()
  endDate?: Date;

  @IsEnum(EventStatus)
  @IsOptional()
  @IsNotEmpty()
  status?: EventStatus;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  location?: string;

  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  maxAttendees?: number;
}
