import { Injectable, Logger } from '@nestjs/common'
import { Expo, type ExpoPushMessage } from 'expo-server-sdk'

@Injectable()
export class PushService {
  private readonly expo = new Expo()
  private readonly logger = new Logger(PushService.name)

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    const valid = [...new Set(tokens)].filter((token) => Expo.isExpoPushToken(token))
    if (!valid.length) return

    const messages: ExpoPushMessage[] = valid.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    }))

    for (const chunk of this.expo.chunkPushNotifications(messages)) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk)
        for (const receipt of receipts) {
          if (receipt.status === 'error') {
            this.logger.warn(`Push failed: ${receipt.message}`)
          }
        }
      } catch (err) {
        this.logger.warn(
          `Push chunk failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        )
      }
    }
  }
}
