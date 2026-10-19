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
  Calculator,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';

export interface MotorModelItem {
  id: number;
  namaModel: string;
  kategori: string;
  harga1Hari: number;
  harga1Minggu: number;
  harga2Minggu: number;
  harga12Jam: number;
  harga9Jam: number;
  harga6Jam: number;
  harga3Jam: number;
  dendaHarianPerJam: number;
  fasilitas: string | null;
  spesifikasi: string | null;
  imageUrl: string | null;
  isActive: boolean | null;
  createdAt: string | null;
  totalUnits?: number;
}

const CATEGORIES = ['Matic', 'Sport', 'Trail', 'Retro'] as const;

export default function MotorModelManager() {
  const [models, setModels] = useState<MotorModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<MotorModelItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    namaModel: '',
    kategori: 'Matic',
    harga1Hari: 85000,
    harga1Minggu: 510000,
    harga2Minggu: 935000,
    harga12Jam: 65000,
    harga9Jam: 55000,
    harga6Jam: 45000,
    harga3Jam: 30000,
    dendaHarianPerJam: 20000,
    fasilitas: '2 Helm SNI + Jas Hujan',
    spesifikasi: 'Mesin irit injeksi, bagasi muat helm, USB charger port',
    imageUrl: '',
    isActive: true,
  });

  // Simulator State
  const [simModelId, setSimModelId] = useState<number | null>(null);
  const [simDuration, setSimDuration] = useState<string>('1_hari');
  const [simLateMinutes, setSimLateMinutes] = useState<number>(0);

  // Fetch models from Cloud SQL PostgreSQL API for manual actions
  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/motor-models');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat katalog model motor');
      }
      setModels(json.data || []);
      if (json.data && json.data.length > 0) {
        setSimModelId((prev) => prev || json.data[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data dari PostgreSQL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch('/api/motor-models')
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          setModels(json.data || []);
          if (json.data && json.data.length > 0) {
            setSimModelId((prev) => prev || json.data[0].id);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Gagal memuat katalog model motor');
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Flash message helper
  const notifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Auto calculate multi-tier prices with thousand rounding rule
  const handleAutoCalculateRates = (baseDailyRate: number) => {
    const h1Hari = Math.round(Number(baseDailyRate || 0) / 1000) * 1000;
    const h1Minggu = Math.round((h1Hari * 6) / 1000) * 1000; // Promo mingguan bayar 6 hari
    const h2Minggu = Math.round((h1Hari * 11) / 1000) * 1000; // Promo 2 minggu bayar 11 hari
    const h12Jam = Math.round((h1Hari * 0.75) / 1000) * 1000;
    const h9Jam = Math.round((h1Hari * 0.65) / 1000) * 1000;
    const h6Jam = Math.round((h1Hari * 0.5) / 1000) * 1000;
    const h3Jam = Math.round((h1Hari * 0.35) / 1000) * 1000;

    setFormData((prev) => ({
      ...prev,
      harga1Hari: h1Hari,
      harga1Minggu: h1Minggu,
      harga2Minggu: h2Minggu,
      harga12Jam: h12Jam,
      harga9Jam: h9Jam,
      harga6Jam: h6Jam,
      harga3Jam: h3Jam,
      dendaHarianPerJam: 20000, // Standar D-27
    }));
  };

  const openCreateModal = () => {
    setEditingModel(null);
    setFormData({
      namaModel: '',
      kategori: 'Matic',
      harga1Hari: 85000,
      harga1Minggu: 510000,
      harga2Minggu: 935000,
      harga12Jam: 65000,
      harga9Jam: 55000,
      harga6Jam: 45000,
      harga3Jam: 30000,
      dendaHarianPerJam: 20000,
      fasilitas: '2 Helm SNI + Jas Hujan',
      spesifikasi: 'Mesin irit injeksi, bagasi luas, USB charging',
      imageUrl: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (model: MotorModelItem) => {
    setEditingModel(model);
    setFormData({
      namaModel: model.namaModel,
      kategori: model.kategori,
      harga1Hari: model.harga1Hari,
      harga1Minggu: model.harga1Minggu,
      harga2Minggu: model.harga2Minggu,
      harga12Jam: model.harga12Jam,
      harga9Jam: model.harga9Jam,
      harga6Jam: model.harga6Jam,
      harga3Jam: model.harga3Jam,
      dendaHarianPerJam: model.dendaHarianPerJam,
      fasilitas: model.fasilitas || '2 Helm SNI + Jas Hujan',
      spesifikasi: model.spesifikasi || '',
      imageUrl: model.imageUrl || '',
      isActive: model.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingModel ? `/api/motor-models/${editingModel.id}` : '/api/motor-models';
      const method = editingModel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan model motor');
      }

      notifySuccess(
        editingModel
          ? `Model motor "${formData.namaModel}" berhasil diperbarui!`
          : `Model motor "${formData.namaModel}" berhasil ditambahkan ke database PostgreSQL!`
      );
      setIsModalOpen(false);
      fetchModels();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (model: MotorModelItem) => {
    const confirmText = prompt(
      `Ketik "HAPUS" untuk mengonfirmasi penghapusan model "${model.namaModel}".\nJika memiliki unit armada fisik, status akan otomatis dinonaktifkan (soft-delete).`
    );
    if (confirmText !== 'HAPUS') return;

    try {
      const res = await fetch(`/api/motor-models/${model.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus model');
      }

      notifySuccess(json.message || 'Model motor berhasil diproses');
      fetchModels();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // Filter models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchCat = selectedCategory === 'Semua' || m.kategori.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        m.namaModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.spesifikasi && m.spesifikasi.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [models, selectedCategory, searchQuery]);

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Simulator model
  const activeSimModel = useMemo(() => {
    return models.find((m) => m.id === simModelId) || models[0];
  }, [models, simModelId]);

  // Simulator calculation according to D-18 and D-27
  const simulationResult = useMemo(() => {
    if (!activeSimModel) return null;

    let baseTariff = 0;
    let label = '';
    let denda = 0;
    let dendaNote = '';

    switch (simDuration) {
      case '1_hari':
        baseTariff = activeSimModel.harga1Hari;
        label = '1 Hari (24 Jam) — Utama';
        if (simLateMinutes > 90) {
          const lateHours = Math.ceil((simLateMinutes - 90) / 60);
          denda = lateHours * activeSimModel.dendaHarianPerJam;
          dendaNote = `Terlambat ${simLateMinutes} mnt (> toleransi 90 mnt). Dikenakan ${lateHours} jam denda harian @${formatRupiah(activeSimModel.dendaHarianPerJam)}.`;
        } else if (simLateMinutes > 0) {
          dendaNote = `Terlambat ${simLateMinutes} mnt masih dalam batas toleransi sewa harian (90 mnt). Denda = Rp0.`;
        }
        break;
      case '1_minggu':
        baseTariff = activeSimModel.harga1Minggu;
        label = '1 Minggu (7 Hari)';
        if (simLateMinutes > 90) {
          const lateHours = Math.ceil((simLateMinutes - 90) / 60);
          denda = lateHours * activeSimModel.dendaHarianPerJam;
          dendaNote = `Terlambat ${simLateMinutes} mnt. Denda = ${lateHours} jam x ${formatRupiah(activeSimModel.dendaHarianPerJam)}.`;
        }
        break;
      case '2_minggu':
        baseTariff = activeSimModel.harga2Minggu;
        label = '2 Minggu (14 Hari)';
        if (simLateMinutes > 90) {
          const lateHours = Math.ceil((simLateMinutes - 90) / 60);
          denda = lateHours * activeSimModel.dendaHarianPerJam;
          dendaNote = `Terlambat ${simLateMinutes} mnt. Denda = ${lateHours} jam x ${formatRupiah(activeSimModel.dendaHarianPerJam)}.`;
        }
        break;
      case '12_jam':
        baseTariff = activeSimModel.harga12Jam;
        label = 'ShortRent 12 Jam';
        if (simLateMinutes >= 60) {
          const lateHours = Math.ceil(simLateMinutes / 60);
          denda = lateHours * activeSimModel.dendaHarianPerJam;
          dendaNote = `Sesuai D-27: ShortRent 12 Jam telat >= 60 mnt dikenakan denda setara denda harian (${lateHours} jam @${formatRupiah(activeSimModel.dendaHarianPerJam)}).`;
        }
        break;
      case '9_jam':
        baseTariff = activeSimModel.harga9Jam;
        label = 'ShortRent 9 Jam';
        if (simLateMinutes >= 60) {
          denda = activeSimModel.harga12Jam - activeSimModel.harga9Jam;
          dendaNote = `Sesuai D-27: ShortRent 9 Jam telat >= 60 mnt step-up naik ke tarif 12 Jam (+${formatRupiah(denda)}).`;
        }
        break;
      case '6_jam':
        baseTariff = activeSimModel.harga6Jam;
        label = 'ShortRent 6 Jam';
        if (simLateMinutes >= 60) {
          denda = activeSimModel.harga9Jam - activeSimModel.harga6Jam;
          dendaNote = `Sesuai D-27: ShortRent 6 Jam telat >= 60 mnt step-up naik ke tarif 9 Jam (+${formatRupiah(denda)}).`;
        }
        break;
      case '3_jam':
        baseTariff = activeSimModel.harga3Jam;
        label = 'ShortRent 3 Jam';
        if (simLateMinutes >= 60) {
          denda = activeSimModel.harga6Jam - activeSimModel.harga3Jam;
          dendaNote = `Sesuai D-27: ShortRent 3 Jam telat >= 60 mnt step-up naik ke tarif 6 Jam (+${formatRupiah(denda)}).`;
        }
        break;
      default:
        baseTariff = activeSimModel.harga1Hari;
        label = '1 Hari';
    }

    return {
      modelName: activeSimModel.namaModel,
      kategori: activeSimModel.kategori,
      durationLabel: label,
      baseTariff,
      denda,
      dendaNote,
      totalPayment: baseTariff + denda,
    };
  }, [activeSimModel, simDuration, simLateMinutes]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cloud SQL PostgreSQL · React 19 Engine (TASK-003)
          </div>
          <h2 className="text-xl md:text-2xl font-bold mt-1 text-white">
            Katalog Model & Multi-Tier Tarif Motor
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Kelola model kendaraan, klasifikasi kategori (Matic, Sport, Trail, Retro), serta kalkulasi
            multi-tier tarif harian & ShortRent dengan pembulatan ribuan otomatis sesuai aturan{' '}
            <strong className="text-white">D-18</strong> & <strong className="text-white">D-27</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchModels}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
            title="Refresh data dari database PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Model Baru
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg text-sm flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Kategori:
          </span>
          {['Semua', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari model motor atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Models Grid & Multi-Tier Matrix */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Menghubungkan ke Cloud SQL PostgreSQL & memuat data model motor...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Tidak ada model motor yang sesuai</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'Semua'
              ? 'Coba ganti filter kategori atau kata kunci pencarian.'
              : 'Belum ada model motor di database. Silakan klik "Tambah Model Baru" untuk membuat katalog.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah Model Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm ${
                model.isActive === false ? 'border-slate-300 opacity-75' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                    <Bike className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{model.namaModel}</h3>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                          model.kategori === 'Matic'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : model.kategori === 'Sport'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : model.kategori === 'Trail'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {model.kategori}
                      </span>
                      {model.isActive === false ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded">
                          Nonaktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                          Aktif
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded">
                        {model.totalUnits || 0} Unit Fisik Terdaftar
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <strong className="text-slate-700">Fasilitas:</strong> {model.fasilitas || '2 Helm SNI + Jas Hujan'}{' '}
                      · <strong className="text-slate-700">Spesifikasi:</strong> {model.spesifikasi || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  <button
                    onClick={() => {
                      setSimModelId(model.id);
                      const simEl = document.getElementById('rental-simulator');
                      if (simEl) simEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Uji simulator kalkulasi sewa"
                  >
                    <Calculator className="w-3.5 h-3.5" /> Simulasi
                  </button>
                  <button
                    onClick={() => openEditModal(model)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors border border-blue-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Tarif
                  </button>
                  <button
                    onClick={() => handleDelete(model)}
                    className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition-colors border border-rose-200"
                    title="Hapus atau nonaktifkan model"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>

              {/* Multi-Tier Tariff Strip (D-18) */}
              <div className="bg-slate-50/70 p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center border-t border-slate-100">
                {/* 1 Hari (Utama) */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 col-span-2 sm:col-span-1 lg:col-span-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> 1 Hari (24 Jam) · Utama
                  </span>
                  <div className="text-base font-extrabold text-emerald-900 mt-0.5">
                    {formatRupiah(model.harga1Hari)}
                  </div>
                  <span className="text-[10px] text-emerald-700">Tampilan Utama Publik</span>
                </div>

                {/* 1 Minggu */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">1 Minggu</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga1Minggu)}</div>
                  <span className="text-[9px] text-slate-400">7 hari sewa</span>
                </div>

                {/* 2 Minggu */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">2 Minggu</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga2Minggu)}</div>
                  <span className="text-[9px] text-slate-400">14 hari sewa</span>
                </div>

                {/* 12 Jam */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">12 Jam</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga12Jam)}</div>
                  <span className="text-[9px] text-slate-400">ShortRent</span>
                </div>

                {/* 9 Jam */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">9 Jam</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga9Jam)}</div>
                  <span className="text-[9px] text-slate-400">ShortRent</span>
                </div>

                {/* 6 Jam */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">6 Jam</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga6Jam)}</div>
                  <span className="text-[9px] text-slate-400">ShortRent</span>
                </div>

                {/* 3 Jam & Denda */}
                <div className="bg-white border border-slate-200 rounded-lg p-2">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">3 Jam</span>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{formatRupiah(model.harga3Jam)}</div>
                  <span className="text-[9px] text-rose-600 font-medium">
                    Denda: {formatRupiah(model.dendaHarianPerJam)}/j
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Simulator / Validator Section (D-18 & D-27 Verifier) */}
      <div id="rental-simulator" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Calculator className="w-4 h-4 text-emerald-600" />
              Simulator Real-Time Multi-Tier & Denda ShortRent
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Verifikasi Logika Perhitungan Tarif & Denda (D-18 & D-27)
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-mono">
            Auto-Step-Up 60 Mnt Activated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Pilih Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Model Motor</label>
            <select
              value={simModelId || ''}
              onChange={(e) => setSimModelId(Number(e.target.value))}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.namaModel} ({m.kategori}) — 1 Hari: {formatRupiah(m.harga1Hari)}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Durasi Sewa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan Durasi Sewa (D-18)</label>
            <select
              value={simDuration}
              onChange={(e) => setSimDuration(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <optgroup label="Kategori Harian">
                <option value="1_hari">1 Hari (24 Jam) — Tampilan Utama</option>
                <option value="1_minggu">1 Minggu (7 Hari)</option>
                <option value="2_minggu">2 Minggu (14 Hari)</option>
              </optgroup>
              <optgroup label="Kategori Jam (ShortRent)">
                <option value="12_jam">12 Jam</option>
                <option value="9_jam">9 Jam</option>
                <option value="6_jam">6 Jam</option>
                <option value="3_jam">3 Jam</option>
              </optgroup>
            </select>
          </div>

          {/* Simulasi Keterlambatan Pengembalian */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Simulasi Keterlambatan (Menit)</label>
              <span className="text-xs font-mono font-bold text-slate-900">{simLateMinutes} Menit</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="15"
              value={simLateMinutes}
              onChange={(e) => setSimLateMinutes(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0 mnt (Tepat)</span>
              <span>60 mnt (Step-up)</span>
              <span>90 mnt (Toleransi Harian)</span>
              <span>180 mnt</span>
            </div>
          </div>
        </div>

        {/* Calculation Result Card */}
        {simulationResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Model Terpilih</span>
                <div className="text-sm font-bold text-slate-900">{simulationResult.modelName}</div>
                <span className="text-xs text-slate-500">{simulationResult.durationLabel}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Tarif Pokok Sewa</span>
                <div className="text-base font-extrabold text-slate-900">
                  {formatRupiah(simulationResult.baseTariff)}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Denda Keterlambatan</span>
                <div
                  className={`text-base font-extrabold ${
                    simulationResult.denda > 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {formatRupiah(simulationResult.denda)}
                </div>
                {simulationResult.dendaNote && (
                  <p className="text-[11px] text-slate-600 mt-0.5">{simulationResult.dendaNote}</p>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-800">Total Tagihan Final</span>
                <div className="text-lg font-black text-emerald-800 font-mono">
                  {formatRupiah(simulationResult.totalPayment)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Model Motor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingModel ? 'Edit Model & Tarif Motor' : 'Tambah Model Motor Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi multi-tier tarif dengan aturan pembulatan ribuan (Cloud SQL PostgreSQL).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> 1. Informasi Dasar Kendaraan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Model Motor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Honda Vario 160 ABS"
                      value={formData.namaModel}
                      onChange={(e) => setFormData({ ...formData, namaModel: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori Kendaraan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fasilitas Standar</label>
                    <input
                      type="text"
                      placeholder="2 Helm SNI + Jas Hujan"
                      value={formData.fasilitas}
                      onChange={(e) => setFormData({ ...formData, fasilitas: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Spesifikasi Singkat</label>
                    <input
                      type="text"
                      placeholder="160cc, Keyless, Bagasi Luas"
                      value={formData.spesifikasi}
                      onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Tier Tariffs Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 2. Penetapan Multi-Tier Tarif (D-18)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAutoCalculateRates(formData.harga1Hari)}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Hitung Otomatis Multi-Tier (Ribuan)
                  </button>
                </div>

                {/* Tarif 1 Hari (Utama) */}
                <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Tarif 1 Hari (24 Jam) — Utama
                    </label>
                    <span className="text-[10px] text-emerald-700 font-medium">Basis hitungan otomatis</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      step="1000"
                      value={formData.harga1Hari}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, harga1Hari: val });
                      }}
                      className="w-full text-sm font-bold pl-10 pr-3 py-2 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Tarif ini menjadi patokan utama di katalog publik. Klik tombol di atas untuk sinkronisasi otomatis
                    tier mingguan dan jam.
                  </p>
                </div>

                {/* Tier Harian Panjang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif 1 Minggu (7 Hari)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga1Minggu}
                        onChange={(e) => setFormData({ ...formData, harga1Minggu: Number(e.target.value) })}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif 2 Minggu (14 Hari)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga2Minggu}
                        onChange={(e) => setFormData({ ...formData, harga2Minggu: Number(e.target.value) })}
                        className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Tier ShortRent Jam */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">12 Jam</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga12Jam}
                        onChange={(e) => setFormData({ ...formData, harga12Jam: Number(e.target.value) })}
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">9 Jam</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga9Jam}
                        onChange={(e) => setFormData({ ...formData, harga9Jam: Number(e.target.value) })}
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">6 Jam</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga6Jam}
                        onChange={(e) => setFormData({ ...formData, harga6Jam: Number(e.target.value) })}
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">3 Jam</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Rp</span>
                      <input
                        type="number"
                        step="1000"
                        value={formData.harga3Jam}
                        onChange={(e) => setFormData({ ...formData, harga3Jam: Number(e.target.value) })}
                        className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Denda Harian Per Jam */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-800">Denda Keterlambatan Per Jam</span>
                    <p className="text-[11px] text-slate-500">
                      Standar D-27: Default Rp20.000/jam (berlaku untuk sewa harian & ShortRent 12 Jam).
                    </p>
                  </div>
                  <div className="relative min-w-[160px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
                    <input
                      type="number"
                      step="1000"
                      value={formData.dendaHarianPerJam}
                      onChange={(e) => setFormData({ ...formData, dendaHarianPerJam: Number(e.target.value) })}
                      className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold bg-white"
                    />
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_toggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active_toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Status Model Aktif (Tampil di form pemesanan pelanggan & dropdown admin)
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {editingModel ? 'Simpan Perubahan' : 'Buat Model Motor'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
