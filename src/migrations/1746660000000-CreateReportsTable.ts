import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportsTable1746660000000 implements MigrationInterface {
  name = 'CreateReportsTable1746660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "reportDate" DATE NOT NULL,
        "generatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "reportType" VARCHAR(64) NOT NULL,
        "status" VARCHAR(32) NOT NULL,
        "totalTransactions" INTEGER NOT NULL,
        "successfulTransactions" INTEGER NOT NULL,
        "failedTransactions" INTEGER NOT NULL,
        "reportData" JSONB NOT NULL,
        "emailDeliveryStatus" VARCHAR(32) NOT NULL,
        CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_report_reportDate" ON "reports" ("reportDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_report_status" ON "reports" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_report_status"`);
    await queryRunner.query(`DROP INDEX "IDX_report_reportDate"`);
    await queryRunner.query(`DROP TABLE "reports"`);
  }
}
