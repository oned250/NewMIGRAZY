'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Bike,
  MapPin,
  Calendar,
  User,
  CreditCard,
  X,
  Check,
  Ban,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  Layers,
  FileText,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

export interface BookingItem {
  id: number;
  noBooking: string;
  namaPenyewa: string;
  tandaPelanggan: 'baru' | 'langganan';
  jenisIdPendukung: string;
  poolArea: 'malang' | 'batu';
  alamatPengantaran: string | null;
  alamatPenjemputan: string | null;
  motorId: number;
  unitId: number | null;
  snapshotNamaMotor: string | null;
  snapshotKodeUnit: string | null;
  jamTanggalMulai: string;
  jamTanggalSelesai: string;
  startEpoch: number;
  endEpoch: number;
  status: 'Booking' | 'Approve' | 'Disewa' | 'Selesai' | 'Reject' | 'Cancel';
  kategoriTarif: string;
  pilihanDurasi: string;
  totalBiaya: number;
  dendaAkhir: number | null;
  dendaKeterangan: string | null;
  riwayatTukarUnit: string | null;
  disewaAt: string | null;
  selesaiAt: string | null;
  luarJamOperasional: boolean | null;
  createdAt: string | null;
  // Joins
  namaModel?: string;
  kategori?: string;
  dendaHarianPerJam?: number;
  unitKode?: string | null;
  unitPlat?: string | null;
  unitWarna?: string | null;
}

export interface AvailableUnitOption {
  id: number;
  kodeUnit: string;
  nomorPlat: string;
  warna: string;
  poolDefault: string;
  statusServis: string;
  kmTerakhir: number;
  isAvailable: boolean;
  availabilityReason: string;
}

export interface MotorModelOption {
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
}

function formatRp(val: number) {
  return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}

export default function BookingStateMachineManager() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [models, setModels] = useState<MotorModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('semua');
  const [selectedPool, setSelectedPool] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isSelesaiModalOpen, setIsSelesaiModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTukarUnitModalOpen, setIsTukarUnitModalOpen] = useState(false);

  // Selected Booking for actions
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Unit Availability state for Approve modal
  const [availableUnits, setAvailableUnits] = useState<AvailableUnitOption[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  // Selesai Form state (with penalty calculator)
  const [selesaiForm, setSelesaiForm] = useState({
    actualSelesaiAt: '',
    lateMinutes: 0,
    estimatedPenalty: 0,
    penaltyNote: '',
  });

  // Cancel / Reject Form state
  const [cancelForm, setCancelForm] = useState({
    action: 'reject' as 'reject' | 'cancel',
    alasan: '',
  });

  // Tukar Unit Form state
  const [tukarForm, setTukarForm] = useState({
    newUnitId: '',
    alasanTukar: '',
  });

  // Create Booking Form state
  const [createForm, setCreateForm] = useState({
    namaPenyewa: '',
    tandaPelanggan: 'baru' as 'baru' | 'langganan',
    jenisIdPendukung: 'SIM_C',
    poolArea: 'malang' as 'malang' | 'batu',
    alamatPengantaran: '',
    alamatPenjemputan: '',
    motorId: '',
    jamTanggalMulai: '',
    jamTanggalSelesai: '',
    pilihanDurasi: '1_hari',
    luarJamOperasional: false,
  });

  // Fetch bookings & models
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resB, resM] = await Promise.all([
        fetch('/api/penyewaan'),
        fetch('/api/motor-models'),
      ]);

      const jsonB = await resB.json();
      const jsonM = await resM.json();

      if (jsonB.success) setBookings(jsonB.data || []);
      else throw new Error(jsonB.error || 'Gagal mengambil data transaksi');

      if (jsonM.success) setModels(jsonM.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([fetch('/api/penyewaan'), fetch('/api/motor-models')])
      .then(async ([resB, resM]) => {
        const jsonB = await resB.json();
        const jsonM = await resM.json();
        if (!ignore) {
          if (jsonB.success) setBookings(jsonB.data || []);
          if (jsonM.success) setModels(jsonM.data || []);
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

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeStatusFilter !== 'semua' && b.status !== activeStatusFilter) {
        return false;
      }
      if (selectedPool !== 'semua' && b.poolArea !== selectedPool) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesNo = b.noBooking.toLowerCase().includes(q);
        const matchesNama = b.namaPenyewa.toLowerCase().includes(q);
        const matchesMotor = b.snapshotNamaMotor?.toLowerCase().includes(q);
        const matchesKode = b.snapshotKodeUnit?.toLowerCase().includes(q);
        const matchesPlat = b.unitPlat?.toLowerCase().includes(q);
        if (!matchesNo && !matchesNama && !matchesMotor && !matchesKode && !matchesPlat) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, activeStatusFilter, selectedPool, searchQuery]);

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const booking = bookings.filter((b) => b.status === 'Booking').length;
    const approve = bookings.filter((b) => b.status === 'Approve').length;
    const disewa = bookings.filter((b) => b.status === 'Disewa').length;
    const selesai = bookings.filter((b) => b.status === 'Selesai').length;
    const batal = bookings.filter((b) => b.status === 'Reject' || b.status === 'Cancel').length;
    return { total, booking, approve, disewa, selesai, batal };
  }, [bookings]);

  // Open Approve Modal (Check available units with 90m buffer AC-01)
  const handleOpenApproveModal = async (booking: BookingItem) => {
    setSelectedBooking(booking);
    setSelectedUnitId('');
    setIsApproveModalOpen(true);
    setLoadingUnits(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/penyewaan/available-units?motorId=${booking.motorId}&startEpoch=${booking.startEpoch}&endEpoch=${booking.endEpoch}&currentBookingId=${booking.id}`
      );
      const json = await res.json();
      if (json.success) {
        setAvailableUnits(json.data || []);
        // Auto select first available unit
        const firstAvail = (json.data as AvailableUnitOption[]).find((u) => u.isAvailable);
        if (firstAvail) setSelectedUnitId(String(firstAvail.id));
      } else {
        throw new Error(json.error || 'Gagal memuat unit tersedia');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingUnits(false);
    }
  };

  // Submit Approve (AC-01)
  const handleSubmitApprove = async () => {
    if (!selectedBooking || !selectedUnitId) {
      setError('Pilih unit fisik yang tersedia.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/penyewaan/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          unitId: selectedUnitId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyetujui pesanan');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsApproveModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Disewa Action (Serah Terima Kunci)
  const handleActionDisewa = async (booking: BookingItem) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/penyewaan/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disewa' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah status disewa');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Selesai Modal (AC-03: Real-time penalty calculation)
  const handleOpenSelesaiModal = (booking: BookingItem) => {
    setSelectedBooking(booking);
    const nowIso = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    const nowEpoch = Math.floor(new Date().getTime() / 1000);
    const lateSec = nowEpoch - booking.endEpoch;
    const lateMin = Math.floor(lateSec / 60);

    const modelRate = models.find((m) => m.id === booking.motorId);
    let estDenda = 0;
    let note = 'Tepat Waktu (Bebas Denda)';

    if (lateMin > 0 && modelRate) {
      if (booking.kategoriTarif === 'jam') {
        if (lateMin >= 60) {
          if (booking.pilihanDurasi === '3_jam') {
            estDenda = Math.max(0, modelRate.harga6Jam - modelRate.harga3Jam);
            note = `Naik Tingkat ke Paket 6 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (booking.pilihanDurasi === '6_jam') {
            estDenda = Math.max(0, modelRate.harga9Jam - modelRate.harga6Jam);
            note = `Naik Tingkat ke Paket 9 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (booking.pilihanDurasi === '9_jam') {
            estDenda = Math.max(0, modelRate.harga12Jam - modelRate.harga9Jam);
            note = `Naik Tingkat ke Paket 12 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (booking.pilihanDurasi === '12_jam') {
            const hrs = Math.ceil(lateMin / 60);
            estDenda = hrs * modelRate.dendaHarianPerJam;
            note = `Tarif 12 Jam: ${hrs} jam @ Rp ${modelRate.dendaHarianPerJam.toLocaleString('id-ID')}`;
          }
        } else if (lateMin > 15) {
          estDenda = Math.round(modelRate.dendaHarianPerJam / 2);
          note = `Toleransi lewat 15m (+Rp ${estDenda.toLocaleString('id-ID')})`;
        } else {
          note = `Toleransi < 15 menit (Bebas Denda)`;
        }
      } else {
        const hrs = Math.ceil(lateMin / 60);
        estDenda = hrs * modelRate.dendaHarianPerJam;
        note = `Keterlambatan Harian ${hrs} jam @ Rp ${modelRate.dendaHarianPerJam.toLocaleString('id-ID')}/jam`;
      }
    }

    setSelesaiForm({
      actualSelesaiAt: nowIso,
      lateMinutes: Math.max(0, lateMin),
      estimatedPenalty: estDenda,
      penaltyNote: note,
    });

    setIsSelesaiModalOpen(true);
  };

  // Recalculate penalty when date changes in Selesai modal
  const handleSelesaiDateChange = (isoVal: string) => {
    if (!selectedBooking) return;
    const targetEpoch = Math.floor(new Date(isoVal).getTime() / 1000);
    const lateSec = targetEpoch - selectedBooking.endEpoch;
    const lateMin = Math.floor(lateSec / 60);

    const modelRate = models.find((m) => m.id === selectedBooking.motorId);
    let estDenda = 0;
    let note = 'Tepat Waktu (Bebas Denda)';

    if (lateMin > 0 && modelRate) {
      if (selectedBooking.kategoriTarif === 'jam') {
        if (lateMin >= 60) {
          if (selectedBooking.pilihanDurasi === '3_jam') {
            estDenda = Math.max(0, modelRate.harga6Jam - modelRate.harga3Jam);
            note = `Naik Tingkat ke Paket 6 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (selectedBooking.pilihanDurasi === '6_jam') {
            estDenda = Math.max(0, modelRate.harga9Jam - modelRate.harga6Jam);
            note = `Naik Tingkat ke Paket 9 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (selectedBooking.pilihanDurasi === '9_jam') {
            estDenda = Math.max(0, modelRate.harga12Jam - modelRate.harga9Jam);
            note = `Naik Tingkat ke Paket 12 Jam (+Rp ${estDenda.toLocaleString('id-ID')})`;
          } else if (selectedBooking.pilihanDurasi === '12_jam') {
            const hrs = Math.ceil(lateMin / 60);
            estDenda = hrs * modelRate.dendaHarianPerJam;
            note = `Tarif 12 Jam: ${hrs} jam @ Rp ${modelRate.dendaHarianPerJam.toLocaleString('id-ID')}`;
          }
        } else if (lateMin > 15) {
          estDenda = Math.round(modelRate.dendaHarianPerJam / 2);
          note = `Toleransi lewat 15m (+Rp ${estDenda.toLocaleString('id-ID')})`;
        } else {
          note = `Toleransi < 15 menit (Bebas Denda)`;
        }
      } else {
        const hrs = Math.ceil(lateMin / 60);
        estDenda = hrs * modelRate.dendaHarianPerJam;
        note = `Keterlambatan Harian ${hrs} jam @ Rp ${modelRate.dendaHarianPerJam.toLocaleString('id-ID')}/jam`;
      }
    }

    setSelesaiForm({
      actualSelesaiAt: isoVal,
      lateMinutes: Math.max(0, lateMin),
      estimatedPenalty: estDenda,
      penaltyNote: note,
    });
  };

  // Submit Selesai
  const handleSubmitSelesai = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/penyewaan/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'selesai',
          actualSelesaiAt: new Date(selesaiForm.actualSelesaiAt).toISOString(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyelesaikan sewa');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsSelesaiModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Cancel / Reject Modal (AC-02: Only if status != Disewa & Selesai)
  const handleOpenCancelModal = (booking: BookingItem, actionType: 'reject' | 'cancel') => {
    if (booking.status === 'Disewa') {
      setError('Pelanggaran AC-02: Pesanan berstatus Disewa tidak dapat dibatalkan saat motor disewa!');
      return;
    }
    setSelectedBooking(booking);
    setCancelForm({
      action: actionType,
      alasan: '',
    });
    setIsCancelModalOpen(true);
  };

  // Submit Cancel / Reject
  const handleSubmitCancel = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/penyewaan/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: cancelForm.action,
          alasanBatal: cancelForm.alasan,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membatalkan pesanan');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsCancelModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Create New Booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.namaPenyewa || !createForm.motorId || !createForm.jamTanggalMulai || !createForm.jamTanggalSelesai) {
      setError('Semua kolom bertanda bintang wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/penyewaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal membuat pesanan');
      }

      setSuccessMessage(json.message);
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsAddModalOpen(false);
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
              TASK-005 — State Machine Transaksi (BR-02 & D-27)
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              <Lock className="w-3 h-3 text-amber-600" />
              AC-01 Anti Double-Booking + Buffer 90m
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight flex items-center gap-2.5">
            Manajemen Transaksi & Siklus Pesanan
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            State Machine 4 Status Resmi:{' '}
            <strong className="text-slate-800">Booking</strong> <span className="text-slate-400">➔</span>{' '}
            <strong className="text-blue-700">Approve Booking</strong> (Kunci Unit & Buffer 90m){' '}
            <span className="text-slate-400">➔</span>{' '}
            <strong className="text-purple-700">Disewa</strong> (Kunci di Penyewa){' '}
            <span className="text-slate-400">➔</span>{' '}
            <strong className="text-emerald-700">Selesai</strong> (Kalkulasi Denda Otomatis & Unit Bebas).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh data transaksi"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={() => {
              setCreateForm({
                namaPenyewa: '',
                tandaPelanggan: 'baru',
                jenisIdPendukung: 'SIM_C',
                poolArea: 'malang',
                alamatPengantaran: '',
                alamatPenjemputan: '',
                motorId: models.length > 0 ? String(models[0].id) : '',
                jamTanggalMulai: new Date().toISOString().slice(0, 16),
                jamTanggalSelesai: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                pilihanDurasi: '1_hari',
                luarJamOperasional: false,
              });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Pesanan Baru</span>
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

      {error && !isAddModalOpen && !isApproveModalOpen && !isSelesaiModalOpen && !isCancelModalOpen && (
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

      {/* METRICS / STATE STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveStatusFilter('semua')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'semua'
              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'semua' ? 'text-slate-300' : 'text-slate-500'}`}>
            Semua Transaksi
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.total}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Total Pesanan</span>
        </button>

        <button
          onClick={() => setActiveStatusFilter('Booking')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'Booking'
              ? 'bg-amber-500 border-amber-600 text-white shadow-xs'
              : 'bg-amber-50/70 border-amber-200 hover:border-amber-300 text-amber-900'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'Booking' ? 'text-amber-100' : 'text-amber-700'}`}>
            1. Booking (Baru)
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.booking}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Perlu Disetujui</span>
        </button>

        <button
          onClick={() => setActiveStatusFilter('Approve')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'Approve'
              ? 'bg-blue-600 border-blue-700 text-white shadow-xs'
              : 'bg-blue-50/70 border-blue-200 hover:border-blue-300 text-blue-900'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'Approve' ? 'text-blue-100' : 'text-blue-700'}`}>
            2. Approve Booking
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.approve}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Unit Terkunci</span>
        </button>

        <button
          onClick={() => setActiveStatusFilter('Disewa')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'Disewa'
              ? 'bg-purple-600 border-purple-700 text-white shadow-xs'
              : 'bg-purple-50/70 border-purple-200 hover:border-purple-300 text-purple-900'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'Disewa' ? 'text-purple-100' : 'text-purple-700'}`}>
            3. Disewa (Jalan)
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.disewa}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Di Tangan Pelanggan</span>
        </button>

        <button
          onClick={() => setActiveStatusFilter('Selesai')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'Selesai'
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 text-emerald-900'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'Selesai' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            4. Selesai
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.selesai}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Unit Kembali Parkir</span>
        </button>

        <button
          onClick={() => setActiveStatusFilter('Reject')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeStatusFilter === 'Reject' || activeStatusFilter === 'Cancel'
              ? 'bg-slate-700 border-slate-800 text-white shadow-xs'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
          }`}
        >
          <span className={`text-xs block ${activeStatusFilter === 'Reject' ? 'text-slate-200' : 'text-slate-500'}`}>
            Tolak / Batal
          </span>
          <span className="text-2xl font-bold mt-1 block">{metrics.batal}</span>
          <span className="text-[10px] opacity-75 mt-0.5 block">Sebelum Disewa</span>
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
            placeholder="Cari nomor booking (RYK-...), nama penyewa, plat nomor, atau unit..."
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
            value={selectedPool}
            onChange={(e) => setSelectedPool(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="semua">Semua Pool Area</option>
            <option value="malang">Pool Malang</option>
            <option value="batu">Pool Batu</option>
          </select>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="space-y-3.5">
        {filteredBookings.map((b) => {
          const isBooking = b.status === 'Booking';
          const isApprove = b.status === 'Approve';
          const isDisewa = b.status === 'Disewa';
          const isSelesai = b.status === 'Selesai';
          const isCancelled = b.status === 'Reject' || b.status === 'Cancel';

          return (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs hover:shadow-xs ${
                isBooking
                  ? 'border-amber-200'
                  : isApprove
                  ? 'border-blue-200'
                  : isDisewa
                  ? 'border-purple-200'
                  : isSelesai
                  ? 'border-emerald-200'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              {/* Row Top Strip: Status & No Booking */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isBooking
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isApprove
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : isDisewa
                        ? 'bg-purple-100 text-purple-900 border border-purple-300 animate-pulse'
                        : isSelesai
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isBooking && <Clock className="w-3.5 h-3.5 text-amber-700" />}
                    {isApprove && <Lock className="w-3.5 h-3.5 text-blue-700" />}
                    {isDisewa && <KeyRound className="w-3.5 h-3.5 text-purple-700" />}
                    {isSelesai && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    {isCancelled && <Ban className="w-3.5 h-3.5 text-slate-600" />}
                    <span>Status: {b.status.toUpperCase()}</span>
                  </span>

                  {/* No Booking & Tanda Pelanggan */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800">{b.noBooking}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        b.tandaPelanggan === 'langganan'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.tandaPelanggan === 'langganan' ? 'Langganan' : 'Baru'}
                    </span>
                  </div>
                </div>

                {/* Pool & Biaya Summary */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-slate-600 capitalize">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Pool {b.poolArea}
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Biaya</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatRp(b.totalBiaya + (b.dendaAkhir || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Info */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                {/* 1. Pelanggan (UU PDP No NIK) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Penyewa (UU PDP)
                  </span>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    {b.namaPenyewa}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    ID Pendukung: <span className="font-mono font-medium text-slate-800">{b.jenisIdPendukung}</span>
                  </div>
                  {b.alamatPengantaran && (
                    <p className="text-[11px] text-slate-500 truncate" title={b.alamatPengantaran}>
                      Antar: {b.alamatPengantaran}
                    </p>
                  )}
                </div>

                {/* 2. Model & Unit Fisik (AC-01) */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Model & Unit Armada
                  </span>
                  <div className="font-bold text-slate-800 text-sm">{b.snapshotNamaMotor}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {b.snapshotKodeUnit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs shadow-2xs">
                        <Lock className="w-3 h-3 text-amber-400" />
                        Unit {b.snapshotKodeUnit}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                        Unit Belum Dikunci
                      </span>
                    )}
                    {b.unitPlat && <span className="font-mono text-slate-600 font-semibold">{b.unitPlat}</span>}
                  </div>
                  {b.riwayatTukarUnit && (
                    <p className="text-[10px] text-purple-700 bg-purple-50 p-1 rounded mt-1">
                      {b.riwayatTukarUnit}
                    </p>
                  )}
                </div>

                {/* 3. Jadwal Sewa & Durasi */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Jadwal Sewa & Durasi
                  </span>
                  <div className="font-semibold text-slate-800">
                    Durasi: <span className="capitalize">{b.pilihanDurasi.replace('_', ' ')}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Mulai: {b.jamTanggalMulai}</p>
                    <p>Kembali: {b.jamTanggalSelesai}</p>
                  </div>
                </div>

                {/* 4. Denda & Catatan Selesai */}
                <div className="space-y-1 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Status Pengembalian & Denda
                  </span>
                  {b.dendaAkhir && b.dendaAkhir > 0 ? (
                    <div>
                      <span className="font-bold text-rose-600 text-xs">
                        Denda: +{formatRp(b.dendaAkhir)}
                      </span>
                      <p className="text-[10px] text-rose-700 mt-0.5 leading-tight">{b.dendaKeterangan}</p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-600">
                      {b.dendaKeterangan || 'Tidak ada denda tercatat.'}
                    </p>
                  )}
                  {b.selesaiAt && (
                    <p className="text-[10px] text-slate-400">
                      Selesai: {b.selesaiAt.slice(0, 16).replace('T', ' ')}
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION FOOTER — STATE MACHINE TRANSITIONS */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Aksi Transisi Status:</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* AKSI UNTUK STATUS: BOOKING */}
                  {isBooking && (
                    <>
                      <button
                        onClick={() => handleOpenApproveModal(b)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Setujui & Kunci Unit (Approve)
                      </button>
                      <button
                        onClick={() => handleOpenCancelModal(b, 'reject')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Tolak Booking
                      </button>
                    </>
                  )}

                  {/* AKSI UNTUK STATUS: APPROVE */}
                  {isApprove && (
                    <>
                      <button
                        onClick={() => handleActionDisewa(b)}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Serah Terima Kunci (Disewa)
                      </button>
                      <button
                        onClick={() => handleOpenApproveModal(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                        title="Ganti alokasi unit fisik"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ganti Unit
                      </button>
                      <button
                        onClick={() => handleOpenCancelModal(b, 'cancel')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Batalkan Pesanan
                      </button>
                    </>
                  )}

                  {/* AKSI UNTUK STATUS: DISEWA */}
                  {isDisewa && (
                    <>
                      <button
                        onClick={() => handleOpenSelesaiModal(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Kembalikan & Selesaikan (Selesai)
                      </button>

                      {/* AC-02 ENFORCEMENT: REJECT/CANCEL IS FORBIDDEN DURING DISEWA */}
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed select-none"
                        title="Aturan AC-02: Pesanan berstatus DISEWA tidak dapat dibatalkan saat motor berada di tangan penyewa."
                      >
                        <Ban className="w-3.5 h-3.5 text-slate-400" />
                        Batal Dilarang (AC-02)
                      </span>
                    </>
                  )}

                  {/* STATUS: SELESAI ATAU CANCELLED */}
                  {(isSelesai || isCancelled) && (
                    <span className="text-xs text-slate-500 italic">
                      {isSelesai ? 'Siklus transaksi telah selesai sempurna.' : 'Pesanan telah dibatalkan.'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredBookings.length === 0 && !loading && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Belum ada pesanan ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan tombol &quot;Buat Pesanan Baru&quot; untuk memasukkan data sewa pelanggan.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: APPROVE & KUNCI UNIT (AC-01 ANTI DOUBLE-BOOKING) */}
      {/* ======================================================== */}
      {isApproveModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Konfirmasi & Alokasikan Unit Fisik</h3>
                  <p className="text-xs text-slate-500">
                    No Booking: <span className="font-mono font-bold text-slate-800">{selectedBooking.noBooking}</span> ({selectedBooking.namaPenyewa})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Rincian Pesanan */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model Diminta:</span>
                  <span className="font-bold text-slate-900">{selectedBooking.snapshotNamaMotor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jadwal Sewa:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedBooking.jamTanggalMulai} s/d {selectedBooking.jamTanggalSelesai}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Turnaround Buffer (BR-01):</span>
                  <span className="font-semibold text-emerald-700">90 Menit di awal & akhir rentang</span>
                </div>
              </div>

              {/* Daftar Unit Tersedia */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Pilih Unit Armada Fisik Tersedia (Anti Double-Booking AC-01):
                </label>

                {loadingUnits ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    Memeriksa jadwal & buffer 90m seluruh unit fisik...
                  </div>
                ) : availableUnits.length === 0 ? (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    Tidak ada unit fisik yang terdaftar untuk model ini. Daftarkan unit di tab Armada Fisik terlebih dahulu.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUnits.map((unit) => (
                      <label
                        key={unit.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          !unit.isAvailable
                            ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                            : selectedUnitId === String(unit.id)
                            ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="unitSelection"
                            disabled={!unit.isAvailable}
                            value={String(unit.id)}
                            checked={selectedUnitId === String(unit.id)}
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                                {unit.kodeUnit}
                              </span>
                              <span className="font-mono text-xs font-semibold text-slate-800">
                                {unit.nomorPlat}
                              </span>
                              <span className="text-xs text-slate-500">• {unit.warna}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5 capitalize">
                              Pool {unit.poolDefault} • Odometer: {Number(unit.kmTerakhir || 0).toLocaleString('id-ID')} km
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              unit.isAvailable
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {unit.availabilityReason}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan BR-01:</strong> Saat disetujui, unit fisik yang dipilih akan dikunci atomik untuk jadwal ini. Unit lain tidak dapat mengambil pesanan bertabrakan dalam rentang waktu yang sama + 90 menit buffer.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitApprove}
                  disabled={submitting || !selectedUnitId}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Mengunci Unit...' : 'Setujui & Kunci Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SELESAIKAN SEWA (AC-03 KALKULASI DENDA OTOMATIS) */}
      {/* ======================================================== */}
      {isSelesaiModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Penyelesaian Sewa & Denda Otomatis</h3>
                  <p className="text-xs text-slate-500">
                    No: <span className="font-mono font-bold text-slate-800">{selectedBooking.noBooking}</span> • Unit:{' '}
                    <span className="font-mono font-bold text-slate-800">{selectedBooking.snapshotKodeUnit}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelesaiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input Waktu Kembali Aktual */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Waktu Pengembalian Motor Aktual:
                </label>
                <input
                  type="datetime-local"
                  required
                  value={selesaiForm.actualSelesaiAt}
                  onChange={(e) => handleSelesaiDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Jadwal tenggat awal: <strong>{selectedBooking.jamTanggalSelesai}</strong>
                </span>
              </div>

              {/* Rincian Komputasi Denda Otomatis AC-03 */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
                  <span className="text-slate-500">Keterlambatan:</span>
                  <span
                    className={`font-mono font-bold ${
                      selesaiForm.lateMinutes > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {selesaiForm.lateMinutes > 0 ? `${selesaiForm.lateMinutes} Menit` : 'Tepat Waktu (0m)'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Logika Denda (BR-04 & D-27):
                  </span>
                  <p className="text-xs font-medium text-slate-800 bg-white p-2 rounded-lg border border-slate-200">
                    {selesaiForm.penaltyNote}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600 font-semibold">Total Biaya Pokok:</span>
                  <span className="font-bold text-slate-800">{formatRp(selectedBooking.totalBiaya)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-rose-600 font-semibold">
                  <span>Denda Keterlambatan:</span>
                  <span>+{formatRp(selesaiForm.estimatedPenalty)}</span>
                </div>

                <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                  <span>Total Tagihan Akhir:</span>
                  <span className="text-base text-emerald-700">
                    {formatRp(selectedBooking.totalBiaya + selesaiForm.estimatedPenalty)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Otomatisasi Pelepasan Unit:
                </p>
                <p>
                  Setelah diselesaikan, unit <strong>{selectedBooking.snapshotKodeUnit}</strong> otomatis dilepaskan dari modul pelacakan dan kembali berstatus <strong>Parkir di Pool {selectedBooking.poolArea.toUpperCase()}</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSelesaiModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSelesai}
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Memproses Selesai...' : 'Konfirmasi Selesai & Bebaskan Unit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: TOLAK / BATAL PESANAN (AC-02 DUA LANGKAH)       */}
      {/* ======================================================== */}
      {isCancelModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {cancelForm.action === 'reject' ? 'Tolak Pesanan Booking?' : 'Batalkan Pesanan?'}
                </h3>
                <p className="text-xs text-slate-500">
                  Konfirmasi 2 langkah pembatalan sebelum status Disewa.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">No Booking:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBooking.noBooking}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penyewa:</span>
                <span className="font-semibold text-slate-800">{selectedBooking.namaPenyewa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className="font-semibold text-slate-800">{selectedBooking.status}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Alasan Penolakan / Pembatalan:
              </label>
              <textarea
                required
                rows={3}
                value={cancelForm.alasan}
                onChange={(e) => setCancelForm({ ...cancelForm, alasan: e.target.value })}
                placeholder="Contoh: Unit tidak tersedia / Jadwal pelanggan berubah / Permintaan pembatalan penyewa"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-rose-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitCancel}
                disabled={submitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Ya, Batalkan Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BUAT PESANAN BARU (OPERATOR / ADMIN)             */}
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
                  <h3 className="text-lg font-bold text-slate-900">Buat Pesanan Baru (Input Manual)</h3>
                  <p className="text-xs text-slate-500">Membuat transaksi sewa berstatus awal &apos;Booking&apos;</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* DATA PENYEWA (UU PDP COMPLIANT - NO NIK) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Penyewa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.namaPenyewa}
                    onChange={(e) => setCreateForm({ ...createForm, namaPenyewa: e.target.value })}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jenis ID Pendukung (UU PDP) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.jenisIdPendukung}
                    onChange={(e) => setCreateForm({ ...createForm, jenisIdPendukung: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="SIM_C">SIM C (Utama Pengendara Motor)</option>
                    <option value="KTM">KTM (Kartu Tanda Mahasiswa)</option>
                    <option value="SIM_A">SIM A (Surat Izin Mengemudi Mobil)</option>
                    <option value="PASPOR">Paspor (Turis Mancanegara)</option>
                    <option value="NPWP">NPWP</option>
                    <option value="ID_KARYAWAN">Kartu ID Karyawan</option>
                    <option value="LAINNYA">ID Resmi Lainnya</option>
                  </select>
                </div>
              </div>

              {/* POOL & TANDA PELANGGAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pool Lokasi Area <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.poolArea}
                    onChange={(e) => setCreateForm({ ...createForm, poolArea: e.target.value as 'malang' | 'batu' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="malang">Pool Malang Kota</option>
                    <option value="batu">Pool Kota Wisata Batu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Status Pelanggan</label>
                  <select
                    value={createForm.tandaPelanggan}
                    onChange={(e) => setCreateForm({ ...createForm, tandaPelanggan: e.target.value as 'baru' | 'langganan' })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="baru">Pelanggan Baru</option>
                    <option value="langganan">Pelanggan Langganan (Repeat)</option>
                  </select>
                </div>
              </div>

              {/* MODEL MOTOR & DURASI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Model Motor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.motorId}
                    onChange={(e) => setCreateForm({ ...createForm, motorId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <option value="">-- Pilih Model Motor --</option>
                    {models.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.namaModel} ({m.kategori}) - {formatRp(m.harga1Hari)}/hari
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Pilihan Paket Durasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={createForm.pilihanDurasi}
                    onChange={(e) => setCreateForm({ ...createForm, pilihanDurasi: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  >
                    <optgroup label="Paket Harian (Utama)">
                      <option value="1_hari">1 Hari (24 Jam)</option>
                      <option value="1_minggu">1 Minggu (7 Hari)</option>
                      <option value="2_minggu">2 Minggu (14 Hari)</option>
                    </optgroup>
                    <optgroup label="Paket ShortRent (Jam)">
                      <option value="12_jam">12 Jam</option>
                      <option value="9_jam">9 Jam</option>
                      <option value="6_jam">6 Jam</option>
                      <option value="3_jam">3 Jam</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* JADWAL MULAI & SELESAI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jadwal Mulai Sewa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.jamTanggalMulai}
                    onChange={(e) => setCreateForm({ ...createForm, jamTanggalMulai: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jadwal Selesai Sewa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.jamTanggalSelesai}
                    onChange={(e) => setCreateForm({ ...createForm, jamTanggalSelesai: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* ALAMAT ANTAR / JEMPUT (OPSIONAL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Alamat Pengantaran (Opsional)</label>
                  <input
                    type="text"
                    value={createForm.alamatPengantaran}
                    onChange={(e) => setCreateForm({ ...createForm, alamatPengantaran: e.target.value })}
                    placeholder="Contoh: Stasiun Kotabaru Malang"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Alamat Penjemputan (Opsional)</label>
                  <input
                    type="text"
                    value={createForm.alamatPenjemputan}
                    onChange={(e) => setCreateForm({ ...createForm, alamatPenjemputan: e.target.value })}
                    placeholder="Contoh: Hotel Tugu Malang"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Booking Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
