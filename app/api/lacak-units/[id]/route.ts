import { NextResponse } from 'next/server';
import { db, lacakUnits, armadaUnits } from '@/lib/db';
import { eq } from 'drizzle-orm';

// PUT /api/lacak-units/[id] - Memperbarui status posisi unit (Parkir, Servis, Disewa) secara cepat (AC-03 TASK-006)
export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const lacakId = parseInt(params.id, 10);
    if (isNaN(lacakId)) {
      return NextResponse.json({ success: false, error: 'ID lacak tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const {
      statusPosisi,
      poolParkir,
      namaBengkel,
      kontakBengkel,
      estimasiSelesai,
      noBooking,
      namaPenyewa,
      tenggatKembali,
      catatan,
    } = body;

    // 1. Ambil data lacak eksisting
    const currentRes = await db
      .select()
      .from(lacakUnits)
      .where(eq(lacakUnits.id, lacakId))
      .limit(1);

    if (currentRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Data lacak unit tidak ditemukan' }, { status: 404 });
    }

    const current = currentRes[0];
    const newPosisi = statusPosisi || current.statusPosisi;
    const newPool = poolParkir || current.poolParkir;

    // 2. Siapkan update lacak_units
    const updateLacak: Partial<typeof lacakUnits.$inferInsert> = {
      statusPosisi: newPosisi,
      poolParkir: newPool,
      catatan: catatan !== undefined ? catatan : current.catatan,
      updatedAt: new Date(),
      updatedBy: 'Admin (Monitoring Lacak)',
    };

    if (newPosisi === 'servis') {
      updateLacak.namaBengkel = namaBengkel || current.namaBengkel || 'Bengkel Rekanan';
      updateLacak.kontakBengkel = kontakBengkel !== undefined ? kontakBengkel : current.kontakBengkel;
      updateLacak.estimasiSelesai = estimasiSelesai !== undefined ? estimasiSelesai : current.estimasiSelesai;
      // Kosongkan penyewa jika sebelumnya disewa
      updateLacak.bookingId = null;
      updateLacak.noBooking = null;
      updateLacak.namaPenyewa = null;
      updateLacak.tenggatKembali = null;
    } else if (newPosisi === 'parkir') {
      updateLacak.namaBengkel = null;
      updateLacak.kontakBengkel = null;
      updateLacak.estimasiSelesai = null;
      updateLacak.bookingId = null;
      updateLacak.noBooking = null;
      updateLacak.namaPenyewa = null;
      updateLacak.tenggatKembali = null;
    } else if (newPosisi === 'disewa') {
      if (noBooking !== undefined) updateLacak.noBooking = noBooking;
      if (namaPenyewa !== undefined) updateLacak.namaPenyewa = namaPenyewa;
      if (tenggatKembali !== undefined) updateLacak.tenggatKembali = tenggatKembali;
      updateLacak.namaBengkel = null;
      updateLacak.kontakBengkel = null;
      updateLacak.estimasiSelesai = null;
    }

    const [updated] = await db
      .update(lacakUnits)
      .set(updateLacak)
      .where(eq(lacakUnits.id, lacakId))
      .returning();

    // 3. Sinkronisasikan ke tabel armada_units
    if (current.unitId) {
      const updateArmada: Partial<typeof armadaUnits.$inferInsert> = {};
      if (newPosisi === 'servis') {
        updateArmada.statusServis = 'servis';
        updateArmada.namaBengkel = updateLacak.namaBengkel;
      } else if (newPosisi === 'parkir') {
        updateArmada.statusServis = 'aktif';
        updateArmada.namaBengkel = null;
      }

      if (Object.keys(updateArmada).length > 0) {
        await db
          .update(armadaUnits)
          .set(updateArmada)
          .where(eq(armadaUnits.id, current.unitId));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Posisi unit ${current.kodeUnit} berhasil diperbarui menjadi '${newPosisi}'.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating lacak unit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
