import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphqlModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [GraphqlModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
