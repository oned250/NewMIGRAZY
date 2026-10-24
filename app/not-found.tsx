import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center shadow-xs">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-sm text-slate-600 mb-6">
          Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
