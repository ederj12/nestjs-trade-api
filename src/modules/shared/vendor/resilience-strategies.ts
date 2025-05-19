import { CircuitBreakerStrategy, RetryStrategy, TimeoutStrategy } from 'nestjs-resilience';

export const vendorApiResilience = [
  new CircuitBreakerStrategy({
    requestVolumeThreshold: 20,
    sleepWindowInMilliseconds: 5000,
    errorThresholdPercentage: 50,
    rollingWindowInMilliseconds: 20000,
  }),
  new RetryStrategy({ maxRetries: 3 }),
  new TimeoutStrategy(20000),
];
