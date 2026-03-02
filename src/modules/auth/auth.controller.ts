import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import ForgotPasswordDto from "./dto/forgot-password.dto";
import { Sign } from "crypto";
import { SignupDto } from "./dto/signup.dto";
import VerifyEmailDto from "./dto/verify-email.dto";

@Controller('auth')
export class AuthController{
    constructor(private authService: AuthService){}

    @Post('login')
    login(@Body() loginDto: LoginDto){
        return this.authService.login(loginDto);
    }

    @Post('signup')
    signup(@Body() signupDto: SignupDto){
        return this.authService.signup(signupDto);
    }

    @Post('forgot-password')
    forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto){
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Post('verify-email')
    verifyEmail(@Body() verifyEmailDto: VerifyEmailDto){
        return this.authService.verifyEmail(verifyEmailDto);
    }
}