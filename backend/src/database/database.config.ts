import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const user = config.get<string>('DB_USERNAME');

        return {
          type: 'mysql',
          host: config.get('DB_HOST', 'localhost'),
          port: config.get<number>('DB_PORT', 3306),
          username: user || 'root',
          password: config.get<string>('DB_PASSWORD') ?? '',
          database: config.get('DB_NAME', 'ecommerce'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
