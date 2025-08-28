window.canvasDrawing = null;
window.itemManager = null;

function undo() {
    if (window.canvasDrawing) {
        window.canvasDrawing.undo();
    }
}

function clearCanvas() {
    if (window.canvasDrawing) {
        window.canvasDrawing.clear();
    }
}

function addOrUpdateItem() {
    if (window.itemManager) {
        window.itemManager.addOrUpdateItem();
    }
}

function cancelEdit() {
    if (window.itemManager) {
        window.itemManager.cancelEdit();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.canvasDrawing = new CanvasDrawing();
    window.itemManager = new ItemManager();
});