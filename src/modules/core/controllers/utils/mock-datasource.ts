import { QueryRunner } from 'typeorm';

export class MockQueryRunner {
  isTransactionActive = false;
  connect = jest.fn();
  startTransaction = jest.fn(() => {
    this.isTransactionActive = true;
  });
  commitTransaction = jest.fn(() => {
    this.isTransactionActive = false;
  });
  rollbackTransaction = jest.fn(() => {
    this.isTransactionActive = false;
  });
  release = jest.fn();
  manager = {
    // Add any methods you use in your service, e.g.:
    save: jest.fn(),
    findOne: jest.fn(),
    // ...etc
  };
}

export class MockDataSource {
  public queryRunner: MockQueryRunner = new MockQueryRunner();
  createQueryRunner(): QueryRunner {
    return this.queryRunner as unknown as QueryRunner;
  }
}
