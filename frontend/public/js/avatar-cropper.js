const CROP_SIZE = 512;

function cropStyles() {
    return `
        <style data-avatar-cropper-style>
            .avatar-crop-backdrop{position:fixed;inset:0;z-index:100000;background:rgba(30,22,16,.68);display:flex;align-items:center;justify-content:center;padding:18px}
            .avatar-crop-modal{width:min(440px,100%);background:var(--warm-white,#fffaf3);border:2px solid var(--kraft-light,#e8cba7);border-radius:20px;box-shadow:0 18px 60px rgba(0,0,0,.28);padding:20px;color:var(--text-primary,#4a3728)}
            .avatar-crop-title{font-size:1.05rem;font-weight:800;margin-bottom:5px}.avatar-crop-help{font-size:.8rem;color:var(--text-secondary,#8b7355);margin-bottom:14px}
            .avatar-crop-stage{width:min(360px,100%);aspect-ratio:1;margin:0 auto 16px;overflow:hidden;border-radius:50%;background:#eadfce;position:relative;touch-action:none;cursor:grab;box-shadow:0 0 0 3px var(--kraft-light,#e8cba7)}
            .avatar-crop-stage.is-dragging{cursor:grabbing}.avatar-crop-image{position:absolute;max-width:none;user-select:none;pointer-events:none;transform-origin:center center}
            .avatar-crop-controls{display:flex;align-items:center;gap:10px;font-size:.8rem;color:var(--text-secondary,#8b7355);margin:0 auto 16px;max-width:360px}.avatar-crop-controls input{flex:1;accent-color:var(--mint-dark,#4a9e8e)}
            .avatar-crop-actions{display:flex;justify-content:flex-end;gap:9px}.avatar-crop-actions button{font:inherit;font-weight:800;border-radius:999px;padding:9px 16px;cursor:pointer}.avatar-crop-cancel{background:transparent;border:1.5px solid var(--kraft-light,#e8cba7);color:var(--text-secondary,#7a6555)}.avatar-crop-confirm{background:var(--mint,#a8d5ba);border:1.5px solid var(--mint-dark,#4a9e8e);color:#315d47}
        </style>`;
}

function readImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => resolve({ image, url });
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh.')); };
        image.src = url;
    });
}

function canvasFile(canvas, name) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Không tạo được ảnh đã crop.'));
            resolve(new File([blob], name.replace(/\.[^.]+$/, '') + '-cropped.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', .9);
    });
}

export async function cropAvatarFile(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Vui lòng chọn file ảnh hợp lệ.');
    const loaded = await readImage(file);
    const image = loaded.image;
    const backdrop = document.createElement('div');
    backdrop.className = 'avatar-crop-backdrop';
    backdrop.innerHTML = `${cropStyles()}
        <div class="avatar-crop-modal" role="dialog" aria-modal="true" aria-label="Chỉnh sửa ảnh đại diện">
            <div class="avatar-crop-title">Chỉnh sửa ảnh đại diện</div>
            <div class="avatar-crop-help">Kéo ảnh để chọn vùng hiển thị, dùng thanh trượt để phóng to/thu nhỏ.</div>
            <div class="avatar-crop-stage"><img class="avatar-crop-image" alt="Xem trước ảnh đại diện"></div>
            <label class="avatar-crop-controls"><span>Thu phóng</span><input type="range" min="1" max="3" step=".01" value="1" aria-label="Thu phóng ảnh"></label>
            <div class="avatar-crop-actions"><button type="button" class="avatar-crop-cancel">Hủy</button><button type="button" class="avatar-crop-confirm">Dùng ảnh này</button></div>
        </div>`;
    document.head.insertAdjacentHTML('beforeend', cropStyles());
    document.body.appendChild(backdrop);

    const stage = backdrop.querySelector('.avatar-crop-stage');
    const preview = backdrop.querySelector('.avatar-crop-image');
    const zoom = backdrop.querySelector('input');
    preview.src = loaded.url;
    const baseScale = Math.max(stage.clientWidth / image.width, stage.clientHeight / image.height);
    const state = { scale: baseScale, zoom: 1, x: 0, y: 0, startX: 0, startY: 0, dragging: false };

    const render = () => {
        state.scale = baseScale * state.zoom;
        preview.style.width = `${image.width * state.scale}px`;
        preview.style.height = `${image.height * state.scale}px`;
        preview.style.left = `${(stage.clientWidth - image.width * state.scale) / 2 + state.x}px`;
        preview.style.top = `${(stage.clientHeight - image.height * state.scale) / 2 + state.y}px`;
    };
    render();

    const result = await new Promise((resolve, reject) => {
        const close = (value, error) => { URL.revokeObjectURL(loaded.url); backdrop.remove(); if (error) reject(error); else resolve(value); };
        backdrop.querySelector('.avatar-crop-cancel').addEventListener('click', () => close(null));
        backdrop.addEventListener('click', (event) => { if (event.target === backdrop) close(null); });
        zoom.addEventListener('input', () => { state.zoom = Number(zoom.value); render(); });
        stage.addEventListener('pointerdown', (event) => { state.dragging = true; state.startX = event.clientX - state.x; state.startY = event.clientY - state.y; stage.classList.add('is-dragging'); stage.setPointerCapture(event.pointerId); });
        stage.addEventListener('pointermove', (event) => { if (!state.dragging) return; state.x = event.clientX - state.startX; state.y = event.clientY - state.startY; render(); });
        stage.addEventListener('pointerup', () => { state.dragging = false; stage.classList.remove('is-dragging'); });
        backdrop.querySelector('.avatar-crop-confirm').addEventListener('click', async () => {
            const canvas = document.createElement('canvas');
            canvas.width = CROP_SIZE; canvas.height = CROP_SIZE;
            const ctx = canvas.getContext('2d');
            const ratio = CROP_SIZE / stage.clientWidth;
            const left = (stage.clientWidth - image.width * state.scale) / 2 + state.x;
            const top = (stage.clientHeight - image.height * state.scale) / 2 + state.y;
            ctx.drawImage(image, left * -ratio, top * -ratio, image.width * state.scale * ratio, image.height * state.scale * ratio);
            try { close(await canvasFile(canvas, file.name)); } catch (error) { close(null, error); }
        });
    });
    return result;
}
