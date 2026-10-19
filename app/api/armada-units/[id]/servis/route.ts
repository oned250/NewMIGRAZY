import { NextResponse } from 'next/server';
import { db, armadaUnits, lacakUnits } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST /api/armada-units/[id]/servis - Aksi cepat kirim unit ke bengkel atau selesai servis
export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const unitId = parseInt(params.id, 10);
    if (isNaN(unitId)) {
      return NextResponse.json({ success: false, error: 'ID unit tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const { action, namaBengkel, kontakBengkel, estimasiSelesai, kmTerakhir, catatan } = body;

    // action: 'masuk_servis' | 'selesai_servis'
    if (!action || !['masuk_servis', 'selesai_servis'].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Parameter 'action' harus berupa 'masuk_servis' atau 'selesai_servis'" },
        { status: 400 }
      );
    }

    // 1. Ambil unit & lacak
    const unitRes = await db.select().from(armadaUnits).where(eq(armadaUnits.id, unitId)).limit(1);
    if (unitRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Unit tidak ditemukan' }, { status: 404 });
    }
    const unit = unitRes[0];

    const lacakRes = await db.select().from(lacakUnits).where(eq(lacakUnits.unitId, unitId)).limit(1);
    const lacak = lacakRes.length > 0 ? lacakRes[0] : null;

    if (action === 'masuk_servis') {
      if (lacak?.statusPosisi === 'disewa') {
        return NextResponse.json(
          {
            success: false,
            error: `Unit ${unit.kodeUnit} sedang aktif disewa oleh ${lacak.namaPenyewa}! Tidak dapat dikirim ke bengkel.`,
          },
          { status: 400 }
        );
      }

      const today = new Date().toISOString().split('T')[0];

      // Update armada_units
      await db
        .update(armadaUnits)
        .set({
          statusServis: 'servis',
          namaBengkel: namaBengkel || 'Bengkel Resmi Rekanan',
          tglServisTerakhir: today,
          kmTerakhir: kmTerakhir !== undefined ? Number(kmTerakhir) : unit.kmTerakhir,
        })
        .where(eq(armadaUnits.id, unitId));

      // Sync lacak_units
      if (lacak) {
        await db
          .update(lacakUnits)
          .set({
            statusPosisi: 'servis',
            namaBengkel: namaBengkel || 'Bengkel Resmi Rekanan',
            kontakBengkel: kontakBengkel || null,
            estimasiSelesai: estimasiSelesai || null,
            catatan: catatan || `Masuk bengkel pada ${today}`,
            updatedAt: new Date(),
            updatedBy: 'Admin (Aksi Servis)',
          })
          .where(eq(lacakUnits.unitId, unitId));
      }

      return NextResponse.json({
        success: true,
        message: `Unit ${unit.kodeUnit} berhasil dipindahkan ke status SERVIS di ${namaBengkel || 'bengkel'}.`,
      });
    } else {
      // 'selesai_servis'
      const today = new Date().toISOString().split('T')[0];

      // Update armada_units
      await db
        .update(armadaUnits)
        .set({
          statusServis: 'aktif',
          namaBengkel: null,
          tglServisTerakhir: today,
          kmTerakhir: kmTerakhir !== undefined ? Number(kmTerakhir) : unit.kmTerakhir,
        })
        .where(eq(armadaUnits.id, unitId));

      // Sync lacak_units
      if (lacak) {
        await db
          .update(lacakUnits)
          .set({
            statusPosisi: 'parkir',
            poolParkir: unit.poolDefault,
            namaBengkel: null,
            kontakBengkel: null,
            estimasiSelesai: null,
            catatan: catatan || `Selesai servis pada ${today}, kembali parkir di Pool ${unit.poolDefault.toUpperCase()}`,
            updatedAt: new Date(),
            updatedBy: 'Admin (Selesai Servis)',
          })
          .where(eq(lacakUnits.unitId, unitId));
      }

      return NextResponse.json({
        success: true,
        message: `Unit ${unit.kodeUnit} telah selesai servis dan siap disewa di Pool ${unit.poolDefault.toUpperCase()}.`,
      });
    }
  } catch (error: any) {
    console.error('Error in service action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
