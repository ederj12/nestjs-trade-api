import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QueryRunner } from 'typeorm';

import { StockPurchaseRequestDto } from '../dto/stock-purchase-request.dto';
import { StockPurchaseResponseDto } from '../dto/stock-purchase-response.dto';
import { PortfolioHolding } from '../entities/portfolio-holding.entity';
import { Stock } from '../entities/stock.entity';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { UserRepository } from '../repositories/user.repository';

import { StockCacheService } from './stock-cache.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly stockCacheService: StockCacheService,
  ) {}

  async processStockPurchase(
    dto: StockPurchaseRequestDto,
    queryRunner: QueryRunner,
  ): Promise<StockPurchaseResponseDto> {
    // Step 1: Validate user
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    // Step 1: Validate portfolio
    const portfolio = await this.portfolioRepository.findOne({ where: { userId: dto.userId } });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio for user ${dto.userId} not found`);
    }

    // Step 2: Fetch stock from cache
    const cachedStock = this.stockCacheService.getStock(dto.symbol);
    if (!cachedStock) {
      throw new NotFoundException(`Stock with symbol ${dto.symbol} not found in cache`);
    }
    const currentPrice = Number(cachedStock.price);

    // Step 3: Price validation
    const lowerBound = currentPrice * 0.98;
    const upperBound = currentPrice * 1.02;
    console.log(dto.price, lowerBound, upperBound);
    if (dto.price < lowerBound || dto.price > upperBound) {
      throw new BadRequestException(
        `Price ${dto.price} is not within 2% of current price ${currentPrice}`,
      );
    }

    // Step 4: Use queryRunner.manager for all DB operations (portfolio update, transaction save)
    // 1. Find or create holding
    let holding = await queryRunner.manager.findOne(PortfolioHolding, {
      where: { portfolio: { id: portfolio.id }, stock: { id: cachedStock.id } },
      relations: ['portfolio', 'stock'],
    });

    // Fetch the Stock entity for relation
    const stockEntity = await queryRunner.manager.findOne(Stock, {
      where: { id: cachedStock.id },
    });
    if (!stockEntity) {
      throw new NotFoundException(`Stock entity for id ${cachedStock.id} not found in DB`);
    }

    if (holding) {
      // Update quantity and average purchase price
      const totalCost = holding.quantity * holding.averagePurchasePrice + dto.quantity * dto.price;
      const newQuantity = holding.quantity + dto.quantity;
      holding.averagePurchasePrice = totalCost / newQuantity;
      holding.quantity = newQuantity;
    } else {
      // Create new holding
      holding = queryRunner.manager.create(PortfolioHolding, {
        portfolio,
        stock: stockEntity,
        quantity: dto.quantity,
        averagePurchasePrice: dto.price,
      });
    }
    await queryRunner.manager.save(PortfolioHolding, holding);

    // 2. Create and save transaction
    const transaction = queryRunner.manager.create(Transaction, {
      user: user,
      userId: user.id,
      stock: stockEntity,
      stockId: stockEntity.id,
      portfolio: portfolio,
      portfolioId: portfolio.id,
      quantity: dto.quantity,
      price: dto.price,
      type: TransactionType.BUY,
      status: TransactionStatus.COMPLETED,
      timestamp: new Date(),
    });
    const savedTransaction = await queryRunner.manager.save(Transaction, transaction);

    return {
      transactionId: savedTransaction.id,
      status: savedTransaction.status,
      message: 'Transaction completed successfully',
      createdAt: savedTransaction.timestamp.toISOString(),
    };
  }
}
