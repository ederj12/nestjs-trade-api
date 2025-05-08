import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, concatMap, finalize } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Attach queryRunner to request for downstream use
    const req = context.switchToHttp().getRequest();
    req.queryRunner = queryRunner;

    return next.handle().pipe(
      concatMap(async data => {
        await queryRunner.commitTransaction();
        return data;
      }),
      catchError(async e => {
        await queryRunner.rollbackTransaction();
        throw e;
      }),
      finalize(async () => {
        await queryRunner.release();
      }),
    );
  }
}
