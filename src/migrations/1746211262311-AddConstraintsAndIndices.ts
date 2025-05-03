import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConstraintsAndIndices1746211262311 implements MigrationInterface {
    name = 'AddConstraintsAndIndices1746211262311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_stock_symbol" ON "stocks" ("symbol") `);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_timestamp" ON "transactions" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_user_stock" ON "transactions" ("userId", "stockId") `);
        await queryRunner.query(`CREATE INDEX "IDX_portfolio_userId" ON "portfolios" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "CHK_holding_avg_price_positive" CHECK (averagePurchasePrice > 0)`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "CHK_holding_quantity_positive" CHECK (quantity > 0)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transaction_price_positive" CHECK (price > 0)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transaction_quantity_positive" CHECK (quantity > 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transaction_quantity_positive"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transaction_price_positive"`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "CHK_holding_quantity_positive"`);
        await queryRunner.query(`ALTER TABLE "portfolio_holdings" DROP CONSTRAINT "CHK_holding_avg_price_positive"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_portfolio_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_user_stock"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_timestamp"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_stock_symbol"`);
    }

}
