// -*- coding: utf-8 -*-
document.addEventListener('DOMContentLoaded', function () {
    const serviceSelect = document.getElementById('calc-service');
    const levelSelect = document.getElementById('calc-level');
    const qtyInput = document.getElementById('calc-qty');
    const qtyUnitLabel = document.getElementById('calc-qty-unit');
    const deadlineSelect = document.getElementById('calc-deadline');
    const resultPrice = document.getElementById('calc-result-price');
    const submitBtn = document.getElementById('easya-calc-submit-btn');
    const form = document.getElementById('easya-academic-calc-form');
    const submitMsg = document.getElementById('calc-submit-msg');

    if (!serviceSelect || !qtyInput || !resultPrice) return;

    // Helper to format currency
    function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(amount)
            .replace('₫', 'đ');
    }

    // Main Calculator logic
    function calculatePrice() {
        const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
        const basePrice = parseFloat(selectedOption.getAttribute('data-price') || 0);
        const unit = selectedOption.getAttribute('data-unit') || 'Đơn vị';
        
        // Update unit label in real-time
        if (qtyUnitLabel) {
            qtyUnitLabel.textContent = unit;
        }

        const qty = parseFloat(qtyInput.value || 1);
        
        const levelMultiplier = parseFloat(levelSelect.options[levelSelect.selectedIndex].getAttribute('data-multiplier') || 1.0);
        const deadlineMultiplier = parseFloat(deadlineSelect.options[deadlineSelect.selectedIndex].getAttribute('data-multiplier') || 1.0);

        // Price Formula
        const totalPrice = basePrice * qty * levelMultiplier * deadlineMultiplier;
        
        // Render result with animate transition
        resultPrice.textContent = formatVND(totalPrice);
    }

    // Bind event listeners for real-time recalculation
    serviceSelect.addEventListener('change', calculatePrice);
    levelSelect.addEventListener('change', calculatePrice);
    qtyInput.addEventListener('input', calculatePrice);
    deadlineSelect.addEventListener('change', calculatePrice);

    // Initial calculation run
    calculatePrice();

    // Custom form submission via AJAX to Odoo controller
    if (submitBtn && form) {
        submitBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Validate standard HTML5 inputs
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Prepare details
            const name = document.getElementById('contact-name').value;
            const phone = document.getElementById('contact-phone').value;
            const university = document.getElementById('contact-uni').value;
            const service = serviceSelect.options[serviceSelect.selectedIndex].text;
            const level = levelSelect.options[levelSelect.selectedIndex].text;
            const qty = qtyInput.value;
            const unit = qtyUnitLabel ? qtyUnitLabel.textContent : '';
            const deadline = deadlineSelect.options[deadlineSelect.selectedIndex].text;
            const price = resultPrice.textContent;

            // Disable button and show spinner
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Đang gửi đăng ký...';

            // Construct payload
            const payload = {
                'name': name,
                'phone': phone,
                'university': university,
                'service': service,
                'level': level,
                'qty': qty + ' ' + unit,
                'deadline': deadline,
                'price_estimate': price
            };

            // Post request to Odoo route
            fetch('/easya/website/calc_submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    'jsonrpc': '2.0',
                    'method': 'call',
                    'params': payload
                })
            })
            .then(response => response.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>Đăng Ký Tư Vấn Chi Tiết';

                if (submitMsg) {
                    submitMsg.classList.remove('d-none', 'text-danger', 'text-success');
                    
                    if (data.result && data.result.success) {
                        submitMsg.classList.add('text-success');
                        submitMsg.innerHTML = '<i class="fa-solid fa-circle-check me-1"></i> Gửi đăng ký thành công! Easy A sẽ liên hệ qua Zalo/SĐT trong vòng 5 phút.';
                        form.reset();
                        calculatePrice(); // Reset calculator price to default
                    } else {
                        submitMsg.classList.add('text-danger');
                        submitMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Có lỗi xảy ra. Vui lòng gọi Hotline trực tiếp!';
                    }
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>Đăng Ký Tư Vấn Chi Tiết';
                
                if (submitMsg) {
                    submitMsg.classList.remove('d-none', 'text-success');
                    submitMsg.classList.add('text-danger');
                    submitMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> Không thể kết nối máy chủ. Vui lòng chat Zalo trực tiếp!';
                }
            });
        });
    }
});
