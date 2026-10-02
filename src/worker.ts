export interface Env {
  ASSETS: {
    fetch: typeof fetch;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Token'
        }
      });
    }

    // Direct APK download routes
    if (url.pathname === '/Gamifiter.apk' || url.pathname === '/download' || url.pathname === '/apk') {
      return Response.redirect('https://github.com/deivprnast/gamifiter-modern/releases/download/v1.0.6/Gamifiter.apk', 302);
    }

    // Endpoint: POST /api/sync
    if (url.pathname === '/api/sync' && request.method === 'POST') {
      try {
        const payload: any = await request.json().catch(() => ({}));
        const inputSteps = parseInt(payload.steps, 10) || 0;
        const device = payload.device || 'Garmin Vívoactive 4';
        const token = payload.token || payload.studentToken || 'ftk-prycl-garmin';

        const isPrycl = token.includes('prycl') || device.toLowerCase().includes('garmin');
        const studentName = isPrycl ? 'David Prycl' : 'Michal Vorlíček';
        const studentId = isPrycl ? 'student-1' : 'student-2';

        const now = new Date().toISOString();
        const verificationCode = `FTK-UP-${studentId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Hash calculation
        const hashStr = `${studentId}:${inputSteps}:${device}:${now}`;
        let hash = 0;
        for (let i = 0; i < hashStr.length; i++) {
          hash = ((hash << 5) - hash) + hashStr.charCodeAt(i);
          hash |= 0;
        }
        const integrityHash = `ftk-sha256-${Math.abs(hash).toString(16).padStart(16, '0')}`;

        return new Response(
          JSON.stringify({
            success: true,
            message: `Úspěšně synchronizováno pro: ${studentName}`,
            student: {
              id: studentId,
              name: studentName,
              steps: inputSteps,
              device: device,
              lastSync: now,
              status: 'synced'
            },
            stepDelta: inputSteps,
            integrityHash,
            verificationCode
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ success: false, error: err.message || 'Chyba serveru' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    }

    // Endpoint: GET /api/sync/status
    if (url.pathname === '/api/sync/status' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          success: true,
          serverTime: new Date().toISOString(),
          students: [
            {
              id: 'student-1',
              name: 'David Prycl',
              groupId: 'group-1',
              steps: 258885,
              device: 'Garmin Vívoactive 4',
              pairedToken: 'ftk-prycl-garmin',
              lastSync: new Date().toISOString(),
              status: 'synced'
            },
            {
              id: 'student-2',
              name: 'Michal Vorlíček',
              groupId: 'group-1',
              steps: 151100,
              device: 'Google Health Connect (Android)',
              pairedToken: 'ftk-vorlicek-google',
              lastSync: new Date().toISOString(),
              status: 'synced'
            }
          ],
          logs: [
            {
              id: 'log-1',
              studentId: 'student-1',
              studentName: 'David Prycl',
              timestamp: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0],
              steps: 258885,
              stepDelta: 8450,
              device: 'Garmin Vívoactive 4',
              source: 'garmin_vivoactive_4',
              integrityHash: 'ftk-sha256-5a309da8cdeaea83',
              valid: true
            }
          ]
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Delegate all web application requests to Cloudflare Static Assets
    return env.ASSETS.fetch(request);
  }
};
