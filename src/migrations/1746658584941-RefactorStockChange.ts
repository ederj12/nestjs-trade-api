import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorStockChange1746658584941 implements MigrationInterface {
  name = 'RefactorStockChange1746658584941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stocks" DROP COLUMN "change"`);
    await queryRunner.query(`ALTER TABLE "stocks" ADD "change" numeric(5,2) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stocks" DROP COLUMN "change"`);
    await queryRunner.query(`ALTER TABLE "stocks" ADD "change" integer NOT NULL`);
  }
}
