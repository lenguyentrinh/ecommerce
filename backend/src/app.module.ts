import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import jwtConfig from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DatabaseModule } from './database/database.config';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ProductsModule,
    CartModule,
    InventoryModule,
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
