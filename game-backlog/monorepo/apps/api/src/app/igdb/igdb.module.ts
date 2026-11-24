import { Module } from '@nestjs/common';
import { IgdbClient } from './igdb.client';
import { IgdbController } from './igdb.controller';
import { IgdbService } from './igdb.service';

@Module({
  controllers: [IgdbController],
  providers: [IgdbClient, IgdbService],
})
export class IgdbModule {}
