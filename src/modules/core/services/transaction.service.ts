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

import { VendorApiService } from '@/modules/shared/vendor/vendor-api.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly stockCacheService: StockCacheService,
    private readonly vendorApiService: VendorApiService,
  ) {}

  /**
   * Process a stock purchase transaction for a user.
   * Follows these steps:
   * 1. Validate user, portfolio, and stock.
   * 2. Create a transaction with status PENDING.
   * 3. Attempt to buy stock via vendor API.
   * 4. Update transaction with vendor response and final status.
   * 5. If successful, update portfolio holding.
   *
   * @param dto Stock purchase request DTO
   * @param queryRunner TypeORM QueryRunner for transaction
   * @returns StockPurchaseResponseDto
   * @throws NotFoundException, BadRequestException
   */
  async processStockPurchase(
    dto: StockPurchaseRequestDto,
    queryRunner: QueryRunner,
  ): Promise<StockPurchaseResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const portfolio = await this.portfolioRepository.findOne({ where: { userId: dto.userId } });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio for user ${dto.userId} not found`);
    }

    const cachedStock = this.stockCacheService.getStock(dto.symbol);
    if (!cachedStock) {
      throw new NotFoundException(`Stock with symbol ${dto.symbol} not found in cache`);
    }
    const currentPrice = Number(cachedStock.price);
    this.validatePrice(dto.price, currentPrice);

    const stockEntity = await queryRunner.manager.findOne(Stock, {
      where: { id: cachedStock.id },
    });
    if (!stockEntity) {
      throw new NotFoundException(`Stock entity for id ${cachedStock.id} not found in DB`);
    }

    // Create transaction with status PENDING
    const savedTransaction = await this.createPendingTransaction({
      user,
      stockEntity,
      portfolio,
      dto,
      queryRunner,
    });

    // Attempt to buy stock via vendor API and update transaction accordingly
    const { finalStatus, vendorResponse } = await this.handleVendorPurchase({
      symbol: dto.symbol,
      price: dto.price,
      quantity: dto.quantity,
    });
    savedTransaction.vendorResponse = vendorResponse;
    savedTransaction.status = finalStatus;
    await queryRunner.manager.save(Transaction, savedTransaction);

    if (finalStatus === TransactionStatus.FAILED) {
      throw new BadRequestException(
        `Vendor API buyStock failed: ${vendorResponse?.error || 'Unknown error'}`,
      );
    }

    // Update or create portfolio holding if vendor succeeded
    await this.updatePortfolioHolding({
      portfolio,
      stockEntity,
      dto,
      queryRunner,
      cachedStock,
    });

    return {
      transactionId: savedTransaction.id,
      status: savedTransaction.status,
      message: 'Transaction completed successfully',
      createdAt: savedTransaction.timestamp.toISOString(),
    };
  }

  /**
   * Validate that the purchase price is within 2% of the current price.
   * @param price User-provided price
   * @param currentPrice Current stock price
   * @throws BadRequestException if price is out of bounds
   */
  private validatePrice(price: number, currentPrice: number): void {
    const lowerBound = currentPrice * 0.98;
    const upperBound = currentPrice * 1.02;
    if (price < lowerBound || price > upperBound) {
      throw new BadRequestException(
        `Price ${price} is not within 2% of current price ${currentPrice}`,
      );
    }
  }

  /**
   * Create a transaction with status PENDING and save it.
   */
  private async createPendingTransaction({
    user,
    stockEntity,
    portfolio,
    dto,
    queryRunner,
  }: {
    user: any;
    stockEntity: any;
    portfolio: any;
    dto: StockPurchaseRequestDto;
    queryRunner: QueryRunner;
  }) {
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
      status: TransactionStatus.PENDING,
      timestamp: new Date(),
    });
    return queryRunner.manager.save(Transaction, transaction);
  }

  /**
   * Attempt to buy stock via vendor API. Returns status and response.
   */
  private async handleVendorPurchase({
    symbol,
    price,
    quantity,
  }: {
    symbol: string;
    price: number;
    quantity: number;
  }): Promise<{ finalStatus: TransactionStatus; vendorResponse: any }> {
    let vendorResponse: any = null;
    let finalStatus: TransactionStatus = TransactionStatus.COMPLETED;
    try {
      vendorResponse = await this.vendorApiService.buyStock(symbol, price, quantity);
    } catch (error) {
      finalStatus = TransactionStatus.FAILED;
      vendorResponse = { error: error?.message || error };
    }
    return { finalStatus, vendorResponse };
  }

  /**
   * Update or create a portfolio holding after a successful purchase.
   */
  private async updatePortfolioHolding({
    portfolio,
    stockEntity,
    dto,
    queryRunner,
    cachedStock,
  }: {
    portfolio: any;
    stockEntity: any;
    dto: StockPurchaseRequestDto;
    queryRunner: QueryRunner;
    cachedStock: any;
  }): Promise<void> {
    let holding = await queryRunner.manager.findOne(PortfolioHolding, {
      where: { portfolio: { id: portfolio.id }, stock: { id: cachedStock.id } },
      relations: ['portfolio', 'stock'],
    });
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
  }
}
