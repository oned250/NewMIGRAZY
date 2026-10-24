import { NextResponse } from 'next/server';
import { db, motorModels, armadaUnits } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const modelId = parseInt(params.id, 10);
    if (isNaN(modelId)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const [model] = await db.select().from(motorModels).where(eq(motorModels.id, modelId));
    if (!model) {
      return NextResponse.json({ success: false, error: 'Model motor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: model });
  } catch (error: any) {
    console.error('Error fetching motor model:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireRole(req, ['admin', 'operator']);
    if (authError) return authError;

    const params = await props.params;
    const modelId = parseInt(params.id, 10);
    if (isNaN(modelId)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const {
      namaModel,
      kategori,
      harga1Hari,
      harga1Minggu,
      harga2Minggu,
      harga12Jam,
      harga9Jam,
      harga6Jam,
      harga3Jam,
      dendaHarianPerJam,
      fasilitas,
      spesifikasi,
      imageUrl,
      isActive,
    } = body;

    const updatePayload: Record<string, any> = {};

    if (namaModel !== undefined) updatePayload.namaModel = namaModel.trim();
    if (kategori !== undefined) updatePayload.kategori = kategori.trim();
    if (harga1Hari !== undefined) updatePayload.harga1Hari = Math.round(Number(harga1Hari) / 1000) * 1000;
    if (harga1Minggu !== undefined) updatePayload.harga1Minggu = Math.round(Number(harga1Minggu) / 1000) * 1000;
    if (harga2Minggu !== undefined) updatePayload.harga2Minggu = Math.round(Number(harga2Minggu) / 1000) * 1000;
    if (harga12Jam !== undefined) updatePayload.harga12Jam = Math.round(Number(harga12Jam) / 1000) * 1000;
    if (harga9Jam !== undefined) updatePayload.harga9Jam = Math.round(Number(harga9Jam) / 1000) * 1000;
    if (harga6Jam !== undefined) updatePayload.harga6Jam = Math.round(Number(harga6Jam) / 1000) * 1000;
    if (harga3Jam !== undefined) updatePayload.harga3Jam = Math.round(Number(harga3Jam) / 1000) * 1000;
    if (dendaHarianPerJam !== undefined) updatePayload.dendaHarianPerJam = Math.round(Number(dendaHarianPerJam) / 1000) * 1000;
    if (fasilitas !== undefined) updatePayload.fasilitas = fasilitas;
    if (spesifikasi !== undefined) updatePayload.spesifikasi = spesifikasi;
    if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

    const [updated] = await db
      .update(motorModels)
      .set(updatePayload)
      .where(eq(motorModels.id, modelId))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Model motor tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating motor model:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const authError = await requireRole(req, ['admin']);
    if (authError) return authError;

    const params = await props.params;
    const modelId = parseInt(params.id, 10);
    if (isNaN(modelId)) {
      return NextResponse.json({ success: false, error: 'ID tidak valid' }, { status: 400 });
    }

    // Periksa apakah ada unit armada fisik yang terkait dengan model ini
    const units = await db
      .select({ id: armadaUnits.id })
      .from(armadaUnits)
      .where(eq(armadaUnits.motorId, modelId));

    if (units.length > 0) {
      // Jika masih ada unit terkait, jangan hard delete; nonaktifkan model (soft delete) untuk integritas relasional
      const [softDeleted] = await db
        .update(motorModels)
        .set({ isActive: false })
        .where(eq(motorModels.id, modelId))
        .returning();

      return NextResponse.json({
        success: true,
        message: `Model motor memiliki ${units.length} unit armada fisik terkait. Status dinonaktifkan (soft-delete) untuk menjaga integritas data.`,
        data: softDeleted,
        softDeleted: true,
      });
    }

    // Jika tidak ada unit armada fisik terkait, aman untuk hard delete
    const [deleted] = await db
      .delete(motorModels)
      .where(eq(motorModels.id, modelId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Model motor berhasil dihapus secara permanen.',
      data: deleted,
      softDeleted: false,
    });
  } catch (error: any) {
    console.error('Error deleting motor model:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
