'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Wrench,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  Lock,
  Bike,
  CheckCircle2,
  Clock,
  KeyRound,
  AlertCircle,
  X,
  Edit2,
  Calendar,
  Check,
  Phone,
  ArrowRight,
  Sparkles,
  Layers,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';

export interface LacakUnitItem {
  id: number;
  unitId: number;
  kodeUnit: string;
  motorId: number;
  statusPosisi: 'parkir' | 'servis' | 'disewa';
  poolParkir: 'malang' | 'batu';
  namaBengkel: string | null;
  kontakBengkel: string | null;
  estimasiSelesai: string | null;
  bookingId: number | null;
  noBooking: string | null;
  namaPenyewa: string | null;
  tenggatKembali: string | null;
  catatan: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  nomorPlat: string;
  warna: string;
  poolDefault: string;
  statusServis: string;
  kmTerakhir: number;
  namaModel: string;
  kategori: string;
  harga1Hari: number;
}

export interface TrackingStats {
  total: number;
  parkirMalang: number;
  parkirBatu: number;
  servis: number;
  disewa: number;
}

export default function LiveUnitTrackingDashboard() {
  const [units, setUnits] = useState<LacakUnitItem[]>([]);
  const [stats, setStats] = useState<TrackingStats>({
    total: 0,
    parkirMalang: 0,
    parkirBatu: 0,
    servis: 0,
    disewa: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Search
  const [filterPosisi, setFilterPosisi] = useState<string>('semua');
  const [filterPool, setFilterPool] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal Ubah Posisi
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeUnit, setActiveUnit] = useState<LacakUnitItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    statusPosisi: 'parkir' as 'parkir' | 'servis' | 'disewa',
    poolParkir: 'malang' as 'malang' | 'batu',
    namaBengkel: '',
    kontakBengkel: '',
    estimasiSelesai: '',
    catatan: '',
  });

  // Fetch data from Cloud SQL via API
  const fetchTrackingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lacak-units');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat status pelacakan');
      }
      setUnits(json.data || []);
      if (json.stats) setStats(json.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/lacak-units')
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          setUnits(json.data || []);
          if (json.stats) setStats(json.stats);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Filtered units (AC-01: Exactly 1 row per physical unit, no duplicates)
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // Posisi filter
      if (filterPosisi !== 'semua') {
        if (filterPosisi === 'parkir_malang') {
          if (u.statusPosisi !== 'parkir' || u.poolParkir !== 'malang') return false;
        } else if (filterPosisi === 'parkir_batu') {
          if (u.statusPosisi !== 'parkir' || u.poolParkir !== 'batu') return false;
        } else {
          if (u.statusPosisi !== filterPosisi) return false;
        }
      }

      // Pool filter
      if (filterPool !== 'semua') {
        if (u.poolParkir !== filterPool && u.poolDefault !== filterPool) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesKode = u.kodeUnit.toLowerCase().includes(q);
        const matchesPlat = u.nomorPlat.toLowerCase().includes(q);
        const matchesModel = u.namaModel.toLowerCase().includes(q);
        const matchesPenyewa = u.namaPenyewa?.toLowerCase().includes(q);
        const matchesBooking = u.noBooking?.toLowerCase().includes(q);
        const matchesBengkel = u.namaBengkel?.toLowerCase().includes(q);
        if (!matchesKode && !matchesPlat && !matchesModel && !matchesPenyewa && !matchesBooking && !matchesBengkel) {
          return false;
        }
      }

      return true;
    });
  }, [units, filterPosisi, filterPool, searchQuery]);

  // Open Edit Modal (AC-03: Quick update position & service status)
  const handleOpenEdit = (unit: LacakUnitItem) => {
    setActiveUnit(unit);
    setEditForm({
      statusPosisi: unit.statusPosisi,
      poolParkir: unit.poolParkir || 'malang',
      namaBengkel: unit.namaBengkel || (unit.statusPosisi === 'servis' ? 'Ahass / Bengkel Resmi' : ''),
      kontakBengkel: unit.kontakBengkel || '',
      estimasiSelesai: unit.estimasiSelesai || '',
      catatan: unit.catatan || '',
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Modal
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lacak-units/${activeUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui posisi unit');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsEditModalOpen(false);
      fetchTrackingData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              TASK-006 — Monitoring Lacak Unit Real-Time (Opsi 3A)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              1 Unit Fisik = 1 Baris Aktif
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight flex items-center gap-2.5">
            Monitoring Pelacakan Posisi Seluruh Armada Fisik
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Sesuai aturan <strong>D-26</strong> dan <strong>Opsi 3A</strong>: Pool hanya berfungsi sebagai tempat parkir fisik (armada tidak dibagi kaku per pool). Setiap unit fisik dipantau lokasinya secara transparan:{' '}
            <strong className="text-emerald-700">Parkir di Pool</strong>,{' '}
            <strong className="text-amber-700">Servis di Bengkel</strong>, atau{' '}
            <strong className="text-blue-700">Sedang Disewa Pelanggan</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchTrackingData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Segarkan data pelacakan dari database Cloud SQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {error && !isEditModalOpen && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Terjadi Kendala</p>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* METRICS STRIP (AC-02: Instant Filter Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterPosisi('semua')}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterPosisi === 'semua'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <span className={`text-xs block ${filterPosisi === 'semua' ? 'text-slate-300' : 'text-slate-500'}`}>
            Semua Unit Garasi
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-xs opacity-75">unit</span>
          </div>
          <span className="text-[10px] opacity-75 mt-1 block">1 Baris per Unit (AC-01)</span>
        </button>

        <button
          onClick={() => setFilterPosisi('parkir_malang')}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterPosisi === 'parkir_malang'
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 text-emerald-900'
          }`}
        >
          <span className={`text-xs block ${filterPosisi === 'parkir_malang' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Parkir Pool Malang
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{stats.parkirMalang}</span>
            <span className="text-xs opacity-75">unit</span>
          </div>
          <span className="text-[10px] opacity-75 mt-1 block">Malang Kota</span>
        </button>

        <button
          onClick={() => setFilterPosisi('parkir_batu')}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterPosisi === 'parkir_batu'
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 text-emerald-900'
          }`}
        >
          <span className={`text-xs block ${filterPosisi === 'parkir_batu' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Parkir Pool Batu
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{stats.parkirBatu}</span>
            <span className="text-xs opacity-75">unit</span>
          </div>
          <span className="text-[10px] opacity-75 mt-1 block">Cabang Wisata</span>
        </button>

        <button
          onClick={() => setFilterPosisi('servis')}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterPosisi === 'servis'
              ? 'bg-amber-600 border-amber-700 text-white shadow-xs'
              : 'bg-amber-50/70 border-amber-200 hover:border-amber-300 text-amber-900'
          }`}
        >
          <span className={`text-xs block ${filterPosisi === 'servis' ? 'text-amber-100' : 'text-amber-700'}`}>
            Servis di Bengkel
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{stats.servis}</span>
            <span className="text-xs opacity-75">unit</span>
          </div>
          <span className="text-[10px] opacity-75 mt-1 block">Perawatan & Reparasi</span>
        </button>

        <button
          onClick={() => setFilterPosisi('disewa')}
          className={`text-left p-4 rounded-xl border transition-all ${
            filterPosisi === 'disewa'
              ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
              : 'bg-blue-50/70 border-blue-200 hover:border-blue-300 text-blue-900'
          }`}
        >
          <span className={`text-xs block ${filterPosisi === 'disewa' ? 'text-blue-100' : 'text-blue-700'}`}>
            Sedang Disewa
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{stats.disewa}</span>
            <span className="text-xs opacity-75">unit</span>
          </div>
          <span className="text-[10px] opacity-75 mt-1 block">Di Tangan Pelanggan</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode unit (B122), plat nomor, model motor, nama bengkel, atau penyewa..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterPool}
            onChange={(e) => setFilterPool(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="semua">Semua Lokasi Pool</option>
            <option value="malang">Pool Malang</option>
            <option value="batu">Pool Batu</option>
          </select>

          <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TRACKING TABLE (AC-01: 1 BARIS AKTIF PER UNIT FISIK TANPA DUPLIKASI) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Kode Unit & Motor</th>
                  <th className="py-3.5 px-4">Posisi Saat Ini</th>
                  <th className="py-3.5 px-4">Berada di Pool Mana</th>
                  <th className="py-3.5 px-4">Jika Servis: di Bengkel Mana</th>
                  <th className="py-3.5 px-4">Jika Disewa: Disewa Siapa</th>
                  <th className="py-3.5 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUnits.map((unit) => {
                  const isParked = unit.statusPosisi === 'parkir';
                  const isServis = unit.statusPosisi === 'servis';
                  const isDisewa = unit.statusPosisi === 'disewa';

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* 1. Kode Unit & Motor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs shadow-2xs">
                            <Lock className="w-3 h-3 text-amber-400" />
                            {unit.kodeUnit}
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {unit.nomorPlat}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-1">{unit.namaModel}</div>
                        <div className="text-[11px] text-slate-500">
                          {unit.kategori} • {unit.warna} • {Number(unit.kmTerakhir || 0).toLocaleString('id-ID')} km
                        </div>
                      </td>

                      {/* 2. Posisi Saat Ini */}
                      <td className="py-3.5 px-4">
                        {isParked && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Parkir di Pool</span>
                          </div>
                        )}
                        {isServis && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            <span>Servis di Bengkel</span>
                          </div>
                        )}
                        {isDisewa && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sedang Disewa</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          Update: {unit.updatedAt ? unit.updatedAt.slice(0, 16).replace('T', ' ') : 'System'}
                        </div>
                      </td>

                      {/* 3. Berada di Pool Mana */}
                      <td className="py-3.5 px-4 capitalize">
                        {isParked ? (
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            Pool {unit.poolParkir || unit.poolDefault}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500">
                            Pool Asal: Pool {unit.poolParkir || unit.poolDefault}
                          </div>
                        )}
                      </td>

                      {/* 4. Jika Servis: di Bengkel Mana */}
                      <td className="py-3.5 px-4">
                        {isServis ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-amber-900">{unit.namaBengkel || 'Bengkel Resmi'}</div>
                            {unit.kontakBengkel && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {unit.kontakBengkel}
                              </div>
                            )}
                            {unit.estimasiSelesai && (
                              <div className="text-[10px] text-amber-800 font-mono">
                                Est. Selesai: {unit.estimasiSelesai}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 5. Jika Disewa: Disewa Siapa */}
                      <td className="py-3.5 px-4">
                        {isDisewa ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-blue-900">{unit.namaPenyewa || 'Pelanggan'}</div>
                            {unit.noBooking && (
                              <div className="text-[11px] font-mono text-slate-600">{unit.noBooking}</div>
                            )}
                            {unit.tenggatKembali && (
                              <div className="text-[10px] text-blue-800 font-mono">
                                Tenggat: {unit.tenggatKembali}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* 6. Aksi Cepat Staf (AC-03) */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(unit)}
                          disabled={isDisewa}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={isDisewa ? 'Unit sedang aktif disewa pelanggan' : 'Ubah posisi parkir atau kirim servis'}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ubah Posisi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TRACKING GRID CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const isParked = unit.statusPosisi === 'parkir';
            const isServis = unit.statusPosisi === 'servis';
            const isDisewa = unit.statusPosisi === 'disewa';

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs shadow-2xs">
                      <Lock className="w-3 h-3 text-amber-400" />
                      {unit.kodeUnit}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isParked
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isServis
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {isParked && <MapPin className="w-3 h-3" />}
                      {isServis && <Wrench className="w-3 h-3" />}
                      {isDisewa && <UserCheck className="w-3 h-3" />}
                      <span className="capitalize">{unit.statusPosisi}</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{unit.namaModel}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {unit.nomorPlat} • {unit.warna}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pool Fisik:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        Pool {unit.poolParkir || unit.poolDefault}
                      </span>
                    </div>

                    {isServis && (
                      <div className="pt-1 border-t border-slate-200 text-amber-900">
                        <p className="font-bold">{unit.namaBengkel || 'Bengkel Resmi'}</p>
                        {unit.estimasiSelesai && (
                          <p className="text-[11px]">Est. Selesai: {unit.estimasiSelesai}</p>
                        )}
                      </div>
                    )}

                    {isDisewa && (
                      <div className="pt-1 border-t border-slate-200 text-blue-900">
                        <p className="font-bold">Disewa: {unit.namaPenyewa}</p>
                        {unit.noBooking && <p className="text-[11px] font-mono">{unit.noBooking}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Number(unit.kmTerakhir || 0).toLocaleString('id-ID')} km
                  </span>
                  <button
                    onClick={() => handleOpenEdit(unit)}
                    disabled={isDisewa}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" />
                    <span>Ubah Posisi</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL UBAH POSISI / STATUS SERVIS (AC-03) */}
      {isEditModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Perbarui Posisi Unit</h3>
                  <p className="text-xs text-slate-500">
                    Unit: <strong className="text-slate-800">{activeUnit.kodeUnit}</strong> ({activeUnit.nomorPlat})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Status Posisi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Status Posisi Unit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.statusPosisi}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      statusPosisi: e.target.value as 'parkir' | 'servis' | 'disewa',
                    })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden font-semibold"
                >
                  <option value="parkir">Parkir di Pool (Siap Disewa)</option>
                  <option value="servis">Servis di Bengkel (Masuk Perawatan)</option>
                </select>
              </div>

              {/* Pool Parkir */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Lokasi Pool Fisik <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editForm.poolParkir}
                  onChange={(e) =>
                    setEditForm({ ...editForm, poolParkir: e.target.value as 'malang' | 'batu' })
                  }
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="malang">Pool Malang (Pusat Kota)</option>
                  <option value="batu">Pool Batu (Cabang Wisata)</option>
                </select>
              </div>

              {/* Jika Servis: Detail Bengkel */}
              {editForm.statusPosisi === 'servis' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    Informasi Bengkel Servis
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Nama Bengkel</label>
                    <input
                      type="text"
                      required
                      value={editForm.namaBengkel}
                      onChange={(e) => setEditForm({ ...editForm, namaBengkel: e.target.value })}
                      placeholder="Contoh: Ahass Sukun Malang"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Kontak / Telepon Bengkel</label>
                    <input
                      type="text"
                      value={editForm.kontakBengkel}
                      onChange={(e) => setEditForm({ ...editForm, kontakBengkel: e.target.value })}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Estimasi Selesai Servis</label>
                    <input
                      type="text"
                      value={editForm.estimasiSelesai}
                      onChange={(e) => setEditForm({ ...editForm, estimasiSelesai: e.target.value })}
                      placeholder="Contoh: 2026-10-21 16:00"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Catatan Posisi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Operasional</label>
                <input
                  type="text"
                  value={editForm.catatan}
                  onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                  placeholder="Contoh: Unit dipindahkan ke Pool Batu untuk antisipasi weekend"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan Posisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
