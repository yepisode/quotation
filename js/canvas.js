class CanvasDrawing {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#333';
        this.currentLineWidth = 2;
        this.drawingHistory = [];
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        
        // 리사이즈 이벤트에 디바운싱 적용하여 불필요한 리사이즈 방지
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.resizeCanvas(), 150);
        });
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const newWidth = rect.width * 2;
        const newHeight = rect.height * 2;
        
        // 크기가 실제로 변경되지 않았다면 리사이즈하지 않음
        if (this.canvas.width === newWidth && this.canvas.height === newHeight) {
            return;
        }
        
        // 현재 캔버스 내용을 저장
        let imageData = null;
        const isEmpty = this.isEmpty();
        if (!isEmpty) {
            imageData = this.canvas.toDataURL();
        }
        
        // 캔버스 크기 변경
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.scale(2, 2);
        
        // 스타일 설정
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentLineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 저장된 내용 복원
        if (!isEmpty && imageData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = imageData;
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.stopDrawing(), { passive: false });
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        if (e.type === 'touchstart') {
            this.startDrawing({ offsetX: x, offsetY: y });
        } else if (e.type === 'touchmove') {
            this.draw({ offsetX: x, offsetY: y });
        }
    }

    saveState() {
        this.drawingHistory.push(this.canvas.toDataURL());
        if (this.drawingHistory.length > 10) {
            this.drawingHistory.shift();
        }
    }

    startDrawing(e) {
        this.saveState();
        this.isDrawing = true;
        this.ctx.beginPath();
        this.ctx.moveTo(e.offsetX, e.offsetY);
    }

    draw(e) {
        if (!this.isDrawing) return;
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
        if (window.itemManager) {
            window.itemManager.updateAddButton();
        }
    }

    undo() {
        if (this.drawingHistory.length > 0) {
            const lastState = this.drawingHistory.pop();
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width/2, this.canvas.height/2);
            };
            img.src = lastState;
        }
    }

    clear() {
        this.saveState();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (window.itemManager) {
            window.itemManager.updateAddButton();
        }
    }

    isEmpty() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        return imageData.data.every(pixel => pixel === 0);
    }

    getDataURL() {
        return this.canvas.toDataURL();
    }

    restoreFromDataURL(dataURL) {
        const img = new Image();
        img.onload = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = dataURL;
    }

    createThumbnail() {
        const thumbnailCanvas = document.createElement('canvas');
        thumbnailCanvas.width = 120;
        thumbnailCanvas.height = 80;
        const thumbnailCtx = thumbnailCanvas.getContext('2d');
        thumbnailCtx.fillStyle = 'white';
        thumbnailCtx.fillRect(0, 0, 120, 80);
        thumbnailCtx.drawImage(this.canvas, 0, 0, 120, 80);
        
        return thumbnailCanvas.toDataURL();
    }

    clearHistory() {
        this.drawingHistory = [];
    }
}