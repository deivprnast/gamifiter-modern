import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';

export interface HealthStepReading {
  steps: number;
  date: string;
  source: string;
  isNative: boolean;
  garminSteps?: number;
  phoneSteps?: number;
}

export interface DaySegmentBreakdown {
  morningCommute: number; // 06:00 - 08:00 (Cesta do školy)
  schoolHours: number;    // 08:00 - 14:00 (Ve škole & TV)
  afterSchool: number;    // 14:00 - 19:00 (Po škole & kroužky)
  evening: number;        // 19:00 - 24:00 (Večer doma)
  total: number;
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
   * Specifically separates Garmin watch records from phone accelerometer records.
   */
  static async getTodaySteps(): Promise<HealthStepReading> {
    const todayStr = new Date().toISOString().split('T')[0];
    const isNative = this.isNative();
    const platform = this.getPlatform();

    if (isNative) {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let garminSteps = 0;
        let watchSteps = 0;
        let totalRawSteps = 0;
        let hasGarmin = false;
        let hasWatch = false;

        // Try reading granular records to isolate Garmin Vívoactive 4 from phone's internal pocket tracker
        try {
          const sampleResult = await Health.readSamples({
            dataType: 'steps',
            startDate: startOfDay.toISOString(),
            endDate: new Date().toISOString(),
            limit: 2000
          });

          if (sampleResult?.samples && sampleResult.samples.length > 0) {
            for (const sample of sampleResult.samples) {
              const val = Math.round(sample.value || 0);
              totalRawSteps += val;

              const srcId = (sample.sourceId || '').toLowerCase();
              const srcName = (sample.sourceName || '').toLowerCase();
              const devType = (sample.deviceType || '').toLowerCase();

              const isGarmin = srcId.includes('garmin') || srcName.includes('garmin');
              const isWatch = isGarmin || devType === 'watch' || devType === 'fitnessband';

              if (isGarmin) {
                garminSteps += val;
                hasGarmin = true;
              }
              if (isWatch) {
                watchSteps += val;
                hasWatch = true;
              }
            }
          }
        } catch (sampleErr) {
          console.warn('[HealthService] readSamples failed, falling back to queryAggregated:', sampleErr);
        }

        // 1. If explicit Garmin records exist, return exact watch count!
        if (hasGarmin && garminSteps > 0) {
          console.log(`[HealthService] Isolated Garmin watch steps: ${garminSteps} (total with phone: ${totalRawSteps})`);
          return {
            steps: garminSteps,
            date: todayStr,
            source: `Garmin Vívoactive 4 (${garminSteps.toLocaleString()} kroků z hodinek)`,
            isNative: true,
            garminSteps,
            phoneSteps: Math.max(0, totalRawSteps - garminSteps)
          };
        }

        // 2. If watch records exist
        if (hasWatch && watchSteps > 0) {
          return {
            steps: watchSteps,
            date: todayStr,
            source: `Chytré hodinky (${watchSteps.toLocaleString()} kroků z hodinek)`,
            isNative: true,
            garminSteps: watchSteps,
            phoneSteps: Math.max(0, totalRawSteps - watchSteps)
          };
        }

        // 3. Fallback to queryAggregated if no granular source separation available
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
   * Break down steps into key educational and circadian day segments:
   * 1. 06:00 - 08:00 (Cesta do školy / Ranní mobilita)
   * 2. 08:00 - 14:00 (Dopoledne ve škole - sezení, přestávky, TV)
   * 3. 14:00 - 19:00 (Odpoledne po škole & kroužky)
   * 4. 19:00 - 24:00 (Večer doma)
   */
  static async getSegmentedStepBreakdown(totalStepsInput?: number): Promise<DaySegmentBreakdown> {
    const isNative = this.isNative();

    if (isNative) {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const sampleResult = await Health.readSamples({
          dataType: 'steps',
          startDate: startOfDay.toISOString(),
          endDate: new Date().toISOString(),
          limit: 3000
        });

        if (sampleResult?.samples && sampleResult.samples.length > 0) {
          let morningCommute = 0;
          let schoolHours = 0;
          let afterSchool = 0;
          let evening = 0;

          for (const sample of sampleResult.samples) {
            const val = Math.round(sample.value || 0);
            const sDate = new Date(sample.startDate);
            const hour = sDate.getHours();

            if (hour >= 6 && hour < 8) {
              morningCommute += val;
            } else if (hour >= 8 && hour < 14) {
              schoolHours += val;
            } else if (hour >= 14 && hour < 19) {
              afterSchool += val;
            } else if (hour >= 19 || hour < 6) {
              evening += val;
            }
          }

          const sum = morningCommute + schoolHours + afterSchool + evening;
          if (sum > 0) {
            return {
              morningCommute,
              schoolHours,
              afterSchool,
              evening,
              total: sum
            };
          }
        }
      } catch (e) {
        console.warn('[HealthService] getSegmentedStepBreakdown native sample read error:', e);
      }
    }

    // Baseline calculation based on FTK UP adolescent circadian distribution model
    const total = totalStepsInput || 6464;
    const morningCommute = Math.round(total * 0.28); // ~28% (např. 1 810)
    const schoolHours = Math.round(total * 0.34);    // ~34% (např. 2 198)
    const afterSchool = Math.round(total * 0.29);    // ~29% (např. 1 874)
    const evening = Math.max(0, total - (morningCommute + schoolHours + afterSchool)); // remainder ~9% (582)

    return {
      morningCommute,
      schoolHours,
      afterSchool,
      evening,
      total
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
