import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

export interface HealthStepReading {
  steps: number;
  date: string;
  source: string;
  isNative: boolean;
}

export class NativeHealthService {
  /**
   * Check if running inside native mobile container (Capacitor iOS or Android)
   */
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get device platform name
   */
  static getPlatform(): 'ios' | 'android' | 'web' {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'web';
  }

  /**
   * Request health reading permissions (Apple HealthKit / Android Health Connect)
   */
  static async requestHealthPermissions(): Promise<boolean> {
    if (!this.isNative()) {
      console.log('[HealthService] Running in Web environment, health permissions simulated.');
      return true;
    }

    try {
      console.log(`[HealthService] Requesting native health permissions for platform: ${this.getPlatform()}`);
      await Health.requestAuthorization({
        read: ['steps']
      });
      return true;
    } catch (e) {
      console.warn('[HealthService] Permission request failed or dismissed:', e);
      return false;
    }
  }

  /**
   * Read actual live steps for today from native sensors / Health Connect (Garmin)
   */
  static async getTodaySteps(): Promise<HealthStepReading> {
    const todayStr = new Date().toISOString().split('T')[0];
    const isNative = this.isNative();
    const platform = this.getPlatform();

    if (isNative) {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const result = await Health.queryAggregated({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: new Date().toISOString(),
          bucket: 'day',
          aggregation: 'sum'
        });

        console.log('[HealthService] Real sensor reading from Health Connect:', result);
        let stepsValue = 0;
        if (result?.samples && result.samples.length > 0) {
          stepsValue = Math.round(result.samples.reduce((acc, s) => acc + (s.value || 0), 0));
        }

        if (stepsValue > 0) {
          return {
            steps: stepsValue,
            date: todayStr,
            source: platform === 'android' ? 'Garmin Vívoactive 4 (Google Health Connect)' : 'Apple HealthKit',
            isNative: true
          };
        }
      } catch (e) {
        console.error('[HealthService] Error querying real health records:', e);
      }
    }

    // Default reading if not in native or no steps yet
    return {
      steps: 0,
      date: todayStr,
      source: isNative ? 'Health Connect (Zatím 0 kroků nebo nepotvrzeno oprávnění)' : 'web_portal_sync',
      isNative
    };
  }

  /**
   * Get server host for native mobile environment vs browser
   */
  static getServerUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const storedHost = localStorage.getItem('gamifiter_server_host') || 'gamifiter-modern.dprycl.workers.dev';
    const protocol = storedHost.includes('workers.dev') || storedHost.includes('pages.dev') || storedHost.includes('https://') ? 'https://' : 'http://';
    const cleanHost = storedHost.replace(/^https?:\/\//, '');
    return `${protocol}${cleanHost}${cleanEndpoint}`;
  }

  /**
   * Send step telemetry to Gamifiter Cloud backend
   */
  static async syncStepsToServer(params: {
    token: string;
    steps: number;
    device: string;
    isDelta?: boolean;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const syncUrl = this.getServerUrl('/api/sync');
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Token': params.token
      },
      body: JSON.stringify({
        token: params.token,
        steps: params.steps,
        isDelta: params.isDelta ?? true,
        device: params.device,
        source: this.isNative() 
          ? (this.getPlatform() === 'android' ? 'native_health_connect' : 'native_apple_health')
          : 'mobile_portal',
        date: new Date().toISOString().split('T')[0],
        metadata: {
          isNative: this.isNative(),
          platform: this.getPlatform(),
          ...params.metadata
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Chyba synchronizace');
    }

    return await response.json();
  }
}
