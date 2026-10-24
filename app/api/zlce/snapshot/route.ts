import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const withDiff = searchParams.get('diff') !== 'false';

    const scriptPath = path.join(process.cwd(), 'scripts', 'zlce', 'zlce-snapshot.sh');
    const cmd = `bash "${scriptPath}" ${withDiff ? '--diff' : ''}`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 10000,
    });

    // Deteksi rekomendasi kasus dari output
    let detectedCase: 'A' | 'B' | 'C' | 'D' | 'UNKNOWN' = 'A';
    if (stdout.includes('KASUS A')) detectedCase = 'A';
    else if (stdout.includes('KASUS B')) detectedCase = 'B';
    else if (stdout.includes('KASUS D')) detectedCase = 'D';

    return NextResponse.json({
      success: true,
      snapshot: stdout,
      errorOutput: stderr || null,
      detectedCase,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error running zlce-snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal menjalankan zlce-snapshot.sh',
      },
      { status: 500 }
    );
  }
}
