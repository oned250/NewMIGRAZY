'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bike,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  Info,
  MapPin,
  Wrench,
  KeyRound,
  Lock,
  Gauge,
  Calendar,
  Phone,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export interface ArmadaUnitItem {
  id: number;
  kodeUnit: string;
  motorId: number;
  nomorPlat: string;
  warna: string;
  poolDefault: 'malang' | 'batu';
  statusServis: 'aktif' | 'servis';
  kmTerakhir: number;
  tglServisTerakhir: string | null;
  namaBengkel: string | null;
  createdAt: string | null;
  // Model relation
  namaModel?: string;
  kategori?: string;
  imageUrl?: string | null;
  harga1Hari?: number;
  // Lacak relation
  lacakId?: number;
  statusPosisi?: 'parkir' | 'servis' | 'disewa';
  poolParkir?: 'malang' | 'batu';
  lacakNamaBengkel?: string | null;
  kontakBengkel?: string | null;
  estimasiSelesai?: string | null;
  bookingId?: number | null;
  noBooking?: string | null;
  namaPenyewa?: string | null;
  tenggatKembali?: string | null;
  lacakCatatan?: string | null;
}

export interface MotorModelOption {
  id: number;
  namaModel: string;
  kategori: string;
  harga1Hari: number;
}

function formatRp(val: number) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

export default function ArmadaUnitManager() {
  const [units, setUnits] = useState<ArmadaUnitItem[]>([]);
  const [models, setModels] = useState<MotorModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & View mode
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModel, setFilterModel] = useState<string>('semua');
  const [filterPool, setFilterPool] = useState<string>('semua');
  const [filterStatusServis, setFilterStatusServis] = useState<string>('semua');
  const [filterPosisiLacak, setFilterPosisiLacak] = useState<string>('semua');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected unit for operations
  const [activeUnit, setActiveUnit] = useState<ArmadaUnitItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    kodeUnit: '',
    motorId: '',
    nomorPlat: '',
    warna: '',
    poolDefault: 'malang' as 'malang' | 'batu',
    statusServis: 'aktif' as 'aktif' | 'servis',
    kmTerakhir: 0,
    tglServisTerakhir: '',
    namaBengkel: '',
    kontakBengkel: '',
    estimasiSelesai: '',
    catatan: '',
  });

  const [serviceActionData, setServiceActionData] = useState({
    action: 'masuk_servis' as 'masuk_servis' | 'selesai_servis',
    namaBengkel: '',
    kontakBengkel: '',
    estimasiSelesai: '',
    kmTerakhir: 0,
    catatan: '',
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resUnits, resModels] = await Promise.all([
        fetch('/api/armada-units'),
        fetch('/api/motor-models'),
      ]);

      const jsonUnits = await resUnits.json();
      const jsonModels = await resModels.json();

      if (jsonUnits.success) {
        setUnits(jsonUnits.data || []);
      } else {
        throw new Error(jsonUnits.error || 'Gagal mengambil data unit');
      }

      if (jsonModels.success) {
        setModels(jsonModels.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([fetch('/api/armada-units'), fetch('/api/motor-models')])
      .then(async ([resUnits, resModels]) => {
        const jsonUnits = await resUnits.json();
        const jsonModels = await resModels.json();
        if (!ignore) {
          if (jsonUnits.success) setUnits(jsonUnits.data || []);
          if (jsonModels.success) setModels(jsonModels.data || []);
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

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // Search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesKode = u.kodeUnit.toLowerCase().includes(q);
        const matchesPlat = u.nomorPlat.toLowerCase().includes(q);
        const matchesWarna = u.warna.toLowerCase().includes(q);
        const matchesModel = u.namaModel?.toLowerCase().includes(q);
        const matchesPenyewa = u.namaPenyewa?.toLowerCase().includes(q);
        if (!matchesKode && !matchesPlat && !matchesWarna && !matchesModel && !matchesPenyewa) {
          return false;
        }
      }

      // Filter Model
      if (filterModel !== 'semua') {
        if (String(u.motorId) !== filterModel) return false;
      }

      // Filter Pool
      if (filterPool !== 'semua') {
        if (u.poolDefault !== filterPool) return false;
      }

      // Filter Status Servis
      if (filterStatusServis !== 'semua') {
        if (u.statusServis !== filterStatusServis) return false;
      }

      // Filter Posisi Lacak
      if (filterPosisiLacak !== 'semua') {
        if (u.statusPosisi !== filterPosisiLacak) return false;
      }

      return true;
    });
  }, [units, searchQuery, filterModel, filterPool, filterStatusServis, filterPosisiLacak]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = units.length;
    const siapJalan = units.filter((u) => u.statusServis === 'aktif' && u.statusPosisi === 'parkir').length;
    const sedangDisewa = units.filter((u) => u.statusPosisi === 'disewa').length;
    const dalamServis = units.filter((u) => u.statusServis === 'servis' || u.statusPosisi === 'servis').length;
    const poolMalang = units.filter((u) => u.poolDefault === 'malang').length;
    const poolBatu = units.filter((u) => u.poolDefault === 'batu').length;

    return { total, siapJalan, sedangDisewa, dalamServis, poolMalang, poolBatu };
  }, [units]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultModelId = models.length > 0 ? String(models[0].id) : '';
    setFormData({
      kodeUnit: '',
      motorId: defaultModelId,
      nomorPlat: '',
      warna: '',
      poolDefault: 'malang',
      statusServis: 'aktif',
      kmTerakhir: 0,
      tglServisTerakhir: '',
      namaBengkel: '',
      kontakBengkel: '',
      estimasiSelesai: '',
      catatan: '',
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal (READONLY KODE_UNIT AC-02)
  const handleOpenEditModal = (unit: ArmadaUnitItem) => {
    setActiveUnit(unit);
    setFormData({
      kodeUnit: unit.kodeUnit, // WILL BE LOCKED IN UI
      motorId: String(unit.motorId),
      nomorPlat: unit.nomorPlat,
      warna: unit.warna,
      poolDefault: unit.poolDefault,
      statusServis: unit.statusServis,
      kmTerakhir: unit.kmTerakhir || 0,
      tglServisTerakhir: unit.tglServisTerakhir || '',
      namaBengkel: unit.namaBengkel || '',
      kontakBengkel: unit.kontakBengkel || '',
      estimasiSelesai: unit.estimasiSelesai || '',
      catatan: unit.lacakCatatan || '',
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  // Open Service Modal
  const handleOpenServiceModal = (unit: ArmadaUnitItem) => {
    setActiveUnit(unit);
    const nextAction = unit.statusServis === 'servis' ? 'selesai_servis' : 'masuk_servis';
    setServiceActionData({
      action: nextAction,
      namaBengkel: unit.namaBengkel || (nextAction === 'masuk_servis' ? 'Ahass / Bengkel Resmi' : ''),
      kontakBengkel: unit.kontakBengkel || '',
      estimasiSelesai: unit.estimasiSelesai || '',
      kmTerakhir: unit.kmTerakhir || 0,
      catatan: '',
    });
    setError(null);
    setIsServiceModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (unit: ArmadaUnitItem) => {
    setActiveUnit(unit);
    setError(null);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Unit (AC-01 & AC-03)
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kodeUnit || !formData.motorId || !formData.nomorPlat || !formData.warna) {
      setError('Kode Unit, Model Motor, Nomor Plat, dan Warna wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/armada-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mendaftarkan unit');
      }

      setSuccessMessage(`Unit ${json.data.kodeUnit} berhasil didaftarkan dan tersinkronisasi ke modul lacak!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Unit (AC-02: Kode Unit tidak ikut dikirim atau terverifikasi identik)
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/armada-units/${activeUnit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kodeUnit: activeUnit.kodeUnit, // strictly identical
          motorId: formData.motorId,
          nomorPlat: formData.nomorPlat,
          warna: formData.warna,
          poolDefault: formData.poolDefault,
          statusServis: formData.statusServis,
          kmTerakhir: formData.kmTerakhir,
          tglServisTerakhir: formData.tglServisTerakhir,
          namaBengkel: formData.namaBengkel,
          kontakBengkel: formData.kontakBengkel,
          estimasiSelesai: formData.estimasiSelesai,
          catatan: formData.catatan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memperbarui unit');
      }

      setSuccessMessage(`Data unit ${activeUnit.kodeUnit} berhasil diperbarui.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Quick Service Action
  const handleSubmitServiceAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/armada-units/${activeUnit.id}/servis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceActionData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memproses aksi bengkel');
      }

      setSuccessMessage(json.message || 'Status servis unit berhasil diubah!');
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsServiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Unit
  const handleSubmitDelete = async () => {
    if (!activeUnit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/armada-units/${activeUnit.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus unit');
      }

      setSuccessMessage(json.message || `Unit ${activeUnit.kodeUnit} berhasil dihapus.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsDeleteModalOpen(false);
      fetchData();
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
              TASK-004 — Cloud SQL PostgreSQL & React 19
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
              <Lock className="w-3 h-3 text-amber-600" />
              AC-02: Kode Unit Readonly
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight flex items-center gap-2.5">
            Manajemen Unit Armada Fisik Garasi
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Pengelolaan inventaris unit motor fisik (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">armada_units</code> / <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">ryokou_unit</code>), nomor plat, pool fisik (Malang/Batu), status servis bengkel, dan sinkronisasi otomatis ke modul pelacakan real-time (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">lacak_units</code>).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh data dari database Cloud SQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Unit Baru</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {error && !isAddModalOpen && !isEditModalOpen && !isServiceModalOpen && !isDeleteModalOpen && (
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

      {/* METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Total Unit Fisik</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-400">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Bike className="w-3.5 h-3.5 text-slate-400" />
            <span>Garasi Ryokou</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-emerald-600">Siap Jalan (Parkir)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-700">{metrics.siapJalan}</span>
            <span className="text-xs text-emerald-600/70">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bisa Langsung Disewa</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-blue-600">Sedang Disewa</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-700">{metrics.sedangDisewa}</span>
            <span className="text-xs text-blue-600/70">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-blue-500" />
            <span>Di Tangan Pelanggan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-amber-600">Dalam Servis</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-700">{metrics.dalamServis}</span>
            <span className="text-xs text-amber-600/70">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>Di Bengkel Resmi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Pool Malang</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{metrics.poolMalang}</span>
            <span className="text-xs text-slate-400">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Malang Kota</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500">Pool Batu</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{metrics.poolBatu}</span>
            <span className="text-xs text-slate-400">unit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Wisata Batu</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode unit (B122), plat nomor (N 4321 AB), warna, atau model..."
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

          {/* View mode toggle */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50 self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Tabel Detail"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Model Motor</label>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="semua">Semua Model ({models.length})</option>
              {models.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.namaModel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Pool Default Fisik</label>
            <select
              value={filterPool}
              onChange={(e) => setFilterPool(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="semua">Semua Pool</option>
              <option value="malang">Pool Malang</option>
              <option value="batu">Pool Batu</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Status Servis</label>
            <select
              value={filterStatusServis}
              onChange={(e) => setFilterStatusServis(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif Siap Pakai</option>
              <option value="servis">Sedang Servis</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Posisi Real-Time Lacak</label>
            <select
              value={filterPosisiLacak}
              onChange={(e) => setFilterPosisiLacak(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="semua">Semua Posisi Lacak</option>
              <option value="parkir">Parkir di Pool</option>
              <option value="disewa">Sedang Disewa</option>
              <option value="servis">Masuk Bengkel</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIT LISTING - GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const isParked = unit.statusPosisi === 'parkir';
            const isRented = unit.statusPosisi === 'disewa';
            const isServicing = unit.statusPosisi === 'servis' || unit.statusServis === 'servis';

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header card with Unit Code & Plate */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* KODE UNIT READONLY BADGE */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold bg-slate-900 text-white tracking-wider shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      {unit.kodeUnit}
                    </span>

                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      {unit.nomorPlat}
                    </span>
                  </div>

                  {/* Status Servis pill */}
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      unit.statusServis === 'aktif'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {unit.statusServis === 'aktif' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Aktif
                      </>
                    ) : (
                      <>
                        <Wrench className="w-3 h-3 text-amber-600" />
                        Servis
                      </>
                    )}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 flex-1">
                  {/* Model & Kategori */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                        {unit.namaModel || 'Model Motor'}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-700">{unit.kategori || 'Matic'}</span>
                        <span>•</span>
                        <span>{unit.warna}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Tarif 1 Hari</span>
                      <span className="text-xs font-bold text-slate-800">
                        {formatRp(unit.harga1Hari || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Pool & Odometer Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Pool Default</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-700 capitalize">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Pool {unit.poolDefault}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Odometer KM</span>
                      <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-700">
                        <Gauge className="w-3.5 h-3.5 text-blue-600" />
                        {Number(unit.kmTerakhir || 0).toLocaleString('id-ID')} km
                      </div>
                    </div>
                  </div>

                  {/* SINKRONISASI REAL-TIME LACAK (D-26 / 1 Unit = 1 Baris) */}
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      isParked
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : isRented
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isParked ? 'bg-emerald-400' : isRented ? 'bg-blue-400' : 'bg-amber-400'
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${
                              isParked ? 'bg-emerald-500' : isRented ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                          />
                        </span>
                        Posisi Lacak Real-Time (Opsi 3A)
                      </span>
                      <span className="capitalize text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/80 shadow-2xs">
                        {unit.statusPosisi || 'parkir'}
                      </span>
                    </div>

                    {isParked && (
                      <p className="text-[11px] text-emerald-800">
                        📍 Terparkir aman di <strong>Pool {unit.poolParkir || unit.poolDefault}</strong>. Siap dialokasikan untuk booking baru.
                      </p>
                    )}

                    {isRented && (
                      <div className="space-y-0.5 text-[11px] text-blue-800">
                        <p>
                          🔑 Sedang disewa oleh: <strong>{unit.namaPenyewa || 'Pelanggan'}</strong>
                        </p>
                        <p className="text-[10px] text-blue-700">
                          No Booking: {unit.noBooking || '-'} • Tenggat: {unit.tenggatKembali || '-'}
                        </p>
                      </div>
                    )}

                    {isServicing && (
                      <div className="space-y-0.5 text-[11px] text-amber-900">
                        <p>
                          🔧 Bengkel: <strong>{unit.lacakNamaBengkel || unit.namaBengkel || 'Ahass / Rekanan'}</strong>
                        </p>
                        {unit.estimasiSelesai && (
                          <p className="text-[10px] text-amber-800">
                            Estimasi Selesai: {unit.estimasiSelesai}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenServiceModal(unit)}
                    disabled={isRented}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isRented ? 'Unit sedang disewa, tidak dapat masuk servis' : 'Kelola status servis bengkel'}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{unit.statusServis === 'servis' ? 'Selesai Servis' : 'Kirim Bengkel'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(unit)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-colors"
                      title="Edit unit (Kode unit readonly AC-02)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(unit)}
                      disabled={isRented}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isRented ? 'Unit sedang disewa tidak dapat dihapus' : 'Hapus unit fisik'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UNIT LISTING - TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Kode Unit (Readonly)</th>
                  <th className="py-3 px-4">Plat & Warna</th>
                  <th className="py-3 px-4">Model & Kategori</th>
                  <th className="py-3 px-4">Pool Default</th>
                  <th className="py-3 px-4">Status Servis</th>
                  <th className="py-3 px-4">Lacak Real-Time (Opsi 3A)</th>
                  <th className="py-3 px-4">Odometer</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUnits.map((unit) => {
                  const isParked = unit.statusPosisi === 'parkir';
                  const isRented = unit.statusPosisi === 'disewa';
                  const isServicing = unit.statusPosisi === 'servis' || unit.statusServis === 'servis';

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-900 text-white font-mono shadow-2xs">
                          <Lock className="w-3 h-3 text-amber-400" />
                          {unit.kodeUnit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800">{unit.nomorPlat}</div>
                        <div className="text-[11px] text-slate-500">{unit.warna}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{unit.namaModel}</div>
                        <div className="text-[11px] text-slate-500">
                          {unit.kategori} • {formatRp(unit.harga1Hari || 0)}/hari
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          Pool {unit.poolDefault}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            unit.statusServis === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {unit.statusServis === 'aktif' ? 'Aktif' : 'Servis'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isParked && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Parkir di Pool {unit.poolParkir || unit.poolDefault}
                          </span>
                        )}
                        {isRented && (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            <KeyRound className="w-3 h-3 text-blue-600" />
                            Disewa: {unit.namaPenyewa || '-'}
                          </span>
                        )}
                        {isServicing && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                            <Wrench className="w-3 h-3 text-amber-600" />
                            {unit.lacakNamaBengkel || unit.namaBengkel || 'Bengkel'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-700">
                          {Number(unit.kmTerakhir || 0).toLocaleString('id-ID')} km
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenServiceModal(unit)}
                            disabled={isRented}
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 transition-colors disabled:opacity-30"
                            title="Aksi Bengkel"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(unit)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded border border-slate-200 transition-colors"
                            title="Edit Unit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(unit)}
                            disabled={isRented}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors disabled:opacity-30"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredUnits.length === 0 && !loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Bike className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Tidak ada unit ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tidak ada unit armada fisik yang cocok dengan filter atau kata kunci saat ini.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterModel('semua');
              setFilterPool('semua');
              setFilterStatusServis('semua');
              setFilterPosisiLacak('semua');
            }}
            className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DAFTARKAN UNIT BARU (AC-01 & AC-03)            */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Daftarkan Unit Armada Fisik Baru</h3>
                  <p className="text-xs text-slate-500">
                    Membuat unit fisik garasi (<code className="text-xs">armada_units</code>) & sinkronisasi otomatis ke lacak
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* KODE UNIT (AC-01 & AC-02) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Kode Unit Garasi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.kodeUnit}
                    onChange={(e) => setFormData({ ...formData, kodeUnit: e.target.value.toUpperCase() })}
                    placeholder="Contoh: B151, B122, S101"
                    className="w-full px-3 py-2 text-sm font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                    Unik
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1.5 flex items-start gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Aturan D-12 & AC-02:</strong> Kode unit bersifat permanen dan akan langsung terkunci (readonly) setelah dibuat untuk mencegah putusnya riwayat tracking dan transaksi.
                  </span>
                </p>
              </div>

              {/* MODEL MOTOR & NOMOR PLAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Model Motor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.motorId}
                    onChange={(e) => setFormData({ ...formData, motorId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="">-- Pilih Model Motor --</option>
                    {models.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.namaModel} ({m.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor Plat Polisi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomorPlat}
                    onChange={(e) => setFormData({ ...formData, nomorPlat: e.target.value.toUpperCase() })}
                    placeholder="Contoh: N 1234 XY"
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* WARNA & POOL DEFAULT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Warna Motor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                    placeholder="Contoh: Matte Blue, Hitam Glossy"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pool Parkir Default <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.poolDefault}
                    onChange={(e) => setFormData({ ...formData, poolDefault: e.target.value as 'malang' | 'batu' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="malang">Pool Malang (Pusat)</option>
                    <option value="batu">Pool Batu (Cabang Wisata)</option>
                  </select>
                </div>
              </div>

              {/* STATUS SERVIS AWAL & ODOMETER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Status Awal Unit
                  </label>
                  <select
                    value={formData.statusServis}
                    onChange={(e) => setFormData({ ...formData, statusServis: e.target.value as 'aktif' | 'servis' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="aktif">Aktif (Siap Langsung Parkir & Disewa)</option>
                    <option value="servis">Servis (Langsung Masuk Bengkel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    KM Odometer Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kmTerakhir}
                    onChange={(e) => setFormData({ ...formData, kmTerakhir: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* JIKA STATUS SERVIS */}
              {formData.statusServis === 'servis' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    Informasi Bengkel Servis
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Nama Bengkel</label>
                      <input
                        type="text"
                        value={formData.namaBengkel}
                        onChange={(e) => setFormData({ ...formData, namaBengkel: e.target.value })}
                        placeholder="Contoh: Ahass Sukun"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Kontak Bengkel</label>
                      <input
                        type="text"
                        value={formData.kontakBengkel}
                        onChange={(e) => setFormData({ ...formData, kontakBengkel: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs mb-1">Estimasi Selesai</label>
                    <input
                      type="text"
                      value={formData.estimasiSelesai}
                      onChange={(e) => setFormData({ ...formData, estimasiSelesai: e.target.value })}
                      placeholder="Contoh: 2026-10-21 15:00 WIB"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              {/* LIVE PREVIEW SINKRONISASI AC-03 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Pratinjau Otomatisasi Sinkronisasi (AC-03):
                </span>
                <p className="text-slate-600 text-[11px]">
                  Setelah tombol simpan ditekan, sistem otomatis membuat <strong>1 baris aktif</strong> di tabel{' '}
                  <code className="text-slate-800 font-mono">lacak_units</code> dengan status posisi{' '}
                  <span className="font-semibold text-emerald-700">
                    {formData.statusServis === 'servis' ? 'servis' : 'parkir'}
                  </span>{' '}
                  di <strong>Pool {formData.poolDefault.toUpperCase()}</strong>.
                </p>
              </div>

              {/* BUTTONS */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Mendaftarkan...' : 'Daftarkan Unit Fisik'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT UNIT (KODE UNIT TERKUNCI / READONLY AC-02) */}
      {/* ======================================================== */}
      {isEditModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Unit Armada Fisik</h3>
                  <p className="text-xs text-slate-500">
                    Perbarui nomor plat, warna, pool default, dan status servis
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

              {/* KODE UNIT: LOCKED & READONLY (AC-02 & D-12) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    Kode Unit (Readonly / Terkunci Permanen)
                  </label>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    AC-02 Immutability Enforced
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={activeUnit.kodeUnit}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-100 text-slate-600 border border-slate-300 rounded-xl cursor-not-allowed select-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sesuai kriteria penerimaan <strong>AC-02 & D-12</strong>, <code className="text-xs">kode_unit</code> terkunci dan tidak dapat dimodifikasi setelah dibuat guna menjamin integritas histori sewa.
                </p>
              </div>

              {/* MODEL MOTOR & PLAT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Model Motor</label>
                  <select
                    value={formData.motorId}
                    onChange={(e) => setFormData({ ...formData, motorId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.namaModel} ({m.kategori})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Nomor Plat</label>
                  <input
                    type="text"
                    required
                    value={formData.nomorPlat}
                    onChange={(e) => setFormData({ ...formData, nomorPlat: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* WARNA & POOL DEFAULT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Warna</label>
                  <input
                    type="text"
                    required
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Pool Default Fisik</label>
                  <select
                    value={formData.poolDefault}
                    onChange={(e) => setFormData({ ...formData, poolDefault: e.target.value as 'malang' | 'batu' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="malang">Pool Malang</option>
                    <option value="batu">Pool Batu</option>
                  </select>
                </div>
              </div>

              {/* STATUS SERVIS & ODOMETER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Status Servis</label>
                  <select
                    value={formData.statusServis}
                    onChange={(e) => setFormData({ ...formData, statusServis: e.target.value as 'aktif' | 'servis' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="aktif">Aktif Siap Pakai</option>
                    <option value="servis">Dalam Servis (Bengkel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">KM Odometer Terakhir</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.kmTerakhir}
                    onChange={(e) => setFormData({ ...formData, kmTerakhir: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* BUTTONS */}
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
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: AKSI CEPAT BENGKEL / SERVIS                      */}
      {/* ======================================================== */}
      {isServiceModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {serviceActionData.action === 'masuk_servis' ? 'Kirim Unit ke Bengkel' : 'Unit Selesai Servis'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unit: <strong className="text-slate-800">{activeUnit.kodeUnit}</strong> ({activeUnit.nomorPlat})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitServiceAction} className="p-5 space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {serviceActionData.action === 'masuk_servis' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Nama Bengkel</label>
                    <input
                      type="text"
                      required
                      value={serviceActionData.namaBengkel}
                      onChange={(e) => setServiceActionData({ ...serviceActionData, namaBengkel: e.target.value })}
                      placeholder="Contoh: Ahass Sukun Malang"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Kontak / No WA Bengkel</label>
                    <input
                      type="text"
                      value={serviceActionData.kontakBengkel}
                      onChange={(e) => setServiceActionData({ ...serviceActionData, kontakBengkel: e.target.value })}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Estimasi Selesai Servis</label>
                    <input
                      type="text"
                      value={serviceActionData.estimasiSelesai}
                      onChange={(e) => setServiceActionData({ ...serviceActionData, estimasiSelesai: e.target.value })}
                      placeholder="Contoh: 2026-10-21 17:00"
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">KM Odometer Saat Masuk</label>
                    <input
                      type="number"
                      value={serviceActionData.kmTerakhir}
                      onChange={(e) => setServiceActionData({ ...serviceActionData, kmTerakhir: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Konfirmasi Unit Siap Parkir
                    </p>
                    <p>
                      Unit akan dikembalikan ke status <strong>Aktif</strong> dan parkir di{' '}
                      <strong>Pool {activeUnit.poolDefault.toUpperCase()}</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Update KM Odometer Pasca Servis</label>
                    <input
                      type="number"
                      value={serviceActionData.kmTerakhir}
                      onChange={(e) => setServiceActionData({ ...serviceActionData, kmTerakhir: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Servis</label>
                <input
                  type="text"
                  value={serviceActionData.catatan}
                  onChange={(e) => setServiceActionData({ ...serviceActionData, catatan: e.target.value })}
                  placeholder="Contoh: Ganti oli + kampas rem depan"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors disabled:opacity-50 ${
                    serviceActionData.action === 'masuk_servis'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting
                    ? 'Memproses...'
                    : serviceActionData.action === 'masuk_servis'
                    ? 'Kirim ke Bengkel'
                    : 'Konfirmasi Selesai Servis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: HAPUS UNIT (PROTEKSI SEWA AKTIF)                  */}
      {/* ======================================================== */}
      {isDeleteModalOpen && activeUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Hapus Unit Fisik?</h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini akan menghapus unit dan data pelacakannya.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Kode Unit:</span>
                <span className="font-mono font-bold text-slate-900">{activeUnit.kodeUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor Plat:</span>
                <span className="font-mono text-slate-800">{activeUnit.nomorPlat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Model:</span>
                <span className="font-semibold text-slate-800">{activeUnit.namaModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Lacak:</span>
                <span className="capitalize font-semibold text-slate-800">{activeUnit.statusPosisi || 'parkir'}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitDelete}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
