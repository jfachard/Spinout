import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Handle CORS and OPTIONS at the raw Express level — runs before any
  // NestJS routing, guards, or throttling so preflight is never blocked.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }
    next()
  })

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.listen(process.env.PORT || 3001)
}
bootstrap()