# bitsmon

## Penjelasan Projek
**Bitsmon** adalah program yang menampilkan simulasi *auto battle* dengan menggunakan kombinasi algoritma secara **hybrid (Greedy + Dynamic Programming / DP)**. Program ini melakukan perhitungan secara otomatis untuk mencari strategi serangan yang paling optimal di setiap giliran (turn) pada saat bertarung melawan musuh-musuh secara bergelombang (waves).

## Tata Cara Run Projek

Pastikan Anda telah menginstal **[Node.js](https://nodejs.org/)** di sistem/komputer Anda. 
Buka terminal/Command Prompt/PowerShell, lalu arahkan *directory* ke dalam folder projek ini.

Berikut adalah perintah-perintah yang dapat digunakan untuk menjalankan program:

### 1. Menjalankan Perbandingan (Greedy vs Hybrid)
Perintah ini akan menjalankan simulasi untuk kedua algoritma lalu membandingkan hasil skor, sisa HP, Energy, dan SP di akhir *campaign*.
```bash
npm start
```
atau
```bash
npm run compare
```

### 2. Menjalankan Mode Greedy Saja
Jika Anda hanya ingin menjalankan simulasi pertempuran menggunakan algoritma **Greedy**.
```bash
npm run greedy
```

### 3. Menjalankan Mode Hybrid Saja
Jika Anda hanya ingin menjalankan simulasi pertempuran menggunakan algoritma **Hybrid (Greedy + DP)**.
```bash
npm run hybrid
```

---

**Alternatif (Menjalankan langsung dengan Node):**
Jika Anda tidak menggunakan perintah NPM, Anda dapat memanggil file utama secara langsung:
- Perbandingan: `node js/main.js`
- Mode Greedy: `node js/main.js --mode greedy`
- Mode Hybrid: `node js/main.js --mode hybrid`
