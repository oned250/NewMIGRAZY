import { NextResponse } from 'next/server';
import { db, armadaUnits, motorModels, penyewaan, lacakUnits } from '@/lib/db';
import { eq, and, or, sql, notInArray } from 'drizzle-orm';

// GET /api/penyewaan/available-units?motorId=1&startEpoch=...&endEpoch=...&currentBookingId=...
// Menampilkan unit armada fisik yang siap dan tidak bentrok jadwal (Anti Double-Booking BR-01)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const motorIdStr = searchParams.get('motorId');
    const startEpochStr = searchParams.get('startEpoch') || searchParams.get('start');
    const endEpochStr = searchParams.get('endEpoch') || searchParams.get('end');
    const currentBookingIdStr = searchParams.get('currentBookingId');

    if (!motorIdStr) {
      return NextResponse.json({ success: false, error: 'motorId wajib diisi' }, { status: 400 });
    }

    const motorId = parseInt(motorIdStr, 10);
    if (isNaN(motorId)) {
      return NextResponse.json({ success: false, error: 'motorId tidak valid' }, { status: 400 });
    }

    let startEpoch: number;
    if (startEpochStr) {
      if (!isNaN(Number(startEpochStr))) {
        startEpoch = parseInt(startEpochStr, 10);
      } else {
        startEpoch = Math.floor(new Date(startEpochStr).getTime() / 1000);
      }
    } else {
      startEpoch = Math.floor(Date.now() / 1000);
    }

    let endEpoch: number;
    if (endEpochStr) {
      if (!isNaN(Number(endEpochStr))) {
        endEpoch = parseInt(endEpochStr, 10);
      } else {
        endEpoch = Math.floor(new Date(endEpochStr).getTime() / 1000);
      }
    } else {
      endEpoch = startEpoch + 86400;
    }

    if (isNaN(startEpoch) || isNaN(endEpoch)) {
      return NextResponse.json(
        { success: false, error: 'Format tanggal/epoch mulai atau selesai tidak valid' },
        { status: 400 }
      );
    }

    const currentBookingId = currentBookingIdStr ? parseInt(currentBookingIdStr, 10) : null;

    // Buffer 90 menit (5400 detik) sesuai BR-01
    const BUFFER_SECONDS = 5400;
    const bufferedStart = startEpoch - BUFFER_SECONDS;
    const bufferedEnd = endEpoch + BUFFER_SECONDS;

    // 1. Ambil seluruh unit fisik untuk motorId ini
    const allUnits = await db
      .select({
        id: armadaUnits.id,
        kodeUnit: armadaUnits.kodeUnit,
        nomorPlat: armadaUnits.nomorPlat,
        warna: armadaUnits.warna,
        poolDefault: armadaUnits.poolDefault,
        statusServis: armadaUnits.statusServis,
        kmTerakhir: armadaUnits.kmTerakhir,
        namaBengkel: armadaUnits.namaBengkel,
        lacakPosisi: lacakUnits.statusPosisi,
        lacakPool: lacakUnits.poolParkir,
      })
      .from(armadaUnits)
      .leftJoin(lacakUnits, eq(lacakUnits.unitId, armadaUnits.id))
      .where(eq(armadaUnits.motorId, motorId));

    // 2. Ambil booking yang bertabrakan rentang waktu (status 'Approve' atau 'Disewa')
    const conflictingBookings = await db
      .select({
        unitId: penyewaan.unitId,
        noBooking: penyewaan.noBooking,
        namaPenyewa: penyewaan.namaPenyewa,
        startEpoch: penyewaan.startEpoch,
        endEpoch: penyewaan.endEpoch,
        status: penyewaan.status,
      })
      .from(penyewaan)
      .where(
        and(
          eq(penyewaan.motorId, motorId),
          or(eq(penyewaan.status, 'Approve'), eq(penyewaan.status, 'Disewa')),
          // Formula overlap: startA < endB AND endA > startB
          sql`${penyewaan.startEpoch} < ${bufferedEnd} AND ${penyewaan.endEpoch} > ${bufferedStart}`
        )
      );

    // Filter out current booking if updating
    const activeConflicts = conflictingBookings.filter(
      (b) => b.unitId !== null && (currentBookingId ? b.noBooking !== undefined : true)
    );

    const conflictingUnitIds = new Set(
      activeConflicts.map((c) => c.unitId).filter((id): id is number => id !== null)
    );

    // Map units with availability reason
    const analyzedUnits = allUnits.map((unit) => {
      let isAvailable = true;
      let reason = 'Tersedia';

      if (unit.statusServis === 'servis' || unit.lacakPosisi === 'servis') {
        isAvailable = false;
        reason = `Sedang di Bengkel (${unit.namaBengkel || 'Servis'})`;
      } else if (conflictingUnitIds.has(unit.id)) {
        isAvailable = false;
        const conf = activeConflicts.find((c) => c.unitId === unit.id);
        reason = `Bentrok Jadwal + Buffer 90m (No: ${conf?.noBooking || '-'} - ${conf?.namaPenyewa || 'Penyewa'})`;
      }

      return {
        ...unit,
        isAvailable,
        availabilityReason: reason,
      };
    });

    return NextResponse.json({
      success: true,
      data: analyzedUnits,
      bufferedStart,
      bufferedEnd,
      totalUnits: allUnits.length,
      availableCount: analyzedUnits.filter((u) => u.isAvailable).length,
    });
  } catch (error: any) {
    console.error('Error checking available units:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
