#!/usr/bin/env bash
# ==============================================================================
# ZLCE RECOVERY SNAPSHOT v3.2.2
# Skrip pengambilan snapshot status git dan Write-Ahead Log (WAL) untuk recovery.
# Digunakan saat sesi terputus, pindah AI, atau verifikasi status darurat.
# ==============================================================================

set -u

SHOW_DIFF=false
PROJECT_ROOT="."

for arg in "$@"; do
  case "$arg" in
    --diff)
      SHOW_DIFF=true
      ;;
    -h|--help)
      echo "Penggunaan: bash scripts/zlce/zlce-snapshot.sh [--diff] [project_root]"
      echo "  --diff        Menyertakan keluaran 'git diff HEAD' lengkap"
      echo "  project_root  Direktori dasar proyek (default: .)"
      exit 0
      ;;
    *)
      if [[ ! "$arg" =~ ^-- ]]; then
        PROJECT_ROOT="$arg"
      fi
      ;;
  esac
done

cd "$PROJECT_ROOT" 2>/dev/null || {
  echo "[ERROR] Direktori $PROJECT_ROOT tidak dapat diakses." >&2
  exit 2
}

# Deteksi lokasi SESSION_STATE.md
STATE_FILE="SESSION_STATE.md"
if [[ ! -f "$STATE_FILE" && -f "FOLDER_KERJA/SESSION_STATE.md" ]]; then
  STATE_FILE="FOLDER_KERJA/SESSION_STATE.md"
fi

CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S %Z" 2>/dev/null || date +"%Y-%m-%d jam: ?")

echo "=== ZLCE RECOVERY SNAPSHOT [$CURRENT_TIME] ==="
echo "State File: $STATE_FILE"
echo ""

# 1. GIT STATUS
echo "--- 1. GIT STATUS (SHORT) ---"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_STATUS=$(git status --short 2>&1)
  if [[ -z "$GIT_STATUS" ]]; then
    echo "(working tree bersih / clean)"
  else
    echo "$GIT_STATUS"
  fi
else
  echo "[WARN] Bukan repositori Git atau Git tidak tersedia."
fi
echo ""

# 2. GIT LOG TERAKHIR
echo "--- 2. GIT RECENT COMMITS (-5) ---"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git log -5 --oneline 2>&1 || echo "(belum ada commit)"
else
  echo "(git tidak aktif)"
fi
echo ""

# 3. GIT DIFF STAT
echo "--- 3. GIT DIFF STAT ---"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  DIFF_STAT=$(git diff --stat HEAD 2>/dev/null || git diff --stat 2>/dev/null)
  if [[ -z "$DIFF_STAT" ]]; then
    echo "(tidak ada diff uncommitted)"
  else
    echo "$DIFF_STAT"
  fi
else
  echo "(git tidak aktif)"
fi
echo ""

# 4. KANDUNGAN WAL DARI SESSION_STATE.md
echo "--- 4. WRITE-AHEAD LOG (WAL) DARI STATE ---"
if [[ -f "$STATE_FILE" ]]; then
  awk '/^## 3\. WORK IN PROGRESS/,/^## 4\. ASSUMPTIONS/' "$STATE_FILE" 2>/dev/null | grep -v '^## 4\.' | sed '$d'
else
  echo "[WARN] $STATE_FILE tidak ditemukan."
fi
echo ""

# 5. KLASIFIKASI KASUS RECOVERY
echo "--- 5. INDIKATOR RECOVERY (KASUS A-D) ---"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  STATUS_LINES=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$STATUS_LINES" -eq 0 ]]; then
    echo "Rekomendasi Kasus: KASUS A (Working tree bersih)."
    echo "Tindakan: Lanjutkan langkah pertama task aktif yang tercatat di WAL atau ambil task READY berikutnya."
  else
    echo "Rekomendasi Kasus: KASUS B atau KASUS D (Ada perubahan uncommitted)."
    echo "Tindakan: Periksa apakah berkas di atas cocok dengan field 'Berkas Direncanakan/Disentuh' pada WAL."
    echo "  - Jika cocok: KASUS B (pertahankan perubahan, verifikasi AC, lalu commit)."
    echo "  - Jika ada berkas di luar WAL: KASUS D (tahan perubahan, ubah task ke BLOCKED, minta persetujuan)."
  fi
else
  echo "Rekomendasi Kasus: Non-Git Environment (periksa integritas berkas secara manual)."
fi
echo ""

# 6. DIFF LENGKAP (Bila diminta via --diff)
if [ "$SHOW_DIFF" = true ]; then
  echo "--- 6. UNCOMMITTED DIFF FULL (--diff) ---"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    DIFF_FULL=$(git diff HEAD 2>/dev/null || git diff 2>/dev/null)
    if [[ -z "$DIFF_FULL" ]]; then
      echo "(diff kosong)"
    else
      echo "$DIFF_FULL"
    fi
  else
    echo "(git tidak aktif)"
  fi
  echo ""
fi

echo "=== END RECOVERY SNAPSHOT ==="
