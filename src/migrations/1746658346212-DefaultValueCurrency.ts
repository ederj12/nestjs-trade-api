import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultValueCurrency1746658346212 implements MigrationInterface {
  name = 'DefaultValueCurrency1746658346212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stocks" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stocks" ALTER COLUMN "currency" DROP DEFAULT`);
  }
}
