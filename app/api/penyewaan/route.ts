import { NextResponse } from 'next/server';
import { db, penyewaan, motorModels, armadaUnits } from '@/lib/db';
import { eq, desc, asc, and } from 'drizzle-orm';
import { checkAuthHeader } from '@/lib/auth';

// Helper format No Booking: RYK-YYYYMMDD-XXX
function generateNoBooking(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900); // 3 digit
  return `RYK-${y}${m}${d}-${rand}`;
}

// GET /api/penyewaan - List semua transaksi booking & penyewaan
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const pool = searchParams.get('pool');
    const search = searchParams.get('search');

    const query = db
      .select({
        id: penyewaan.id,
        noBooking: penyewaan.noBooking,
        namaPenyewa: penyewaan.namaPenyewa,
        tandaPelanggan: penyewaan.tandaPelanggan,
        jenisIdPendukung: penyewaan.jenisIdPendukung,
        poolArea: penyewaan.poolArea,
        alamatPengantaran: penyewaan.alamatPengantaran,
        alamatPenjemputan: penyewaan.alamatPenjemputan,
        motorId: penyewaan.motorId,
        unitId: penyewaan.unitId,
        snapshotNamaMotor: penyewaan.snapshotNamaMotor,
        snapshotKodeUnit: penyewaan.snapshotKodeUnit,
        jamTanggalMulai: penyewaan.jamTanggalMulai,
        jamTanggalSelesai: penyewaan.jamTanggalSelesai,
        startEpoch: penyewaan.startEpoch,
        endEpoch: penyewaan.endEpoch,
        status: penyewaan.status,
        kategoriTarif: penyewaan.kategoriTarif,
        pilihanDurasi: penyewaan.pilihanDurasi,
        totalBiaya: penyewaan.totalBiaya,
        dendaAkhir: penyewaan.dendaAkhir,
        dendaKeterangan: penyewaan.dendaKeterangan,
        riwayatTukarUnit: penyewaan.riwayatTukarUnit,
        disewaAt: penyewaan.disewaAt,
        selesaiAt: penyewaan.selesaiAt,
        luarJamOperasional: penyewaan.luarJamOperasional,
        createdAt: penyewaan.createdAt,
        // Model relation
        namaModel: motorModels.namaModel,
        kategori: motorModels.kategori,
        imageUrl: motorModels.imageUrl,
        dendaHarianPerJam: motorModels.dendaHarianPerJam,
        // Armada unit relation
        unitKode: armadaUnits.kodeUnit,
        unitPlat: armadaUnits.nomorPlat,
        unitWarna: armadaUnits.warna,
        unitPool: armadaUnits.poolDefault,
      })
      .from(penyewaan)
      .innerJoin(motorModels, eq(penyewaan.motorId, motorModels.id))
      .leftJoin(armadaUnits, eq(penyewaan.unitId, armadaUnits.id))
      .orderBy(desc(penyewaan.id));

    const list = await query;

    let filtered = list;

    if (status && status !== 'semua') {
      filtered = filtered.filter((p) => p.status?.toLowerCase() === status.toLowerCase());
    }

    if (pool && pool !== 'semua') {
      filtered = filtered.filter((p) => p.poolArea?.toLowerCase() === pool.toLowerCase());
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.noBooking.toLowerCase().includes(q) ||
          p.namaPenyewa.toLowerCase().includes(q) ||
          (p.snapshotNamaMotor && p.snapshotNamaMotor.toLowerCase().includes(q)) ||
          (p.snapshotKodeUnit && p.snapshotKodeUnit.toLowerCase().includes(q)) ||
          (p.unitPlat && p.unitPlat.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  } catch (error: any) {
    console.error('Error fetching penyewaan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/penyewaan - Buat pesanan baru (Status awal: 'Booking')
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      namaPenyewa,
      tandaPelanggan = 'baru',
      jenisIdPendukung,
      poolArea = 'malang',
      alamatPengantaran,
      alamatPenjemputan,
      motorId,
      jamTanggalMulai,
      jamTanggalSelesai,
      startEpoch,
      endEpoch,
      pilihanDurasi = '1_hari',
      totalBiayaManual,
      luarJamOperasional = false,
    } = body;

    // Validasi field wajib
    if (!namaPenyewa || !jenisIdPendukung || !motorId || !jamTanggalMulai || !jamTanggalSelesai) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama penyewa, Jenis ID pendukung (UU PDP), Model motor, dan Jadwal mulai/selesai wajib diisi.',
        },
        { status: 400 }
      );
    }

    // Proteksi UU PDP No. 27/2022 (D-21): Dilarang input NIK 16 digit ke dalam database
    const nikRegex = /(?:\d[\s\-]?){16}/;
    if (nikRegex.test(namaPenyewa) || nikRegex.test(alamatPengantaran || '') || nikRegex.test(alamatPenjemputan || '')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pelanggaran Privasi UU PDP No. 27/2022 (D-21): Dilarang memasukkan nomor identitas NIK 16 digit ke dalam sistem.',
        },
        { status: 400 }
      );
    }

    // Ambil data model motor
    const mRes = await db
      .select()
      .from(motorModels)
      .where(eq(motorModels.id, parseInt(motorId, 10)))
      .limit(1);

    if (mRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Model motor tidak ditemukan' }, { status: 404 });
    }
    const model = mRes[0];

    // Hitung biaya resmi di sisi server berdasarkan tarif model motor (K-02)
    const kategoriTarif = ['12_jam', '9_jam', '6_jam', '3_jam'].includes(pilihanDurasi) ? 'jam' : 'harian';
    let serverBiaya = model.harga1Hari;

    switch (pilihanDurasi) {
      case '1_hari':
        serverBiaya = model.harga1Hari;
        break;
      case '1_minggu':
        serverBiaya = model.harga1Minggu;
        break;
      case '2_minggu':
        serverBiaya = model.harga2Minggu;
        break;
      case '12_jam':
        serverBiaya = model.harga12Jam;
        break;
      case '9_jam':
        serverBiaya = model.harga9Jam;
        break;
      case '6_jam':
        serverBiaya = model.harga6Jam;
        break;
      case '3_jam':
        serverBiaya = model.harga3Jam;
        break;
      default:
        serverBiaya = model.harga1Hari;
    }

    // Server-side enforcement: publik selalu memakai tarif resmi server.
    // Override totalBiayaManual hanya diizinkan untuk operator terautentikasi (K-02).
    const isAuthorizedOperator = checkAuthHeader(req);
    const hitungBiaya =
      isAuthorizedOperator && typeof totalBiayaManual === 'number' && totalBiayaManual > 0
        ? totalBiayaManual
        : serverBiaya;

    const calcStartEpoch = startEpoch ? Number(startEpoch) : Math.floor(new Date(jamTanggalMulai).getTime() / 1000);
    const calcEndEpoch = endEpoch ? Number(endEpoch) : Math.floor(new Date(jamTanggalSelesai).getTime() / 1000);

    if (isNaN(calcStartEpoch) || isNaN(calcEndEpoch)) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal mulai atau selesai tidak valid.' },
        { status: 400 }
      );
    }

    if (calcEndEpoch <= calcStartEpoch) {
      return NextResponse.json(
        { success: false, error: 'Waktu selesai sewa harus lebih lambat dari waktu mulai sewa.' },
        { status: 400 }
      );
    }

    const noBooking = generateNoBooking();

    const [newBooking] = await db
      .insert(penyewaan)
      .values({
        noBooking,
        namaPenyewa: namaPenyewa.trim(),
        tandaPelanggan,
        jenisIdPendukung,
        poolArea: poolArea === 'batu' ? 'batu' : 'malang',
        alamatPengantaran: alamatPengantaran || null,
        alamatPenjemputan: alamatPenjemputan || null,
        motorId: parseInt(motorId, 10),
        snapshotNamaMotor: model.namaModel,
        jamTanggalMulai,
        jamTanggalSelesai,
        startEpoch: calcStartEpoch,
        endEpoch: calcEndEpoch,
        status: 'Booking', // State Machine status 1
        kategoriTarif,
        pilihanDurasi,
        totalBiaya: Number(hitungBiaya) || model.harga1Hari,
        dendaAkhir: 0,
        luarJamOperasional: Boolean(luarJamOperasional),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: `Pesanan baru berhasil dibuat dengan nomor ${newBooking.noBooking}.`,
        data: newBooking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
