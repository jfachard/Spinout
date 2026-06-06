import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common'
import { SessionService } from './session.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

class CreateSessionDto {
  categories!: string[]
}

class JoinSessionDto {
  code!: string
  guestName?: string
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

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.session.findByCode(code)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  close(@Param('id') id: string, @Req() req: any) {
    return this.session.close(id, req.user.userId)
  }
}