import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../users/user.service";
import { SignupDto } from "./dto/signup.dto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { randomUUID, VerifyPublicKeyInput } from "crypto";
import ForgotPasswordDto from "./dto/forgot-password.dto";
import { QueryFailedError } from "typeorm";
import VerifyEmailDto from "./dto/verify-email.dto";

@Injectable()
export class AuthService{
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ){}

    async signup(dto: SignupDto){
        try {
            const password = await bcrypt.hash(dto.password, 10);
            const user = await this.userService.create({...dto, password});
            const code = this.generateOTP();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

            await this.userService.setEmailOTP(user.id, code, expiresAt);
            this.sendEmailOtp(user.email, code, expiresAt);
            return { message: "Signup successful, OTP sent to your email." };
        } catch (error) {
            // Check if it's a unique constraint violation (duplicate email)
            if (error instanceof QueryFailedError) {
                const msg = (error as any).message || "";
                if (
                  msg.includes("duplicate") ||
                  msg.includes("unique") ||
                  (error as any).code === "23505" ||
                  (error as any).code === "ER_DUP_ENTRY"
                ) {
                  throw new ConflictException("Email already exists");
                }
            }
            throw error;
        }
    }

    async login(dto: LoginDto){
        const user = await this.userService.findByEmail(dto.email);
        if(!user) throw new UnauthorizedException('Invalid credentials');

        if(!user.emailVerified) throw new UnauthorizedException('Email not verified');

        const match = await bcrypt.compare(dto.password, user.password);
        if(!match) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, email: user.email };
        const token = this.jwtService.sign(payload);
        return { token };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto){
        const user = await this.userService.findByEmail(forgotPasswordDto.email);
        if(!user) throw new UnauthorizedException('Invalid email');

        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 3600 * 1000); 
        
        await this.userService.updateResetToken(user.id, token, expiresAt);
    }

    private generateOTP(): string{
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private sendEmailOtp(email:string, code:string, expiresAt:Date){
        const message = `Your email verification code is ${code}. It will expire in 5 minutes.`;
    }

    async verifyEmail(verifyEmailDto: VerifyEmailDto){
        const user = await this.userService.verifyEmailOtp(verifyEmailDto.email, verifyEmailDto.code);
        if(!user) throw new UnauthorizedException('Invalid OTP');
        return { message: "Email verified successfully" };
    }
}