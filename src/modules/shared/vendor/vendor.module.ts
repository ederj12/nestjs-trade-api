import { Module } from '@nestjs/common';
import { VendorApiService } from './vendor-api.service';

@Module({
  providers: [VendorApiService],
  exports: [VendorApiService],
})
export class VendorModule {}
