import { NextResponse } from 'next/server';
import { db, penyewaan, motorModels, armadaUnits, lacakUnits } from '@/lib/db';
import { eq, and, or, sql } from 'drizzle-orm';

// GET /api/penyewaan/[id] - Ambil detail transaksi
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const bookingId = parseInt(params.id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ success: false, error: 'ID booking tidak valid' }, { status: 400 });
    }

    const res = await db
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
        namaModel: motorModels.namaModel,
        kategori: motorModels.kategori,
        dendaHarianPerJam: motorModels.dendaHarianPerJam,
        unitKode: armadaUnits.kodeUnit,
        unitPlat: armadaUnits.nomorPlat,
        unitWarna: armadaUnits.warna,
      })
      .from(penyewaan)
      .innerJoin(motorModels, eq(penyewaan.motorId, motorModels.id))
      .leftJoin(armadaUnits, eq(penyewaan.unitId, armadaUnits.id))
      .where(eq(penyewaan.id, bookingId))
      .limit(1);

    if (res.length === 0) {
      return NextResponse.json({ success: false, error: 'Transaksi booking tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res[0] });
  } catch (error: any) {
    console.error('Error fetching booking detail:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/penyewaan/[id] - Transisi State Machine Transaksi (AC-01, AC-02, AC-03)
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const bookingId = parseInt(params.id, 10);
    if (isNaN(bookingId)) {
      return NextResponse.json({ success: false, error: 'ID booking tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const { action, unitId, actualSelesaiAt, alasanBatal, newUnitId, alasanTukar } = body;

    // 1. Ambil data pesanan saat ini beserta model motor
    const currentRes = await db
      .select({
        booking: penyewaan,
        model: motorModels,
      })
      .from(penyewaan)
      .innerJoin(motorModels, eq(penyewaan.motorId, motorModels.id))
      .where(eq(penyewaan.id, bookingId))
      .limit(1);

    if (currentRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const { booking, model } = currentRes[0];

    // =========================================================================
    // AKSI 1: APPROVE (Konfirmasi & Kunci Unit Fisik — AC-01 Anti Double-Booking)
    // =========================================================================
    if (action === 'approve') {
      if (booking.status !== 'Booking') {
        return NextResponse.json(
          {
            success: false,
            error: `Aksi Approve hanya dapat dilakukan untuk pesanan berstatus 'Booking' (Status saat ini: ${booking.status}).`,
          },
          { status: 400 }
        );
      }

      if (!unitId) {
        return NextResponse.json(
          { success: false, error: 'Pilih unit armada fisik untuk dialokasikan pada pesanan ini.' },
          { status: 400 }
        );
      }

      const targetUnitId = parseInt(unitId, 10);

      // Verifikasi unit fisik
      const unitCheck = await db
        .select()
        .from(armadaUnits)
        .where(eq(armadaUnits.id, targetUnitId))
        .limit(1);

      if (unitCheck.length === 0) {
        return NextResponse.json({ success: false, error: 'Unit fisik tidak ditemukan' }, { status: 404 });
      }

      const targetUnit = unitCheck[0];

      if (targetUnit.statusServis === 'servis') {
        return NextResponse.json(
          {
            success: false,
            error: `Unit ${targetUnit.kodeUnit} sedang berstatus SERVIS di bengkel dan tidak dapat dialokasikan!`,
          },
          { status: 400 }
        );
      }

      // AC-01: Verifikasi Anti Double-Booking dengan Buffer 90 menit (5400 detik)
      const BUFFER_SECONDS = 5400;
      const bStart = booking.startEpoch - BUFFER_SECONDS;
      const bEnd = booking.endEpoch + BUFFER_SECONDS;

      const conflicts = await db
        .select({
          id: penyewaan.id,
          noBooking: penyewaan.noBooking,
          namaPenyewa: penyewaan.namaPenyewa,
          status: penyewaan.status,
          startEpoch: penyewaan.startEpoch,
          endEpoch: penyewaan.endEpoch,
        })
        .from(penyewaan)
        .where(
          and(
            eq(penyewaan.unitId, targetUnitId),
            sql`${penyewaan.id} != ${booking.id}`,
            or(eq(penyewaan.status, 'Approve'), eq(penyewaan.status, 'Disewa')),
            sql`${penyewaan.startEpoch} < ${bEnd} AND ${penyewaan.endEpoch} > ${bStart}`
          )
        );

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        return NextResponse.json(
          {
            success: false,
            error: `ANTI DOUBLE-BOOKING (AC-01): Unit ${targetUnit.kodeUnit} (${targetUnit.nomorPlat}) bertabrakan jadwal (+ buffer 90 menit) dengan pesanan ${conflict.noBooking} atas nama ${conflict.namaPenyewa} (Status: ${conflict.status})! Silakan pilih unit lain.`,
          },
          { status: 400 }
        );
      }

      // Kunci unit ke pesanan dan transisi ke status 'Approve'
      const [updated] = await db
        .update(penyewaan)
        .set({
          status: 'Approve',
          unitId: targetUnit.id,
          snapshotKodeUnit: targetUnit.kodeUnit,
        })
        .where(eq(penyewaan.id, bookingId))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Pesanan ${booking.noBooking} berhasil disetujui (Approve) dengan unit fisik ${targetUnit.kodeUnit}.`,
        data: updated,
      });
    }

    // =========================================================================
    // AKSI 2: DISEWA (Serah Terima Kunci ke Pelanggan & Update Lacak Real-Time)
    // =========================================================================
    if (action === 'disewa') {
      if (booking.status !== 'Approve') {
        return NextResponse.json(
          {
            success: false,
            error: `Aksi Serah Terima (Disewa) hanya dapat dilakukan setelah pesanan di-Approve (Status saat ini: ${booking.status}).`,
          },
          { status: 400 }
        );
      }

      if (!booking.unitId) {
        return NextResponse.json(
          { success: false, error: 'Pesanan belum memiliki unit fisik dialokasikan.' },
          { status: 400 }
        );
      }

      const nowStr = new Date().toISOString();

      // Update transaksi penyewaan
      const [updated] = await db
        .update(penyewaan)
        .set({
          status: 'Disewa',
          disewaAt: nowStr,
        })
        .where(eq(penyewaan.id, bookingId))
        .returning();

      // SINKRONISASI KE LACAK_UNITS: Status posisi berubah menjadi 'disewa'
      await db
        .update(lacakUnits)
        .set({
          statusPosisi: 'disewa',
          bookingId: booking.id,
          noBooking: booking.noBooking,
          namaPenyewa: booking.namaPenyewa,
          tenggatKembali: booking.jamTanggalSelesai,
          catatan: `Sedang disewa oleh ${booking.namaPenyewa} (No: ${booking.noBooking})`,
          updatedAt: new Date(),
          updatedBy: 'Admin (Serah Terima Kunci)',
        })
        .where(eq(lacakUnits.unitId, booking.unitId));

      return NextResponse.json({
        success: true,
        message: `Kunci dan motor ${booking.snapshotKodeUnit || ''} telah diserahterimakan. Pesanan berstatus DISEWA.`,
        data: updated,
      });
    }

    // =========================================================================
    // AKSI 3: SELESAI (Pengembalian Motor & Kalkulasi Denda Otomatis — AC-03)
    // =========================================================================
    if (action === 'selesai') {
      if (booking.status !== 'Disewa') {
        return NextResponse.json(
          {
            success: false,
            error: `Aksi Selesai hanya dapat dilakukan untuk pesanan yang sedang aktif 'Disewa' (Status saat ini: ${booking.status}).`,
          },
          { status: 400 }
        );
      }

      const returnTimeIso = actualSelesaiAt || new Date().toISOString();
      const returnEpoch = Math.floor(new Date(returnTimeIso).getTime() / 1000);

      // Hitung selisih waktu keterlambatan terhadap jadwal endEpoch
      const lateSeconds = returnEpoch - booking.endEpoch;
      const lateMinutes = Math.floor(lateSeconds / 60);

      let dendaAkhir = 0;
      let dendaKeterangan = 'Tepat Waktu (Tidak Ada Denda)';

      // AC-03 & BR-04: Kalkulasi Denda ShortRent Step-Up vs Harian
      if (lateMinutes > 0) {
        if (booking.kategoriTarif === 'jam') {
          // Aturan ShortRent Step-Up
          if (lateMinutes >= 60) {
            // Naik ke kategori durasi jam di atasnya (D-27)
            if (booking.pilihanDurasi === '3_jam') {
              dendaAkhir = Math.max(0, model.harga6Jam - model.harga3Jam);
              dendaKeterangan = `Denda ShortRent Step-Up: Terlambat ${lateMinutes} menit (>=60m). Tagihan naik dari paket 3 Jam ke 6 Jam (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
            } else if (booking.pilihanDurasi === '6_jam') {
              dendaAkhir = Math.max(0, model.harga9Jam - model.harga6Jam);
              dendaKeterangan = `Denda ShortRent Step-Up: Terlambat ${lateMinutes} menit (>=60m). Tagihan naik dari paket 6 Jam ke 9 Jam (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
            } else if (booking.pilihanDurasi === '9_jam') {
              dendaAkhir = Math.max(0, model.harga12Jam - model.harga9Jam);
              dendaKeterangan = `Denda ShortRent Step-Up: Terlambat ${lateMinutes} menit (>=60m). Tagihan naik dari paket 9 Jam ke 12 Jam (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
            } else if (booking.pilihanDurasi === '12_jam') {
              // Untuk 12 jam, denda per jam sama dengan denda harian per jam
              const lateHours = Math.ceil(lateMinutes / 60);
              dendaAkhir = lateHours * model.dendaHarianPerJam;
              dendaKeterangan = `Denda ShortRent 12 Jam: Terlambat ${lateMinutes} menit (${lateHours} jam) @ Rp ${model.dendaHarianPerJam.toLocaleString('id-ID')}/jam (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
            }
          } else if (lateMinutes > 15) {
            // Toleransi keterlambatan 15 menit. Jika antara 16-59 menit dihitung proporsional 1 jam flat
            dendaAkhir = Math.round(model.dendaHarianPerJam / 2);
            dendaKeterangan = `Denda Keterlambatan Singkat: Terlambat ${lateMinutes} menit (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
          } else {
            dendaKeterangan = `Toleransi Keterlambatan: Terlambat ${lateMinutes} menit (di bawah 15 menit, bebas denda).`;
          }
        } else {
          // Tarif Harian: Dihitung per jam keterlambatan
          const lateHours = Math.ceil(lateMinutes / 60);
          dendaAkhir = lateHours * model.dendaHarianPerJam;
          dendaKeterangan = `Denda Keterlambatan Harian: Terlambat ${lateMinutes} menit (${lateHours} jam) @ Rp ${model.dendaHarianPerJam.toLocaleString('id-ID')}/jam (+Rp ${dendaAkhir.toLocaleString('id-ID')}).`;
        }
      }

      // Update transaksi ke status 'Selesai'
      const [updated] = await db
        .update(penyewaan)
        .set({
          status: 'Selesai',
          selesaiAt: returnTimeIso,
          dendaAkhir,
          dendaKeterangan,
        })
        .where(eq(penyewaan.id, bookingId))
        .returning();

      // SINKRONISASI KE LACAK_UNITS: Kembalikan unit fisik ke status 'parkir' di Pool
      if (booking.unitId) {
        await db
          .update(lacakUnits)
          .set({
            statusPosisi: 'parkir',
            poolParkir: booking.poolArea,
            bookingId: null,
            noBooking: null,
            namaPenyewa: null,
            tenggatKembali: null,
            catatan: `Unit kembali dari sewa ${booking.noBooking} (${booking.namaPenyewa}) pada ${returnTimeIso.split('T')[0]}`,
            updatedAt: new Date(),
            updatedBy: 'Admin (Selesai Sewa)',
          })
          .where(eq(lacakUnits.unitId, booking.unitId));
      }

      return NextResponse.json({
        success: true,
        message: `Pesanan ${booking.noBooking} telah SELESAI. Denda keterlambatan: Rp ${dendaAkhir.toLocaleString('id-ID')}. Unit fisik kembali berstatus parkir di Pool ${booking.poolArea.toUpperCase()}.`,
        data: updated,
        kalkulasiDenda: {
          lateMinutes,
          dendaAkhir,
          dendaKeterangan,
          totalAkhir: booking.totalBiaya + dendaAkhir,
        },
      });
    }

    // =========================================================================
    // AKSI 4: REJECT / CANCEL (Tolak atau Batalkan — AC-02 Pembatasan Ketat)
    // =========================================================================
    if (action === 'reject' || action === 'cancel') {
      // AC-02: DILARANG jika sudah dalam status 'Disewa' atau 'Selesai'
      if (booking.status === 'Disewa') {
        return NextResponse.json(
          {
            success: false,
            error: `PELANGGARAN ATURAN (AC-02): Pesanan berstatus 'Disewa' TIDAK DAPAT dibatalkan atau ditolak! Unit motor sedang berada di tangan pelanggan. Gunakan tombol 'Selesai' untuk menyelesaikan sewa.`,
          },
          { status: 400 }
        );
      }

      if (booking.status === 'Selesai') {
        return NextResponse.json(
          {
            success: false,
            error: `Pesanan ${booking.noBooking} sudah SELESAI dan tidak dapat dibatalkan.`,
          },
          { status: 400 }
        );
      }

      const alasan = alasanBatal?.trim() || `Dibatalkan oleh operator (${action.toUpperCase()})`;
      const targetStatus = action === 'reject' ? 'Reject' : 'Cancel';

      // Lepaskan unit jika sebelumnya sudah di-Approve
      const [updated] = await db
        .update(penyewaan)
        .set({
          status: targetStatus,
          dendaKeterangan: `Alasan Pembatalan: ${alasan}`,
          unitId: null,
          snapshotKodeUnit: null,
        })
        .where(eq(penyewaan.id, bookingId))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Pesanan ${booking.noBooking} berhasil diubah menjadi '${targetStatus}'.`,
        data: updated,
      });
    }

    // =========================================================================
    // AKSI 5: TUKAR UNIT (Pergantian Unit Berkala di Tengah Masa Sewa)
    // =========================================================================
    if (action === 'tukar_unit') {
      if (booking.status !== 'Disewa') {
        return NextResponse.json(
          {
            success: false,
            error: `Aksi Tukar Unit hanya dapat dilakukan saat pesanan berstatus 'Disewa'.`,
          },
          { status: 400 }
        );
      }

      if (!newUnitId) {
        return NextResponse.json({ success: false, error: 'Pilih unit pengganti.' }, { status: 400 });
      }

      const targetNewUnitId = parseInt(newUnitId, 10);
      const newUnitCheck = await db.select().from(armadaUnits).where(eq(armadaUnits.id, targetNewUnitId)).limit(1);
      if (newUnitCheck.length === 0) {
        return NextResponse.json({ success: false, error: 'Unit pengganti tidak ditemukan' }, { status: 404 });
      }
      const newUnit = newUnitCheck[0];

      if (newUnit.statusServis === 'servis') {
        return NextResponse.json({ success: false, error: `Unit ${newUnit.kodeUnit} sedang servis di bengkel` }, { status: 400 });
      }

      const today = new Date().toISOString();
      const riwayatBaru = `${booking.riwayatTukarUnit ? booking.riwayatTukarUnit + ' | ' : ''}[${today.split('T')[0]}] Tukar dari ${booking.snapshotKodeUnit || 'lama'} ke ${newUnit.kodeUnit} (${alasanTukar || 'Kebutuhan Operasional'})`;

      // 1. Bebaskan unit lama di lacak_units
      if (booking.unitId) {
        await db
          .update(lacakUnits)
          .set({
            statusPosisi: 'parkir',
            bookingId: null,
            noBooking: null,
            namaPenyewa: null,
            catatan: `Unit ditukar ke ${newUnit.kodeUnit} pada ${today.split('T')[0]}`,
          })
          .where(eq(lacakUnits.unitId, booking.unitId));
      }

      // 2. Kunci unit baru di lacak_units
      await db
        .update(lacakUnits)
        .set({
          statusPosisi: 'disewa',
          bookingId: booking.id,
          noBooking: booking.noBooking,
          namaPenyewa: booking.namaPenyewa,
          tenggatKembali: booking.jamTanggalSelesai,
          catatan: `Unit pengganti sewa ${booking.noBooking}`,
        })
        .where(eq(lacakUnits.unitId, newUnit.id));

      // 3. Update data pesanan
      const [updated] = await db
        .update(penyewaan)
        .set({
          unitId: newUnit.id,
          snapshotKodeUnit: newUnit.kodeUnit,
          riwayatTukarUnit: riwayatBaru,
        })
        .where(eq(penyewaan.id, bookingId))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Unit berhasil ditukar ke ${newUnit.kodeUnit}.`,
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: `Aksi '${action}' tidak dikenali.` }, { status: 400 });
  } catch (error: any) {
    console.error('Error executing booking transition:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
