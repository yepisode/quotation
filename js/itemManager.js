class ItemManager {
    constructor() {
        this.items = [];
        this.editingItemId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAddButton();
    }

    setupEventListeners() {
        document.getElementById('quantity').addEventListener('input', () => this.updateAddButton());
        document.getElementById('price').addEventListener('input', () => this.updateAddButton());
        document.getElementById('quantity').addEventListener('input', Utils.validateNumberInput);
        document.getElementById('price').addEventListener('input', Utils.validateNumberInput);
    }

    updateAddButton() {
        const itemName = document.getElementById('itemName').value.trim();
        const price = document.getElementById('price').value;
        const hasDrawing = window.canvasDrawing && !window.canvasDrawing.isEmpty();
        
        const addBtn = document.getElementById('addBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        
        if (this.editingItemId) {
            const existingItem = this.items.find(item => item.id === this.editingItemId);
            const hasExistingItemData = existingItem && (existingItem.hasTextName || existingItem.hasDrawnImage);
            
            addBtn.classList.add('update');
            addBtn.textContent = '수정 완료';
            cancelBtn.style.display = 'block';
            
            if (price && (itemName || hasDrawing || hasExistingItemData)) {
                addBtn.disabled = false;
            } else {
                addBtn.disabled = true;
            }
        } else {
            addBtn.classList.remove('update');
            addBtn.textContent = '품목 추가';
            cancelBtn.style.display = 'none';
            
            if (price && (itemName || hasDrawing)) {
                addBtn.disabled = false;
            } else {
                addBtn.disabled = true;
                if (!price) {
                    addBtn.textContent = '단가를 입력하세요';
                } else if (!itemName && !hasDrawing) {
                    addBtn.textContent = '품목명을 입력하거나 그려주세요';
                }
            }
        }
    }

    addOrUpdateItem() {
        if (this.editingItemId) {
            this.updateItem();
        } else {
            this.addItem();
        }
    }

    addItem() {
        const itemNameInput = document.getElementById('itemName').value.trim();
        const quantityInput = document.getElementById('quantity').value;
        const quantity = quantityInput ? parseFloat(quantityInput) : 1;
        const price = parseFloat(document.getElementById('price').value);
        
        if (!price) return;
        
        const hasItemName = itemNameInput.length > 0;
        const hasDrawing = window.canvasDrawing && !window.canvasDrawing.isEmpty();
        
        if (!hasItemName && !hasDrawing) return;

        const itemData = this.createItemData(itemNameInput, hasItemName, hasDrawing, quantity, price);
        this.items.push(itemData);
        
        this.updateItemsList();
        this.updateTotals();
        this.clearForm();
    }

    updateItem() {
        const itemNameInput = document.getElementById('itemName').value.trim();
        const quantityInput = document.getElementById('quantity').value;
        const quantity = quantityInput ? parseFloat(quantityInput) : 1;
        const price = parseFloat(document.getElementById('price').value);
        
        if (!price) return;
        
        const hasItemName = itemNameInput.length > 0;
        const hasDrawing = window.canvasDrawing && !window.canvasDrawing.isEmpty();
        
        const existingItem = this.items.find(item => item.id === this.editingItemId);
        
        let itemDisplay = '';
        let thumbnailData = '';
        let hasTextName = false;
        let hasDrawnImage = false;
        let originalTextName = '';
        let originalDrawing = '';

        if (hasItemName) {
            itemDisplay = itemNameInput;
            thumbnailData = Utils.createTextThumbnail(itemNameInput);
            hasTextName = true;
            originalTextName = itemNameInput;
        } else if (hasDrawing) {
            itemDisplay = '(그림)';
            thumbnailData = window.canvasDrawing.createThumbnail();
            hasDrawnImage = true;
            originalDrawing = window.canvasDrawing.getDataURL();
        } else if (existingItem) {
            itemDisplay = existingItem.name;
            thumbnailData = existingItem.drawing;
            hasTextName = existingItem.hasTextName;
            hasDrawnImage = existingItem.hasDrawnImage;
            originalTextName = existingItem.originalTextName;
            originalDrawing = existingItem.originalDrawing;
        }

        const subtotal = quantity * price;
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        const updatedItem = {
            id: this.editingItemId,
            name: itemDisplay,
            drawing: thumbnailData,
            quantity: quantity,
            price: price,
            subtotal: subtotal,
            tax: tax,
            total: total,
            quantityEntered: document.getElementById('quantity').value.trim() !== '',
            hasTextName: hasTextName,
            hasDrawnImage: hasDrawnImage,
            originalTextName: originalTextName,
            originalDrawing: originalDrawing
        };

        const itemIndex = this.items.findIndex(item => item.id === this.editingItemId);
        if (itemIndex !== -1) {
            this.items[itemIndex] = updatedItem;
        }
        
        this.updateItemsList();
        this.updateTotals();
        this.clearForm();
        this.exitEditMode();
    }

    createItemData(itemNameInput, hasItemName, hasDrawing, quantity, price, existingId = null) {
        let itemDisplay = '';
        let thumbnailData = '';
        let hasTextName = false;
        let hasDrawnImage = false;

        if (hasItemName) {
            itemDisplay = itemNameInput;
            thumbnailData = Utils.createTextThumbnail(itemNameInput);
            hasTextName = true;
        } else if (hasDrawing) {
            itemDisplay = '(그림)';
            thumbnailData = window.canvasDrawing.createThumbnail();
            hasDrawnImage = true;
        }

        const subtotal = quantity * price;
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        return {
            id: existingId || Date.now(),
            name: itemDisplay,
            drawing: thumbnailData,
            quantity: quantity,
            price: price,
            subtotal: subtotal,
            tax: tax,
            total: total,
            quantityEntered: document.getElementById('quantity').value.trim() !== '',
            hasTextName: hasTextName,
            hasDrawnImage: hasDrawnImage,
            originalTextName: hasTextName ? itemNameInput : '',
            originalDrawing: hasDrawnImage ? window.canvasDrawing.getDataURL() : ''
        };
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (!item) return;

        this.editingItemId = id;
        
        if (item.hasTextName) {
            document.getElementById('itemName').value = item.originalTextName;
        } else {
            document.getElementById('itemName').value = '';
        }

        if (item.hasDrawnImage && item.originalDrawing && window.canvasDrawing) {
            window.canvasDrawing.restoreFromDataURL(item.originalDrawing);
        }
        
        if (item.quantityEntered) {
            document.getElementById('quantity').value = item.quantity;
        } else {
            document.getElementById('quantity').value = '';
        }
        document.getElementById('price').value = item.price;
        
        this.updateAddButton();
        
        Utils.smoothScrollTo(document.querySelector('.input-section'));
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.updateItemsList();
        this.updateTotals();
    }

    cancelEdit() {
        this.exitEditMode();
        this.clearForm();
    }

    exitEditMode() {
        this.editingItemId = null;
        this.updateAddButton();
    }

    clearForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('price').value = '';
        if (window.canvasDrawing) {
            window.canvasDrawing.clear();
            window.canvasDrawing.clearHistory();
        }
        this.updateAddButton();
    }

    updateItemsList() {
        const itemsList = document.getElementById('itemsList');
        
        if (this.items.length === 0) {
            itemsList.innerHTML = '<div class="empty-state">추가된 품목이 없습니다</div>';
            return;
        }

        itemsList.innerHTML = this.items.map(item => {
            const quantityDisplay = item.quantityEntered ? 
                `<div class="item-details">수량: ${Utils.formatNumber(item.quantity)}</div>` : '';
            
            return `
            <div class="item">
                <img src="${item.drawing}" alt="품목 그림" class="item-drawing">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    ${quantityDisplay}
                    <div class="item-details">단가: ${Utils.formatNumber(item.price)}원</div>
                    <div class="item-subtotal">${Utils.formatNumber(item.subtotal)}원</div>
                    <div class="item-total">세금 포함: ${Utils.formatNumber(item.total)}원</div>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="window.itemManager.editItem(${item.id})">수정</button>
                    <button class="delete-btn" onclick="window.itemManager.deleteItem(${item.id})">삭제</button>
                </div>
            </div>
        `}).join('');
    }

    updateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = this.items.reduce((sum, item) => sum + item.tax, 0);
        const total = this.items.reduce((sum, item) => sum + item.total, 0);
        
        document.getElementById('subtotal').textContent = Utils.formatNumber(subtotal);
        document.getElementById('tax').textContent = Utils.formatNumber(tax);
        document.getElementById('total').textContent = Utils.formatNumber(total);
        
        if (window.pdfGenerator) {
            window.pdfGenerator.updatePDFButton();
        }
    }
}