import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { GamesModule } from './games/games.module';
import { IgdbModule } from './igdb/igdb.module';

@Module({
  imports: [DatabaseModule, GamesModule, IgdbModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
