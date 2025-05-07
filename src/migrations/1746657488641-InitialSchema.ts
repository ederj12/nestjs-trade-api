import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1746657488641 implements MigrationInterface {
  name = 'InitialSchema1746657488641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "portfolio_holdings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "quantity" integer NOT NULL, "averagePurchasePrice" numeric(12,2) NOT NULL, "portfolioId" uuid, "stockId" uuid, CONSTRAINT "UQ_39dcca5c0912814fe1e3334a489" UNIQUE ("portfolioId", "stockId"), CONSTRAINT "PK_791e8293470395842404d51142f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "portfolios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_488aa6e9b219d1d9087126871ae" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_portfolio_userId" ON "portfolios" ("userId") `);
    await queryRunner.query(
      `CREATE TABLE "stocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "symbol" character varying NOT NULL, "name" character varying NOT NULL, "price" numeric(12,2) NOT NULL, "lastUpdated" TIMESTAMP, "sector" character varying NOT NULL, "currency" character varying NOT NULL, "change" integer NOT NULL, CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_stock_symbol" ON "stocks" ("symbol") `);
    await queryRunner.query(`CREATE INDEX "IDX_stock_last_updated" ON "stocks" ("lastUpdated") `);
    await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('BUY', 'SELL')`);
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "stockId" uuid NOT NULL, "portfolioId" uuid NOT NULL, "quantity" integer NOT NULL, "price" numeric(12,2) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING', "timestamp" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_timestamp" ON "transactions" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_user_stock" ON "transactions" ("userId", "stockId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "email" character varying NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "users" ("email") `);
    await queryRunner.query(
      `ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "FK_65b5e59d80a8a0fd9044c1ea32c" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "FK_ef845caeda183f7c4edecbc770a" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolios" ADD CONSTRAINT "FK_e4e66691a2634fcf5525e33ecf5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_7ce6f81f171c60505102b985e85" FOREIGN KEY ("stockId") REFERENCES "stocks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_3682c52dea5cc662b3d9b00a74b" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_3682c52dea5cc662b3d9b00a74b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_7ce6f81f171c60505102b985e85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolios" DROP CONSTRAINT "FK_e4e66691a2634fcf5525e33ecf5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "FK_ef845caeda183f7c4edecbc770a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "FK_65b5e59d80a8a0fd9044c1ea32c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transaction_user_stock"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transaction_timestamp"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_last_updated"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_stock_symbol"`);
    await queryRunner.query(`DROP TABLE "stocks"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_portfolio_userId"`);
    await queryRunner.query(`DROP TABLE "portfolios"`);
    await queryRunner.query(`DROP TABLE "portfolio_holdings"`);
  }
}
