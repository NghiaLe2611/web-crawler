import { HttpStatus } from "@nestjs/common";

export interface ScrapeResponse {
    data: any[];
    statusCode: HttpStatus;
    message?: string;
}