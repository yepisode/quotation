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
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * 2;
        this.canvas.height = rect.height * 2;
        this.ctx.scale(2, 2);
        
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.currentLineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
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