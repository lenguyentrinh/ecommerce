import { Module } from "@nestjs/common";
import { UsersModule } from "../users/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategies";

@Module({imports: [UsersModule, PassportModule, JwtModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})

export class AuthModule {}