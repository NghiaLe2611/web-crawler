import { HttpStatus } from "@nestjs/common";

export interface ScrapeResponse {
    data: any[];
    status: HttpStatus;
    message?: string;
}