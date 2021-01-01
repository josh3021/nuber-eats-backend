import { Injectable } from '@nestjs/common';
@Injectable()
export class CommonService {
  getPaginationOffset(page: number, take: number): number {
    return (page - 1) * take;
  }

  getTotalPages(totalResult: number, take: number): number {
    return Math.ceil(totalResult / take);
  }
}
