import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const strict = searchParams.get('strict') === 'true';

    const scriptPath = path.join(process.cwd(), 'scripts', 'zlce', 'zlce-check.py');
    const cmd = `python3 "${scriptPath}" . --no-git ${strict ? '--strict' : ''}`;

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 10000,
    });

    const isOk = stdout.includes('RESULT: OK');

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
      stderr: stderr ? stderr.trim() : null,
      isOk,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    // If zlce-check fails with exit code 1 or 2, stdout might still have the error details
    const stdout = error.stdout || '';
    const stderr = error.stderr || error.message;

    return NextResponse.json({
      success: false,
      output: stdout.trim(),
      stderr: stderr.trim(),
      isOk: false,
      timestamp: new Date().toISOString(),
    });
  }
}
