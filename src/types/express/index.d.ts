import { QueryRunner } from 'typeorm';

declare module 'express-serve-static-core' {
  interface Request {
    queryRunner?: QueryRunner;
  }
}
