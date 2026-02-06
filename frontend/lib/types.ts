// ---- Enums ----
export enum Role {
  ADMIN_ORG = "ADMIN_ORG",
  PARTICIPANT = "PARTICIPANT",
}

export enum EventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELED = "CANCELED",
}

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  REFUSED = "REFUSED",
  CANCELED = "CANCELED",
}

// ---- Models ----
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees: number;
  status: EventStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  limit?: number;
}

export interface Reservation {
  id: string;
  status: ReservationStatus;
  userId: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
}

// ---- API Response ----
export interface ApiMeta {
  path: string;
  timestamp: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    message: string | string[];
    statusCode: number;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---- Auth ----
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

// ---- Pagination ----
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
