import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common'
import { IsArray, IsOptional, IsString, IsNotEmpty } from 'class-validator'
import { SessionService } from './session.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

class CreateSessionDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories: string[] = []
}

class JoinSessionDto {
  @IsString()
  @IsNotEmpty()
  code!: string

  @IsString()
  @IsOptional()
  guestName?: string
}

class MemberPushTokenDto {
  @IsString()
  @IsNotEmpty()
  memberId!: string

  @IsString()
  @IsNotEmpty()
  code!: string

  @IsString()
  @IsNotEmpty()
  token!: string
}

@Controller('session')
export class SessionController {
  constructor(private session: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSessionDto, @Req() req: any) {
    return this.session.create(req.user.userId, dto.categories)
  }

  @Post('join')
  join(@Body() dto: JoinSessionDto, @Req() req: any) {
    const userId = req.user?.userId ?? undefined
    return this.session.join(dto.code, userId, dto.guestName)
  }

  @Post('members/push-token')
  registerMemberPushToken(@Body() dto: MemberPushTokenDto) {
    return this.session.setMemberPushToken(dto.memberId, dto.code, dto.token)
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.session.findByCode(code)
  }

  @Get(':code/history')
  history(@Param('code') code: string) {
    return this.session.getHistoryByCode(code)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  close(@Param('id') id: string, @Req() req: any) {
    return this.session.close(id, req.user.userId)
  }
}