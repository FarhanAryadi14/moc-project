# 🍽️ Sistem Antrean & Manajemen Meja Restoran (Fullstack Developer Take-Home Test)

Aplikasi manajemen antrean dan meja restoran serba otomatis dan interaktif berbasis **Laravel 11 Monolith + React (Vite)**. Dirancang dengan standar industri untuk keamanan, skalabilitas, keterbacaan kode (*clean code*), serta pengujian otomatis (*automated unit tests*).

---

## 📌 Fitur Utama (8 Fitur Frontend & Core Backend)

1. **Denah Restoran Interaktif (Grid Meja)**: Visualisasi 4 meja utama dengan kapasitas spesifik: `Meja A (2)`, `Meja B (4)`, `Meja C (6)`, dan `Meja D (8)`.
2. **Status Warna Otomatis**:
   - 🟢 **Hijau (Available)**: Meja kosong & siap ditempati.
   - 🔵 **Biru (Just Served)**: Baru didudukkan (< 2 menit).
   - 🟡 **Kuning (Occupied)**: Sedang makan dalam fase sedang.
   - 🔴 **Merah (Ending Soon)**: Sisa waktu makan < 5 menit / *overdue*.
3. **Drag & Drop dengan Validasi Kapasitas**:
   - Tarik pelanggan dari *waiting queue* langsung ke kartu meja.
   - Indikator target visual real-time: **Hijau** jika `party_size <= capacity` dan meja kosong, **Merah** jika melebihi kapasitas atau meja terisi.
4. **Live Countdown Timer (Date.now-based)**:
   - Pengoperasian timer berbasis selisih timestamp `Date.now()` untuk mencegah kebocoran waktu/drift saat tab browser di-background.
5. **Force Complete & Auto-Serve**:
   - Tombol *Force Complete* untuk mengosongkan meja secara instan dan otomatis mendudukkan antrean pelanggan dengan prioritas tertinggi yang muat.
6. **Queue Visualization (Priority Order)**:
   - Antrean berurut berdasarkan **party size terbesar dulu** (bukan FIFO), dengan lencana ranking prioritas (#1, #2, dst).
7. **History Table dengan Multi-Column Sorting**:
   - Tabel riwayat sesi makan dengan fitur pengurutan multi-kolom (*Customer Name, Party Size, Table, Seated Time, Duration, Status*) hanya dengan mengklik header tabel.
8. **Search & Filter Real-Time**:
   - Pencarian berdasarkan nama pelanggan / nomor meja serta filter status dan party size secara instan.

---

## 🏗️ Arsitektur & Pola Desain (Design Patterns)

### Backend (Laravel 11 & PHP 8.3)
- **Service-Action Pattern**:
  - `TableAssignmentService`: Menangani algoritma *Best-Fit Table Allocation* (meja kosong terkecil dengan `capacity >= party_size`).
  - `QueuePriorityService`: Menangani pengurutan antrean prioritas (`party_size` DESC, `arrived_at` ASC).
  - `DiningService`: Menangani penghitungan durasi makan `(party * 15) + random(5-15 menit)`, alokasi status, dan otomatisasi *auto-serve*.
- **Validation**: Strict `FormRequest` validation (`ArrivePartyRequest`, `ServePartyRequest`).
- **REST API Endpoints**:
  - `POST /api/arrive` - Pendaftaran pelanggan baru.
  - `GET /api/status` - Mendapatkan data real-time meja, timer, dan queue.
  - `POST /api/serve` - Mendudukkan pelanggan dari queue atau force complete meja.
  - `GET /api/history` - Mendapatkan riwayat sesi dengan pencarian dan sorting multi-kolom.

### Frontend (React 18 + Vite + Tailwind CSS + Lucide Icons)
- **Custom Hooks**:
  - `useExactTimer`: Perhitungan sisa waktu berbasis selisih `Date.now()` tanpa kelelahan tab browser.
- **Modular Components**:
  - `<TableGrid />`, `<TableCard />`, `<QueueList />`, `<HistoryTable />`, `<ArriveModal />`, `<LiveTimer />`.

---

## 🛠️ Cara Menjalankan Aplikasi di Lokal (Laragon / PHP & Node)

### Prasyarat:
- PHP 8.2 / 8.3 (Tersedia via Laragon / Native)
- Node.js >= 18 & NPM >= 9
- Composer >= 2.5
- SQLite / MySQL

### Langkah-langkah Quickstart:

```bash
# 1. Clone repositori & masuk ke direktori
git clone <repository-url>
cd moc-project

# 2. Install dependensi Backend & Frontend
composer install
npm install --legacy-peer-deps

# 3. Setup Lingkungan (.env)
cp .env.example .env
php artisan key:generate

# 4. Run Migrasi Database & Seeder (Meja A, B, C, D)
php artisan migrate:fresh --seed

# 5. Build Frontend Assets
npm run build

# 6. Jalankan Local Server
php artisan serve
```

Akses aplikasi pada browser di: **`http://127.0.0.1:8000`**

---

## 🧪 Pengujian Otomatis (Unit Testing)

Aplikasi dilengkapi dengan suite pengujian otomatis lengkap backend & frontend.

### 1. Backend Unit Tests (PHPUnit - 8 Test Cases Passed)
```bash
php artisan test --testsuite=Feature
```
- ✅ `test_1_party_arrival_validation_rejects_invalid_input`
- ✅ `test_2_best_fit_table_assignment_places_party_in_smallest_matching_table`
- ✅ `test_3_queue_priority_ordering_prioritizes_larger_party_size`
- ✅ `test_4_auto_assignment_on_arrival_seats_customer_immediately`
- ✅ `test_5_party_queued_when_no_table_available`
- ✅ `test_6_force_complete_dining_session_frees_table`
- ✅ `test_7_auto_serve_next_queued_party_upon_table_completion`
- ✅ `test_8_history_filtering_and_sorting`

### 2. Frontend Unit Tests (Vitest - 6 Test Cases Passed)
```bash
npm run test:frontend
```
- ✅ `renders interactive restaurant table grid A(2), B(4), C(6), D(8)`
- ✅ `visualizes priority-ordered queue with party size priority ranking`
- ✅ `supports drag and drop event handling`
- ✅ `calculates Date.now-based live countdown timer without drift`
- ✅ `triggers multi-column sorting when clicking column headers`
- ✅ `provides search input & status filter controls`

---

## 🚀 CI/CD Pipeline (`.github/workflows/ci.yml`)

Workflow GitHub Actions terkonfigurasi untuk:
1. Memeriksa sintaks PHP 8.3 & Node.js 20.
2. Menjalankan pengujian unit backend (PHPUnit) pada database in-memory.
3. Menjalankan pengujian unit frontend (Vitest).
4. Melakukan kompilasi bundle frontend produksi (`npm run build`).

---

## 💡 Bagian 3 — Bonus: Strategi Optimasi Revenue

### Permasalahan:
> Bagaimana menahan party kecil (misal: 2 orang) dari menduduki meja besar (misal: Meja D kapasitas 8 orang) saat meja kecil terisi, tanpa membuat party kecil tersebut menunggu terlalu lama?

### Solusi Algoritma: *Hold & Reserve Threshold with Dynamic Timeout*

Strategi ini mengombinasikan **Holding Reservation Window** dengan **Maximum Wait Timeout Guard**:

1. **Holding Rule (Penahanan Sementara)**:
   Meja besar (Kapasitas $\ge 6$) dilarang secara otomatis ditempati oleh party kecil (Kapasitas $\le 3$) jika *occupancy rate* restoran masih stabil dan perkiraan party besar datang dalam rentang waktu singkat.
2. **Maximum Wait Timeout Guard (Batas Waktu Maksimal)**:
   Jika party kecil telah menunggu di queue melebihi ambang batas toleransi (misal: `MAX_WAIT_TIMEOUT = 15 menit`), aturan holding **dilepas (*bypassed*)**, dan party kecil diizinkan menduduki meja besar daripada membiarkan meja besar kosong dan pelanggan kecewa.

```mermaid
graph TD
    A[Customer Tiba: Party Kecil Size <= 3] --> B{Apakah Meja Kecil A/B Kosong?}
    B -- Ya --> C[Assign ke Meja Kecil Best-Fit]
    B -- Tidak --> D{Apakah Waktu Tunggu Party > 15 Menit?}
    D -- Ya --> E[RELEASE HOLD: Assign ke Meja Besar D(8) demi kepuasan]
    D -- Tidak --> F{Apakah Queue Berisi Party Besar Size >= 6?}
    F -- Ya --> G[Hold Meja Besar D(8) untuk Party Besar]
    F -- Tidak --> H[Masuk Waiting Queue Prioritas]
```

### Matriks Trade-off:

| Strategi | Revenue Restoran | Kepuasan Pelanggan Kecil | Utilitas Meja | Risiko |
| :--- | :--- | :--- | :--- | :--- |
| **Strict Pure FIFO** | Low (Meja D diisi 2 org) | High | Poor | Kehilangan omset dari party 8 orang |
| **Strict Large-Only Hold** | High | Low (Party 2 nunggu lama) | Moderate | Pelanggan party kecil kabur / komplain |
| **Dynamic Hold + Timeout (Proposed)** | **Optimal (High)** | **Balanced (High)** | **Optimal** | Diimbangi ambang batas waktu 15 mnt |

### Pseudocode Implementation:

```python
def assign_table_with_revenue_protection(party, available_tables, queue):
    MAX_WAIT_TIMEOUT_MINUTES = 15
    LARGE_TABLE_THRESHOLD = 6
    
    # 1. Cari meja pas (Best Fit)
    best_fit = find_smallest_available_table(capacity_ge=party.size)
    
    if not best_fit:
        return None  # Masuk queue
        
    # 2. Cek jika meja yang cocok adalah Meja Besar (capacity >= 6) tapi party kecil (size <= 3)
    if best_fit.capacity >= LARGE_TABLE_THRESHOLD and party.size <= 3:
        wait_time = current_time() - party.arrived_at
        
        # Jika belum melebihi batas waktu tunggu dan ada potensi party besar di queue
        if wait_time < MAX_WAIT_TIMEOUT_MINUTES:
            has_large_party_waiting = any(p.size >= 6 for p in queue)
            if has_large_party_waiting:
                # Hold meja besar untuk party besar, tahan party kecil di queue
                return HOLD_TABLE_FOR_LARGE_PARTY
                
    # 3. Jika lulus atau sudah timeout, dudukkan party
    return seat_party_at_table(party, best_fit)
```

---

## 📄 Lisensi & Kredit

Dikembangkan untuk **Take-Home Assessment Fullstack Developer**. Semua logika dan arsitektur ditulis secara independen dengan standar kualitas produksi tinggi.
