import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Helper deteksi kasus recovery
function parseDetectedCase(stdout: string): 'A' | 'B' | 'C' | 'D' {
  if (stdout.includes('KASUS A') || stdout.includes('Working tree bersih')) return 'A';
  if (stdout.includes('KASUS B') || stdout.includes('Diff Cocok dengan WAL')) return 'B';
  if (stdout.includes('KASUS C') || stdout.includes('Commit Ada di Git Log')) return 'C';
  if (stdout.includes('KASUS D') || stdout.includes('Diff di Luar Daftar WAL')) return 'D';
  return 'A';
}

// GET /api/zlce/snapshot - Mengambil snapshot darurat
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const withDiff = searchParams.get('diff') !== 'false';
    const targetDir = searchParams.get('dir') || '.';

    const scriptPath = path.join(process.cwd(), 'scripts', 'zlce', 'zlce-snapshot.sh');
    const cmd = `bash "${scriptPath}" ${withDiff ? '--diff' : ''} "${targetDir}"`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 10000,
    });

    const detectedCase = parseDetectedCase(stdout);

    return NextResponse.json({
      success: true,
      snapshot: stdout,
      errorOutput: stderr || null,
      detectedCase,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error running zlce-snapshot GET:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menjalankan zlce-snapshot.sh',
      },
      { status: 500 }
    );
  }
}

// POST /api/zlce/snapshot - Membuat snapshot terpandu melalui wizard dengan opsi simpan & bundel handover
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      withDiff = true,
      targetDir = '.',
      reason = 'Pemulihan sesi AI terputus',
      saveToArchive = false,
      appendAuditLog = false,
    } = body;

    const scriptPath = path.join(process.cwd(), 'scripts', 'zlce', 'zlce-snapshot.sh');
    const cmd = `bash "${scriptPath}" ${withDiff ? '--diff' : ''} "${targetDir}"`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 12000,
    });

    const detectedCase = parseDetectedCase(stdout);
    let savedPath: string | null = null;

    // 1. Opsi simpan ke docs/archive
    if (saveToArchive) {
      const archiveDir = path.join(process.cwd(), 'docs', 'archive');
      await fs.mkdir(archiveDir, { recursive: true });
      const filename = `snapshot-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      const fullPath = path.join(archiveDir, filename);
      const fileContent = `# ZLCE SNAPSHOT ARCHIVE\n# Reason: ${reason}\n# Created: ${new Date().toISOString()}\n\n${stdout}`;
      await fs.writeFile(fullPath, fileContent, 'utf-8');
      savedPath = `docs/archive/${filename}`;
    }

    // 2. Baca SESSION_STATE.md dan HANDOVER.md untuk menyusun Bundel Handover All-in-One
    let sessionStateContent = '';
    let handoverPromptContent = '';
    try {
      sessionStateContent = await fs.readFile(
        path.join(process.cwd(), 'FOLDER_KERJA', 'SESSION_STATE.md'),
        'utf-8'
      );
    } catch {
      // fallback
    }

    try {
      handoverPromptContent = await fs.readFile(
        path.join(process.cwd(), 'FOLDER_KERJA', 'HANDOVER.md'),
        'utf-8'
      );
    } catch {
      // fallback
    }

    // 3. Opsi catat ke log audit SESSION_STATE.md
    if (appendAuditLog && sessionStateContent) {
      try {
        const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
        const logEntry = `* **[${timeStr}]:** SNAPSHOT dibuat via Wizard Recovery: Kasus ${detectedCase} (${reason}).\n`;
        const statePath = path.join(process.cwd(), 'FOLDER_KERJA', 'SESSION_STATE.md');
        if (sessionStateContent.includes('## 7. LOG AUDIT')) {
          const updatedState = sessionStateContent.replace(
            /(## 7\. LOG AUDIT[^\n]*\n\n)/,
            `$1${logEntry}`
          );
          await fs.writeFile(statePath, updatedState, 'utf-8');
          sessionStateContent = updatedState;
        }
      } catch (err) {
        console.warn('Gagal menambahkan log audit ke SESSION_STATE.md:', err);
      }
    }

    // Susun Bundel Serah Terima Lengkap (Ready-to-Paste All-in-One)
    const handoverBundle = `================================================================================
BUNDEL PEMULIHAN SESI ZLCE (RECOVERY HANDOVER BUNDLE)
Alasan Snapshot: ${reason}
Waktu Pembuatan: ${new Date().toLocaleString('id-ID')}
Klasifikasi Rekomendasi: KASUS ${detectedCase}
================================================================================

--- LAMPIRAN 1: RECOVERY SNAPSHOT (scripts/zlce/zlce-snapshot.sh) ---
${stdout.trim()}

--- LAMPIRAN 2: FOLDER_KERJA/SESSION_STATE.md (STATE AKTIF) ---
${sessionStateContent.trim()}

--- INSTRUKSI PROMPT HANDOVER (TEMPELKAN KE SESI AI BARU) ---
${handoverPromptContent.trim()}
`;

    return NextResponse.json({
      success: true,
      snapshot: stdout,
      errorOutput: stderr || null,
      detectedCase,
      savedPath,
      handoverBundle,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error running zlce-snapshot POST:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal membuat snapshot pemulihan',
      },
      { status: 500 }
    );
  }
}
