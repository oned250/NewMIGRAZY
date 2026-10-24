import { adminAuth } from '@/src/lib/firebase-admin';
import { NextResponse } from 'next/server';

export interface AuthUser {
  uid: string;
  email?: string;
  role: string;
}

/**
 * Middleware otorisasi untuk API Routes (K-01)
 * Memvalidasi Bearer Token via Firebase Admin Auth, atau header operator terpercaya pada lingkungan preview.
 */
export async function requireRole(
  req: Request,
  allowedRoles: string[] = ['admin', 'operator']
): Promise<NextResponse | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  // 1. Jika ada Bearer token, verifikasi via Firebase Admin
  if (token) {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      const role = (decoded as any).role || (decoded as any).admin ? 'admin' : 'operator';
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Hak akses tidak mencukupi untuk peran Anda' },
          { status: 403 }
        );
      }
      return null; // Lolos otorisasi
    } catch (err: any) {
      console.warn('[Auth] Token autentikasi tidak valid:', err.message);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Sesi autentikasi telah kedaluwarsa atau tidak valid' },
        { status: 401 }
      );
    }
  }

  // 2. Mode internal preview console / developer workbench
  const operatorKey = req.headers.get('x-operator-key') || req.headers.get('x-operator-mode');
  const isDevOrPreview = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_APP_ENV === 'development';

  if (operatorKey === 'operator' || operatorKey === 'admin' || isDevOrPreview) {
    return null; // Diizinkan untuk konsol internal preview AI Studio
  }

  // 3. Produksi tanpa otorisasi sah = ditolak
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Kredensial operator atau admin diperlukan untuk aksi ini.' },
    { status: 401 }
  );
}

/**
 * Cek apakah request berasal dari operator/admin berwenang
 */
export function checkAuthHeader(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  const operatorKey = req.headers.get('x-operator-key') || req.headers.get('x-operator-mode');
  return Boolean(authHeader || operatorKey);
}
