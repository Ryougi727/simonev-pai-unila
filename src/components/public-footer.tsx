export function PublicFooter() {
  return (
    <footer id="tentang" className="border-t border-outline-variant/40 bg-surface-container-low mt-16">
      <div className="max-w-6xl mx-auto px-5 py-10 text-sm text-on-surface-variant">
        <div className="font-display text-base font-bold text-on-surface mb-2">SIMONEV PAI</div>
        <p className="max-w-xl leading-relaxed mb-4">
          Sistem Monitoring dan Evaluasi Praktikum Pendidikan Agama Islam — dikelola oleh Tim Praktikum Pendidikan Agama Islam,
          Universitas Lampung, untuk membantu koordinasi praktikum, dokumentasi kegiatan, dan penyebaran informasi kajian
          maupun acara kepada seluruh mentor dan praktikan.
        </p>
        <p className="text-xs text-on-surface-variant/70">© {new Date().getFullYear()} SIMONEV PAI — Universitas Lampung.</p>
      </div>
    </footer>
  );
}
