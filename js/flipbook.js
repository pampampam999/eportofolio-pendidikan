/* =====================================================
   2. Flipbook & PDF.js Logic (js/flipbook.js)
===================================================== */

// Konfigurasi Worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener("DOMContentLoaded", () => {
    // LOGIKA BUKA & TUTUP MODAL FLIPBOOK
    const modal = document.getElementById('flipbook-modal');
    const modalClose = document.querySelector('.modal-close');
    const artifactCards = document.querySelectorAll('.artifact-card');

    artifactCards.forEach(card => {
        card.addEventListener('click', () => {
            const pdfUrl = card.getAttribute('data-flipbook');
            if (pdfUrl && modal) {
                modal.classList.add('active');
                loadLocalPdfToFlipbook(pdfUrl);
            }
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function closeModal() {
        if (modal) modal.classList.remove('active');
        const container = document.getElementById('pdf-flipbook-container');
        if (container) container.innerHTML = ''; // Clear canvas memori
    }
});

// FUNGSI RENDER PDF LOKAL KE FLIPBOOK
async function loadLocalPdfToFlipbook(pdfUrl) {
    const container = document.getElementById('pdf-flipbook-container');
    if (!container) return;

    container.innerHTML = '<p style="color:white; text-align:center; padding-top:20px;">Memuat dokumen flipbook...</p>';

    try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        container.innerHTML = ''; 

        const pagesContainer = document.createElement('div');
        pagesContainer.id = 'flipbook-pages';
        container.appendChild(pagesContainer);

        // Buat Cover Depan Kustom berbasis HTML
        const customCover = document.createElement('div');
        customCover.className = 'my-page';
        customCover.setAttribute('data-density', 'hard');
        customCover.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; color: #333; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f8fafc;">
                <img src="assets/images/Logo_Almamater_UPI.svg.webp" style="width: 80px; margin-bottom: 20px;">
                <h2 style="font-size: 20px; color: #0f172a; margin-bottom: 10px;">E-PORTFOLIO PPG</h2>
                <p style="font-size: 14px; color: #64748b;">Modul Ajar & Perangkat Pembelajaran</p>
            </div>
        `;
        pagesContainer.appendChild(customCover);

        // Render PDF untuk Halaman Isi
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.8 }); 
            
            const pageDiv = document.createElement('div');
            pageDiv.className = 'my-page';
            pageDiv.style.backgroundColor = '#ffffff';
            pageDiv.style.position = 'relative';

            if (pageNum === 1 || pageNum === pdf.numPages) {
                pageDiv.setAttribute('data-density', 'hard');
            } else {
                pageDiv.setAttribute('data-density', 'soft');
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            canvas.style.width = '100%';
            canvas.style.height = '100%';

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            pageDiv.appendChild(canvas);

            // Badge Overlay pada lembar PDF pertama
            if (pageNum === 1) {
                const badge = document.createElement('div');
                badge.innerHTML = `
                    <div style="
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        background: linear-gradient(135deg, #06b6d4, #3b82f6);
                        color: white;
                        padding: 6px 14px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: bold;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                        z-index: 10;
                        pointer-events: none;
                    ">
                        <i class="ph ph-seal-check"></i> Verified Artifact
                    </div>
                `;

                pageDiv.appendChild(badge);
            }

            
            
            pagesContainer.appendChild(pageDiv);
        }

        // Pengecekan Library PageFlip
        if (typeof St === 'undefined' || typeof St.PageFlip === 'undefined') {
            throw new Error("Library St.PageFlip gagal dimuat dari CDN. Silakan cek koneksi internet atau gunakan file lokal.");
        }

        // Inisialisasi PageFlip
        const pageFlip = new St.PageFlip(pagesContainer, {
            width: 450,
            height: 600,
            size: 'stretch',
            minWidth: 300,
            maxWidth: 800,
            showCover: true,
            flippingTime: 700,
            drawShadow: true,
            maxShadowOpacity: 0.6,
            usePortrait: true,
            disableFlipByClick: false
        });

        pageFlip.loadFromHTML(pagesContainer.querySelectorAll('.my-page'));

        // ➕ TAMBAHKAN HINT BADGE DI BAWAH FLIPBOOK
        const hintBadge = document.createElement('div');
        hintBadge.innerHTML = `
            <div style="
                margin-top: 15px;
                text-align: center;
                color: #94a3b8;
                font-size: 13px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            ">
                <i class="ph ph-hand-swipe-left" style="font-size:18px; color:#06b6d4;"></i> 
                <span>Klik & geser sudut halaman atau gunakan panah <kbd style="background:#334155; padding:2px 6px; border-radius:4px; color:#fff;">←</kbd> <kbd style="background:#334155; padding:2px 6px; border-radius:4px; color:#fff;">→</kbd> keyboard</span>
            </div>
        `;
        container.appendChild(hintBadge);

    } catch (error) {
        console.error("Detail Error Flipbook:", error);
        container.innerHTML = `
            <div style="text-align:center; padding: 20px; color:#ef4444;">
                <p><b>Gagal memuat Flipbook:</b> ${error.message}</p>
            </div>
        `;
    }
}