class Utils {
    static createTextThumbnail(text) {
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 120;
        textCanvas.height = 80;
        const textCtx = textCanvas.getContext('2d');
        textCtx.fillStyle = 'white';
        textCtx.fillRect(0, 0, 120, 80);
        textCtx.fillStyle = '#333';
        textCtx.font = '14px sans-serif';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        
        const maxWidth = 110;
        const words = text.split(' ');
        let line = '';
        let y = 30;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = textCtx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && i > 0) {
                textCtx.fillText(line, 60, y);
                line = words[i] + ' ';
                y += 20;
            } else {
                line = testLine;
            }
        }
        textCtx.fillText(line, 60, y);
        
        return textCanvas.toDataURL();
    }

    static validateNumberInput(e) {
        const value = e.target.value;
        const regex = /^\d*\.?\d*$/;
        if (!regex.test(value)) {
            e.target.value = value.slice(0, -1);
        }
    }

    static formatNumber(number) {
        return number.toLocaleString();
    }

    static smoothScrollTo(element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}