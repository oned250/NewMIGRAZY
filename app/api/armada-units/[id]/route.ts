import { NextResponse } from 'next/server';
import { db, armadaUnits, motorModels, lacakUnits, penyewaan } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';

// GET /api/armada-units/[id]
export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const unitId = parseInt(params.id, 10);
    if (isNaN(unitId)) {
      return NextResponse.json({ success: false, error: 'ID unit tidak valid' }, { status: 400 });
    }

    const units = await db
      .select({
        id: armadaUnits.id,
        kodeUnit: armadaUnits.kodeUnit,
        motorId: armadaUnits.motorId,
        nomorPlat: armadaUnits.nomorPlat,
        warna: armadaUnits.warna,
        poolDefault: armadaUnits.poolDefault,
        statusServis: armadaUnits.statusServis,
        kmTerakhir: armadaUnits.kmTerakhir,
        tglServisTerakhir: armadaUnits.tglServisTerakhir,
        namaBengkel: armadaUnits.namaBengkel,
        createdAt: armadaUnits.createdAt,
        namaModel: motorModels.namaModel,
        kategori: motorModels.kategori,
        imageUrl: motorModels.imageUrl,
        harga1Hari: motorModels.harga1Hari,
        lacakId: lacakUnits.id,
        statusPosisi: lacakUnits.statusPosisi,
        poolParkir: lacakUnits.poolParkir,
        lacakNamaBengkel: lacakUnits.namaBengkel,
        kontakBengkel: lacakUnits.kontakBengkel,
        estimasiSelesai: lacakUnits.estimasiSelesai,
        bookingId: lacakUnits.bookingId,
        noBooking: lacakUnits.noBooking,
        namaPenyewa: lacakUnits.namaPenyewa,
        tenggatKembali: lacakUnits.tenggatKembali,
        lacakCatatan: lacakUnits.catatan,
      })
      .from(armadaUnits)
      .innerJoin(motorModels, eq(armadaUnits.motorId, motorModels.id))
      .leftJoin(lacakUnits, eq(lacakUnits.unitId, armadaUnits.id))
      .where(eq(armadaUnits.id, unitId))
      .limit(1);

    if (units.length === 0) {
      return NextResponse.json({ success: false, error: 'Unit armada tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: units[0] });
  } catch (error: any) {
    console.error('Error fetching armada unit by id:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/armada-units/[id] - Update informasi unit fisik (KODE_UNIT TERKUNCI/READONLY - AC-02)
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(req, ['admin', 'operator']);
    if (authError) return authError;

    const params = await props.params;
    const unitId = parseInt(params.id, 10);
    if (isNaN(unitId)) {
      return NextResponse.json({ success: false, error: 'ID unit tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const {
      kodeUnit, // DILARANG DIUBAH (AC-02: Readonly setelah dibuat)
      motorId,
      nomorPlat,
      warna,
      poolDefault,
      statusServis,
      kmTerakhir,
      tglServisTerakhir,
      namaBengkel,
      kontakBengkel,
      estimasiSelesai,
      catatan,
    } = body;

    // 1. Ambil data unit eksisting
    const existing = await db
      .select()
      .from(armadaUnits)
      .where(eq(armadaUnits.id, unitId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Unit tidak ditemukan' }, { status: 404 });
    }

    const currentUnit = existing[0];

    // 2. PROTEKSI IMMUTABILITY KODE UNIT (AC-02):
    // Jika ada upaya mengubah kodeUnit yang berbeda dari yang tersimpan, tolak tegas
    if (kodeUnit && kodeUnit.trim().toUpperCase() !== currentUnit.kodeUnit) {
      return NextResponse.json(
        {
          success: false,
          error: `Pelanggaran Aturan AC-02: Kode Unit ("${currentUnit.kodeUnit}") bersifat permanen & readonly setelah dibuat, tidak dapat diubah!`,
        },
        { status: 400 }
      );
    }

    // 3. Periksa status tracking saat ini di lacak_units
    const lacak = await db
      .select()
      .from(lacakUnits)
      .where(eq(lacakUnits.unitId, unitId))
      .limit(1);

    const currentLacak = lacak.length > 0 ? lacak[0] : null;

    // Jika ingin mengubah statusServis menjadi 'servis', pastikan unit tidak sedang 'disewa'
    const newStatusServis = statusServis ? (statusServis === 'servis' ? 'servis' : 'aktif') : currentUnit.statusServis;
    if (newStatusServis === 'servis' && currentLacak?.statusPosisi === 'disewa') {
      return NextResponse.json(
        {
          success: false,
          error: `Unit ${currentUnit.kodeUnit} saat ini sedang DISEWA oleh ${currentLacak.namaPenyewa || 'pelanggan'} (No Booking: ${currentLacak.noBooking || '-'}). Tidak dapat dipindahkan ke bengkel/servis sebelum unit dikembalikan!`,
        },
        { status: 400 }
      );
    }

    // 4. Siapkan data update untuk armada_units (KODE_UNIT TIDAK DISERTAKAN)
    const updateData: Partial<typeof armadaUnits.$inferInsert> = {};
    if (motorId !== undefined) updateData.motorId = parseInt(motorId, 10);
    if (nomorPlat !== undefined) updateData.nomorPlat = nomorPlat.trim().toUpperCase();
    if (warna !== undefined) updateData.warna = warna.trim();
    if (poolDefault !== undefined) updateData.poolDefault = poolDefault === 'batu' ? 'batu' : 'malang';
    if (statusServis !== undefined) updateData.statusServis = newStatusServis;
    if (kmTerakhir !== undefined) updateData.kmTerakhir = Number(kmTerakhir) || 0;
    if (tglServisTerakhir !== undefined) updateData.tglServisTerakhir = tglServisTerakhir || null;
    if (namaBengkel !== undefined) updateData.namaBengkel = namaBengkel || null;

    const [updatedUnit] = await db
      .update(armadaUnits)
      .set(updateData)
      .where(eq(armadaUnits.id, unitId))
      .returning();

    // 5. SINKRONISASI KE TABEL LACAK_UNITS (AC-03 & D-26)
    if (currentLacak) {
      const lacakUpdateData: Partial<typeof lacakUnits.$inferInsert> = {
        updatedAt: new Date(),
        updatedBy: 'Admin (Update Armada)',
      };

      if (motorId !== undefined) {
        lacakUpdateData.motorId = parseInt(motorId, 10);
      }

      // Jika ada perubahan status servis
      if (statusServis !== undefined) {
        if (newStatusServis === 'servis') {
          lacakUpdateData.statusPosisi = 'servis';
          lacakUpdateData.namaBengkel = namaBengkel || currentUnit.namaBengkel || 'Bengkel Resmi';
          if (kontakBengkel !== undefined) lacakUpdateData.kontakBengkel = kontakBengkel;
          if (estimasiSelesai !== undefined) lacakUpdateData.estimasiSelesai = estimasiSelesai;
        } else if (newStatusServis === 'aktif' && currentLacak.statusPosisi === 'servis') {
          // Unit selesai servis, kembali parkir
          lacakUpdateData.statusPosisi = 'parkir';
          lacakUpdateData.poolParkir = updateData.poolDefault || currentUnit.poolDefault;
          lacakUpdateData.namaBengkel = null;
          lacakUpdateData.kontakBengkel = null;
          lacakUpdateData.estimasiSelesai = null;
        }
      }

      // Jika pool default berubah dan unit sedang parkir
      if (poolDefault !== undefined && currentLacak.statusPosisi === 'parkir') {
        lacakUpdateData.poolParkir = poolDefault === 'batu' ? 'batu' : 'malang';
      }

      if (catatan !== undefined) {
        lacakUpdateData.catatan = catatan;
      }

      await db
        .update(lacakUnits)
        .set(lacakUpdateData)
        .where(eq(lacakUnits.unitId, unitId));
    }

    return NextResponse.json({
      success: true,
      message: `Unit ${updatedUnit.kodeUnit} berhasil diperbarui dan tersinkronisasi.`,
      data: updatedUnit,
    });
  } catch (error: any) {
    console.error('Error updating armada unit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/armada-units/[id] - Menghapus unit fisik dengan proteksi integritas
export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError) return authError;

    const params = await props.params;
    const unitId = parseInt(params.id, 10);
    if (isNaN(unitId)) {
      return NextResponse.json({ success: false, error: 'ID unit tidak valid' }, { status: 400 });
    }

    // 1. Cek unit eksis
    const existing = await db
      .select()
      .from(armadaUnits)
      .where(eq(armadaUnits.id, unitId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Unit tidak ditemukan' }, { status: 404 });
    }

    const unit = existing[0];

    // 2. Cek apakah unit sedang aktif disewa (lacak_units & penyewaan)
    const lacak = await db
      .select()
      .from(lacakUnits)
      .where(eq(lacakUnits.unitId, unitId))
      .limit(1);

    if (lacak.length > 0 && lacak[0].statusPosisi === 'disewa') {
      return NextResponse.json(
        {
          success: false,
          error: `Unit ${unit.kodeUnit} TIDAK DAPAT DIHAPUS karena sedang disewa oleh ${lacak[0].namaPenyewa || 'pelanggan'}! Selesaikan sewa terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // Cek juga relasi transaksi penyewaan aktif ('Booking', 'Approve', 'Disewa')
    const activeRentals = await db
      .select({ id: penyewaan.id, noBooking: penyewaan.noBooking, status: penyewaan.status })
      .from(penyewaan)
      .where(
        and(
          eq(penyewaan.unitId, unitId),
          eq(penyewaan.status, 'Disewa')
        )
      )
      .limit(1);

    if (activeRentals.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unit ${unit.kodeUnit} memiliki transaksi aktif (No Booking: ${activeRentals[0].noBooking}) dan tidak dapat dihapus.`,
        },
        { status: 400 }
      );
    }

    // 3. Hapus baris lacak_units terlebih dahulu (foreign key)
    await db.delete(lacakUnits).where(eq(lacakUnits.unitId, unitId));

    // 4. Hapus baris armada_units
    await db.delete(armadaUnits).where(eq(armadaUnits.id, unitId));

    return NextResponse.json({
      success: true,
      message: `Unit ${unit.kodeUnit} (${unit.nomorPlat}) dan data pelacakannya berhasil dihapus dari sistem.`,
    });
  } catch (error: any) {
    console.error('Error deleting armada unit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
