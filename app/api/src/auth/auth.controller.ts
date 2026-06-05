import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @UseGuards(ThrottlerGuard)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.auth.findUserByEmail(dto.email, dto.password)
    return this.auth.login(user)
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    const payload = await this.auth.verifyRefreshToken(token)
    const user = await this.auth.findUserById(payload.userId)
    if (!user) throw new UnauthorizedException('User not found')
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Refresh token has been revoked')
    }
    return this.auth.login(user)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.auth.logout(req.user.userId)
  }
}