import { pgTable, serial, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table (Firebase Auth sync & Role-Based Access Control)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').notNull().default('operator'), // 'admin' | 'operator'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Motor Models Table (Katalog Model Motor & Multi-tier Tarif)
export const motorModels = pgTable('motor_models', {
  id: serial('id').primaryKey(),
  namaModel: text('nama_model').notNull(),
  kategori: text('kategori').notNull(), // 'Matic' | 'Sport' | 'Trail' | 'Retro'
  harga1Hari: integer('harga_1hari').notNull(), // Tarif Harian Utama (24 Jam)
  harga1Minggu: integer('harga_1minggu').notNull(),
  harga2Minggu: integer('harga_2minggu').notNull(),
  harga12Jam: integer('harga_12jam').notNull(),
  harga9Jam: integer('harga_9jam').notNull(),
  harga6Jam: integer('harga_6jam').notNull(),
  harga3Jam: integer('harga_3jam').notNull(),
  dendaHarianPerJam: integer('denda_harian_per_jam').notNull().default(20000), // Default Rp20.000/jam
  fasilitas: text('fasilitas').default('2 Helm SNI + Jas Hujan'),
  spesifikasi: text('spesifikasi'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Armada Units Table (Unit Fisik Garasi / ryokou_unit)
export const armadaUnits = pgTable('armada_units', {
  id: serial('id').primaryKey(),
  kodeUnit: text('kode_unit').notNull().unique(), // Unik & Readonly permanen (e.g. 'B122')
  motorId: integer('motor_id').references(() => motorModels.id).notNull(),
  nomorPlat: text('nomor_plat').notNull(),
  warna: text('warna').notNull(),
  poolDefault: text('pool_default').notNull().default('malang'), // 'malang' | 'batu'
  statusServis: text('status_servis').notNull().default('aktif'), // 'aktif' | 'servis'
  kmTerakhir: integer('km_terakhir').default(0),
  tglServisTerakhir: text('tgl_servis_terakhir'),
  namaBengkel: text('nama_bengkel'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Lacak Units Table (Tracking Real-Time Posisi 1 Unit Fisik = 1 Baris)
export const lacakUnits = pgTable('lacak_units', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => armadaUnits.id).notNull().unique(),
  kodeUnit: text('kode_unit').notNull(),
  motorId: integer('motor_id').references(() => motorModels.id).notNull(),
  statusPosisi: text('status_posisi').notNull().default('parkir'), // 'parkir' | 'servis' | 'disewa'
  poolParkir: text('pool_parkir').default('malang'), // 'malang' | 'batu'
  namaBengkel: text('nama_bengkel'),
  kontakBengkel: text('kontak_bengkel'),
  estimasiSelesai: text('estimasi_selesai'),
  bookingId: integer('booking_id'),
  noBooking: text('no_booking'),
  namaPenyewa: text('nama_penyewa'),
  tenggatKembali: text('tenggat_kembali'),
  catatan: text('catatan'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by').default('System'),
});

// 5. Penyewaan Table (Transaksi Booking & State Machine 4 Status)
export const penyewaan = pgTable('penyewaan', {
  id: serial('id').primaryKey(),
  noBooking: text('no_booking').notNull().unique(), // Format: RYK-YYYYMMDD-XXX
  namaPenyewa: text('nama_penyewa').notNull(),
  tandaPelanggan: text('tanda_pelanggan').default('baru'), // 'baru' | 'langganan'
  jenisIdPendukung: text('jenis_id_pendukung').notNull(), // 'SIM_C'|'KTM'|'SIM_A'|'PASPOR'|'NPWP'|'ID_KARYAWAN'|'LAINNYA'
  poolArea: text('pool_area').notNull().default('malang'), // 'malang' | 'batu'
  alamatPengantaran: text('alamat_pengantaran'),
  alamatPenjemputan: text('alamat_penjemputan'),
  motorId: integer('motor_id').references(() => motorModels.id).notNull(),
  unitId: integer('unit_id').references(() => armadaUnits.id),
  snapshotNamaMotor: text('snapshot_nama_motor'),
  snapshotKodeUnit: text('snapshot_kode_unit'),
  jamTanggalMulai: text('jam_tanggal_mulai').notNull(),
  jamTanggalSelesai: text('jam_tanggal_selesai').notNull(),
  startEpoch: integer('start_epoch').notNull(),
  endEpoch: integer('end_epoch').notNull(),
  status: text('status').notNull().default('Booking'), // 'Booking' | 'Approve' | 'Disewa' | 'Selesai'
  kategoriTarif: text('kategori_tarif').notNull().default('harian'), // 'harian' | 'jam' | 'paket'
  pilihanDurasi: text('pilihan_durasi').notNull().default('1_hari'), // '1_hari' | '1_minggu' | '2_minggu' | '12_jam' | '9_jam' | '6_jam' | '3_jam'
  totalBiaya: integer('total_biaya').notNull(),
  dendaAkhir: integer('denda_akhir').default(0),
  dendaKeterangan: text('denda_keterangan'),
  riwayatTukarUnit: text('riwayat_tukar_unit'),
  disewaAt: text('disewa_at'),
  selesaiAt: text('selesai_at'),
  luarJamOperasional: boolean('luar_jam_operasional').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Pengaturan Operasional Table (Nomor WA, Bulk Pricing & Audit Log)
export const pengaturanOperasional = pgTable('pengaturan_operasional', {
  id: serial('id').primaryKey(),
  nomorWa: text('nomor_wa').notNull().default('6281234567890'),
  bulkPricePercentage: integer('bulk_price_percentage').default(0), // -50% s/d +200%
  auditLog: text('audit_log'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by').default('Admin'),
});

// Relasi Antar Tabel
export const usersRelations = relations(users, ({ many }) => ({}));

export const motorModelsRelations = relations(motorModels, ({ many }) => ({
  units: many(armadaUnits),
  penyewaan: many(penyewaan),
}));

export const armadaUnitsRelations = relations(armadaUnits, ({ one, many }) => ({
  motorModel: one(motorModels, {
    fields: [armadaUnits.motorId],
    references: [motorModels.id],
  }),
  lacak: one(lacakUnits, {
    fields: [armadaUnits.id],
    references: [lacakUnits.unitId],
  }),
  penyewaan: many(penyewaan),
}));

export const lacakUnitsRelations = relations(lacakUnits, ({ one }) => ({
  unit: one(armadaUnits, {
    fields: [lacakUnits.unitId],
    references: [armadaUnits.id],
  }),
  motorModel: one(motorModels, {
    fields: [lacakUnits.motorId],
    references: [motorModels.id],
  }),
}));

export const penyewaanRelations = relations(penyewaan, ({ one }) => ({
  motorModel: one(motorModels, {
    fields: [penyewaan.motorId],
    references: [motorModels.id],
  }),
  unit: one(armadaUnits, {
    fields: [penyewaan.unitId],
    references: [armadaUnits.id],
  }),
}));
