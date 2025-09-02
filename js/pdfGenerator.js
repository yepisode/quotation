class PDFGenerator {
    constructor() {
        this.setupPDFButton();
    }

    setupPDFButton() {
        this.updatePDFButton();
    }

    updatePDFButton() {
        const pdfBtn = document.getElementById('pdfBtn');
        const hasItems = window.itemManager && window.itemManager.items.length > 0;
        
        if (hasItems) {
            pdfBtn.disabled = false;
            pdfBtn.textContent = '견적서 PDF 다운로드';
        } else {
            pdfBtn.disabled = true;
            pdfBtn.textContent = '품목을 추가한 후 PDF를 다운로드할 수 있습니다';
        }
    }

    generatePDF() {
        if (!window.itemManager || window.itemManager.items.length === 0) {
            alert('PDF를 생성하려면 먼저 품목을 추가해주세요.');
            return;
        }

        this.populateQuotationTemplate();
        this.createPDFFromTemplate();
    }

    populateQuotationTemplate() {
        const currentDate = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        document.getElementById('quotationDate').textContent = currentDate;
        
        // 회사 정보 기본값 설정
        document.getElementById('businessNumber').textContent = '000-00-00000';
        document.getElementById('companyName').textContent = '회사명';
        document.getElementById('ownerName').textContent = '대표자명';
        document.getElementById('companyAddress').textContent = '사업장 주소';
        document.getElementById('businessType').textContent = '업태';
        document.getElementById('businessItem').textContent = '종목';
        document.getElementById('phoneNumber').textContent = '전화번호';
        document.getElementById('receiverName').textContent = '고객사';

        this.populateItemsTable();
        this.populateTotals();
    }

    generateQuotationNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `Q${year}${month}${day}-${random}`;
    }

    populateItemsTable() {
        const tableBody = document.getElementById('quotationItemsTable');
        const items = window.itemManager.items;
        
        tableBody.innerHTML = items.map((item, index) => {
            const itemName = item.hasTextName ? item.originalTextName : '(그림)';
            const quantity = Utils.formatNumber(item.quantity);
            const price = Utils.formatNumber(item.price);
            const subtotal = Utils.formatNumber(item.subtotal);
            const tax = Utils.formatNumber(item.tax);
            
            const itemContent = item.hasDrawnImage && item.originalDrawing ? 
                `<div class="item-with-image">
                    <img src="${item.originalDrawing}" class="item-thumbnail" alt="품목 그림">
                    <span>${itemName}</span>
                </div>` : 
                itemName;
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td class="item-col">${itemContent}</td>
                    <td>-</td>
                    <td>${quantity}</td>
                    <td>${price}</td>
                    <td>${subtotal}</td>
                    <td>${tax}</td>
                    <td></td>
                </tr>
            `;
        }).join('');
    }

    populateTotals() {
        const subtotal = window.itemManager.items.reduce((sum, item) => sum + item.subtotal, 0);
        const tax = window.itemManager.items.reduce((sum, item) => sum + item.tax, 0);
        const total = window.itemManager.items.reduce((sum, item) => sum + item.total, 0);
        
        document.getElementById('quotationSubtotal').textContent = Utils.formatNumber(subtotal);
        document.getElementById('quotationTax').textContent = Utils.formatNumber(tax);
        document.getElementById('quotationTotal').textContent = `(₩${Utils.formatNumber(total)})`;
        document.getElementById('quotationTotalKorean').textContent = this.convertToKoreanCurrency(total);
    }

    convertToKoreanCurrency(amount) {
        if (amount === 0) return '영원정';
        
        const units = ['', '십', '백', '천', '만', '십만', '백만', '천만', '억', '십억', '백억', '천억'];
        const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
        
        let result = '';
        let amountStr = amount.toString().split('').reverse();
        
        for (let i = 0; i < amountStr.length; i++) {
            const digit = parseInt(amountStr[i]);
            if (digit > 0) {
                result = digits[digit] + units[i] + result;
            }
        }
        
        return result + '원정';
    }

    async createPDFFromTemplate() {
        const template = document.getElementById('quotationTemplate');
        const originalDisplay = template.style.display;
        
        template.style.display = 'block';
        template.style.position = 'fixed';
        template.style.top = '-9999px';
        template.style.left = '-9999px';
        template.style.width = '210mm';
        template.style.backgroundColor = 'white';
        
        try {
            const canvas = await html2canvas(template, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123,
                scrollX: 0,
                scrollY: 0
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            
            const today = new Date().toISOString().slice(0, 10);
            const filename = `견적서_${today}.pdf`;
            
            // 모바일 호환성을 위한 다운로드 방식 변경
            this.downloadPDFForMobile(pdf, filename);
            
        } catch (error) {
            console.error('PDF 생성 중 오류 발생:', error);
            alert('PDF 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            template.style.display = originalDisplay;
            template.style.position = '';
            template.style.top = '';
            template.style.left = '';
            template.style.width = '';
            template.style.backgroundColor = '';
        }
    }

    downloadPDFForMobile(pdf, filename) {
        try {
            // 모바일 브라우저 감지
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (isMobile) {
                // Blob을 사용한 다운로드 방식
                const pdfBlob = pdf.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);
                
                if (isIOS) {
                    // iOS Safari의 경우 새 창에서 열기
                    const newWindow = window.open('', '_blank');
                    newWindow.location.href = blobUrl;
                } else {
                    // 다른 모바일 브라우저의 경우
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = filename;
                    
                    // DOM에 추가하고 클릭 후 제거
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // URL 정리
                    setTimeout(() => {
                        URL.revokeObjectURL(blobUrl);
                    }, 100);
                }
            } else {
                // 데스크톱의 경우 기존 방식 사용
                pdf.save(filename);
            }
        } catch (error) {
            console.error('PDF 다운로드 중 오류:', error);
            // 대안으로 기존 방식 시도
            pdf.save(filename);
        }
    }
}

function generatePDF() {
    if (window.pdfGenerator) {
        window.pdfGenerator.generatePDF();
    }
}