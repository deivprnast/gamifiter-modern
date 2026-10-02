import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface SyncStudent {
  id: string;
  name: string;
  groupId: string;
  steps: number;
  device: string;
  pairedToken: string;
  lastSync: string | null;
  status: 'online' | 'waiting' | 'synced';
}

export interface SyncLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: string;
  date: string;
  steps: number;
  stepDelta: number;
  device: string;
  source: string;
  integrityHash: string;
  valid: boolean;
  metadata?: Record<string, any>;
}

export interface SyncDatabase {
  students: SyncStudent[];
  logs: SyncLogEntry[];
}

const DEFAULT_DB: SyncDatabase = {
  students: [
    {
      id: 'student-1',
      name: 'David Prycl',
      groupId: 'group-1',
      steps: 180000,
      device: 'Garmin Vívoactive 4',
      pairedToken: 'ftk-prycl-garmin',
      lastSync: new Date().toISOString(),
      status: 'online'
    }
  ],
  logs: [
    {
      id: 'log-init-1',
      studentId: 'student-1',
      studentName: 'David Prycl',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      steps: 180000,
      stepDelta: 8450,
      device: 'Garmin Vívoactive 4',
      source: 'garmin_health_sync',
      integrityHash: 'ftk-sha256-d41d8cd98f00b204e9800998ecf8427e',
      valid: true,
      metadata: { activity: 'běh + chůze', battery: '82%' }
    }
  ]
};

export function syncApiPlugin(): Plugin {
  const dbPath = path.resolve(process.cwd(), 'data/sync_db.json');

  // Load or initialize DB
  function loadDb(): SyncDatabase {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('[SyncAPI] Failed to read database, initializing default:', e);
    }
    saveDb(DEFAULT_DB);
    return DEFAULT_DB;
  }

  function saveDb(data: SyncDatabase) {
    try {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[SyncAPI] Failed to save database:', e);
    }
  }

  // Active SSE clients list
  const sseClients: Set<(data: string) => void> = new Set();

  function broadcastEvent(eventType: string, payload: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
    sseClients.forEach((send) => {
      try {
        send(message);
      } catch (err) {
        console.error('[SyncAPI] SSE send failed:', err);
      }
    });
  }

  return {
    name: 'gamifiter-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // CORS headers for local device network calls
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Token');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        // Endpoint: SSE Stream for real-time live events
        if (url === '/api/sync/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
          });
          res.write('\n');

          const send = (msg: string) => res.write(msg);
          sseClients.add(send);

          // Initial ping
          res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: sseClients.size })}\n\n`);

          req.on('close', () => {
            sseClients.delete(send);
          });
          return;
        }

        // Endpoint: Direct APK download with correct Android MIME types
        if (url === '/download/apk' || url.startsWith('/Gamifiter') || url.endsWith('.apk')) {
          const possiblePaths = [
            path.resolve(process.cwd(), 'public/Gamifiter.apk'),
            path.resolve(process.cwd(), 'public/Gamifiter-Debug.apk'),
            path.resolve(process.cwd(), 'build-output/Gamifiter-Debug.apk')
          ];
          const apkPath = possiblePaths.find((p) => fs.existsSync(p));

          if (apkPath) {
            const stat = fs.statSync(apkPath);
            res.writeHead(200, {
              'Content-Type': 'application/vnd.android.package-archive',
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename="Gamifiter.apk"',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            fs.createReadStream(apkPath).pipe(res);
            return;
          }
        }

        // Endpoint: GET /api/sync/status
        if (url === '/api/sync/status' && req.method === 'GET') {
          const db = loadDb();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            serverTime: new Date().toISOString(),
            students: db.students,
            logs: db.logs.slice(-50).reverse(), // Last 50 entries
            totalLoggedSyncs: db.logs.length
          }));
          return;
        }

        // Endpoint: GET /api/sync/export-csv (SPSS / R / Excel format for FTK UP)
        if (url === '/api/sync/export-csv' && req.method === 'GET') {
          const db = loadDb();
          let csv = 'log_id;student_id;student_name;timestamp;date;total_steps;step_delta;device_type;sync_source;integrity_hash;valid\n';
          db.logs.forEach((log) => {
            csv += `"${log.id}";"${log.studentId}";"${log.studentName}";"${log.timestamp}";"${log.date}";${log.steps};${log.stepDelta};"${log.device}";"${log.source}";"${log.integrityHash}";${log.valid}\n`;
          });

          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="ftk_up_gamifiter_sync_export.csv"');
          res.statusCode = 200;
          res.end(csv);
          return;
        }

        // Endpoint: POST /api/sync (Sync payload from Garmin/Health Connect/Phone)
        if (url.startsWith('/api/sync') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', () => {
            try {
              const payload = body ? JSON.parse(body) : {};
              const db = loadDb();

              const token = payload.token || payload.studentToken || req.headers['x-device-token'];
              let student = db.students.find((s) => s.pairedToken === token || s.id === payload.studentId);

              // If token not found, default to David Prycl if device is Garmin or payload indicates so
              if (!student) {
                if (payload.device?.toLowerCase().includes('garmin') || payload.device?.toLowerCase().includes('vivoactive')) {
                  student = db.students.find((s) => s.id === 'student-1');
                } else if (payload.device?.toLowerCase().includes('google') || payload.device?.toLowerCase().includes('health')) {
                  student = db.students.find((s) => s.id === 'student-2');
                } else {
                  student = db.students[0]; // fallback
                }
              }

              if (!student) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Student nebo párovací token nebyl nalezen.' }));
                return;
              }

              const inputSteps = parseInt(payload.steps, 10) || 0;
              const isDelta = payload.isDelta === true;
              
              let newTotalSteps = student.steps;
              let stepDelta = 0;

              if (isDelta) {
                stepDelta = inputSteps;
                newTotalSteps += inputSteps;
              } else {
                // Absolute daily reading from watch (replaces today's count)
                stepDelta = Math.max(0, inputSteps - student.steps);
                newTotalSteps = inputSteps;
              }

              const device = payload.device || student.device || 'Unspecified Device';
              const source = payload.source || 'health_connect_push';
              const now = new Date().toISOString();
              const dateStr = payload.date || now.split('T')[0];

              // Scientific Integrity Signature (SHA256)
              const hashPayload = `${student.id}:${dateStr}:${newTotalSteps}:${device}:${now}`;
              const integrityHash = 'ftk-sha256-' + crypto.createHash('sha256').update(hashPayload).digest('hex').substring(0, 16);

              // Update student in DB
              student.steps = newTotalSteps;
              student.lastSync = now;
              student.status = 'synced';
              student.device = device;

              // Create Audit Log
              const newLogEntry: SyncLogEntry = {
                id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                studentId: student.id,
                studentName: student.name,
                timestamp: now,
                date: dateStr,
                steps: newTotalSteps,
                stepDelta,
                device,
                source,
                integrityHash,
                valid: true,
                metadata: payload.metadata || {}
              };

              db.logs.push(newLogEntry);
              saveDb(db);

              // Broadcast real-time event to all connected browsers (interactive board in classroom)
              broadcastEvent('sync_received', {
                studentId: student.id,
                studentName: student.name,
                totalSteps: newTotalSteps,
                stepDelta,
                device,
                source,
                timestamp: now,
                integrityHash
              });

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: `Úspěšně synchronizováno pro: ${student.name}`,
                student: {
                  id: student.id,
                  name: student.name,
                  steps: student.steps,
                  device: student.device,
                  lastSync: student.lastSync
                },
                stepDelta,
                integrityHash,
                verificationCode: `FTK-UP-${student.id.toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`
              }));
            } catch (err: any) {
              console.error('[SyncAPI] Error processing sync:', err);
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message || 'Chyba zpracování' }));
            }
          });
          return;
        }

        // Endpoint: POST /api/sync/reset (Restore default research demo state)
        if (url === '/api/sync/reset' && req.method === 'POST') {
          saveDb(DEFAULT_DB);
          broadcastEvent('sync_reset', { message: 'Data byla obnovena do výchozího stavu.' });
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, message: 'Databáze byla resetována na výchozí hodnoty.' }));
          return;
        }

        next();
      });
    }
  };
}
