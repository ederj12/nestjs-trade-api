import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionRepository } from './repositories/transaction.repository';
import { VendorModule } from '@modules/shared/vendor/vendor.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction]), VendorModule],
  controllers: [],
  providers: [TransactionRepository],
  exports: [TransactionRepository],
})
export class TransactionsModule {}
