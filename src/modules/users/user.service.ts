import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { SignupDto } from "../auth/dto/signup.dto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) { }

    create(dto: SignupDto): Promise<User> {
        const user = this.userRepository.create(dto);
        return this.userRepository.save(user);
    }

    findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    updateResetToken(id: number, token: string, expired: Date) {
        return this.userRepository.update(id, {
            resetPasswordToken: token,
            resetPasswordExpired: expired,
        });
    }

    async setEmailOTP(id: number, otp: string, expires: Date) {
        return this.userRepository.update(id, {
            emailOtpCode: otp,
            emailOtpExpires: expires,
        })
    }

    async verifyEmailOtp(email: string, otp: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) return null;
        if (!user.emailOtpCode || !user.emailOtpExpires) return null;
        if(user.emailOtpExpires < new Date()) return null;
        if(user.emailOtpCode !== otp) return null;
        user.emailVerified = true;
        return this.userRepository.save(user);
    }
}