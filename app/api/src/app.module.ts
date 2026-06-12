import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { ActivityModule } from './activity/activity.module';
import { ThrottlerModule } from '@nestjs/throttler'


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    SessionModule,
    ActivityModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 30,
    }]),
  ],
})
export class AppModule {}