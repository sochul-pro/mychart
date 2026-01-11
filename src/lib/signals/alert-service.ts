import type { Signal } from './types';
import { db } from '@/lib/db';

interface StockInfo {
  symbol: string;
  name: string;
}

interface AlertMessage {
  text: string;
  html: string;
}

/**
 * 알림 서비스
 * 신호 발생 시 알림 생성 및 발송 처리
 */
export class AlertService {
  /**
   * 신호 발생 시 알림 생성 및 발송
   */
  async processSignal(
    signal: Signal,
    stockInfo: StockInfo,
    strategyName: string,
    userId: string
  ): Promise<void> {
    // 사용자의 활성화된 알림 설정 조회
    const alerts = await db.signalAlert.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { symbols: { isEmpty: true } }, // 전체 종목
          { symbols: { has: stockInfo.symbol } },
        ],
      },
      include: { preset: true },
    });

    for (const alert of alerts) {
      // 가격 조건 확인
      if (alert.minPrice && signal.price < alert.minPrice) continue;
      if (alert.maxPrice && signal.price > alert.maxPrice) continue;

      const message = this.createMessage(signal, stockInfo, strategyName);

      // 인앱 알림 저장
      await db.alertNotification.create({
        data: {
          alertId: alert.id,
          userId,
          symbol: stockInfo.symbol,
          signalType: signal.type,
          price: signal.price,
          message: message.text,
          channel: 'in_app',
          sentAt: new Date(),
        },
      });

      // 이메일 알림 (비동기)
      if (alert.emailEnabled) {
        this.sendEmailAlert(userId, message).catch((err) =>
          console.error('Failed to send email alert:', err)
        );
      }

      // 푸시 알림 (비동기, 향후 구현)
      if (alert.pushEnabled) {
        this.sendPushAlert(userId, message).catch((err) =>
          console.error('Failed to send push alert:', err)
        );
      }
    }
  }

  /**
   * 알림 메시지 생성
   */
  private createMessage(
    signal: Signal,
    stockInfo: StockInfo,
    strategyName: string
  ): AlertMessage {
    const typeText = signal.type === 'buy' ? '매수' : '매도';
    const arrow = signal.type === 'buy' ? '▲' : '▼';

    return {
      text: `[${typeText}] ${stockInfo.name}(${stockInfo.symbol}) ${arrow} ${signal.price.toLocaleString()}원 - ${strategyName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: ${signal.type === 'buy' ? '#26a69a' : '#ef5350'};">
            ${arrow} ${typeText} 신호
          </h2>
          <p><strong>${stockInfo.name}</strong> (${stockInfo.symbol})</p>
          <p>가격: ${signal.price.toLocaleString()}원</p>
          <p>전략: ${strategyName}</p>
          <p>사유: ${signal.reason}</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            이 알림은 MyChart에서 발송되었습니다.
          </p>
        </div>
      `,
    };
  }

  /**
   * 이메일 알림 발송
   * TODO: nodemailer 또는 이메일 서비스 연동
   */
  private async sendEmailAlert(userId: string, message: AlertMessage): Promise<void> {
    // 이메일 발송 로직 구현 예정
    console.log(`Email alert for user ${userId}:`, message.text);
  }

  /**
   * 푸시 알림 발송
   * TODO: 웹 푸시 알림 연동
   */
  private async sendPushAlert(userId: string, message: AlertMessage): Promise<void> {
    // 푸시 알림 로직 구현 예정
    console.log(`Push alert for user ${userId}:`, message.text);
  }
}

// 싱글톤 인스턴스
export const alertService = new AlertService();
