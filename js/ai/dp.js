/**
 * dp.js
 *
 * Dengan arsitektur full-simulation, DP lookahead klasik tidak lagi
 * digunakan sebagai engine utama. File ini dipertahankan untuk kompatibilitas
 * dan eksperimen, namun decision.js sudah menggunakan simulateFullBattle
 * secara langsung.
 *
 * Jika ingin menggunakan DP kembali di masa depan, fungsi ini bisa
 * diaktifkan kembali dengan memanggil simulateAction dari helper.js.
 */

export function dp() {
    // Tidak aktif — lihat simulateFullBattle di helper.js
    return 0;
}
