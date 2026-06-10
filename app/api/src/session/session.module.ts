import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { SessionController } from './session.controller'
import { SessionGateway } from './session.gateway'
import { ActivityModule } from '../activity/activity.module'

@Module({
  imports: [ActivityModule],
  providers: [SessionService, SessionGateway],
  controllers: [SessionController],
})
export class SessionModule {}