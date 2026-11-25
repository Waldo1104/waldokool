// ============================================================================
// Waldo Kool Travel - Automated Email Confirmation Dispatcher Service
// File: email-confirmation-service.js
// ============================================================================

const EmailConfirmationService = {
  // Configurable Email Provider (Supports EmailJS, Webhook, Formspree or Mock Simulator)
  config: {
    serviceId: 'service_waldo_kool',
    templateId: 'template_booking_confirm',
    publicKey: 'user_dummy_key',
    senderEmail: 'booking@waldokooltravel.vn',
    senderName: 'Waldo Kool Travel Vietnam',
    companyPhone: '+84 859 613 243',
    companyAddress: '06 Huyền Trân Công Chúa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    bankInfo: {
      bankName: 'BIDV (Chi Nhánh Bình Định)',
      accountNumber: '5801433856',
      accountHolder: 'NGUYEN DINH DO'
    }
  },

  // Generate HTML Email Template
  generateEmailHtml: function(order) {
    const formattedPrice = Number(order.total_estimated_price || 0).toLocaleString('vi-VN') + ' VNĐ';
    const depositRequired = order.deposit_amount 
      ? Number(order.deposit_amount).toLocaleString('vi-VN') + ' VNĐ'
      : (order.tour_code && order.tour_code.includes('HANQUOC') ? '9.000.000 VNĐ / Khách' : '50% Tổng giá trị đơn');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
          .body { padding: 28px 24px; }
          .status-badge { display: inline-block; background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 12px; rounded: 9999px; border: 1px solid #a7f3d0; margin-bottom: 16px; }
          .order-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .order-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .order-row strong { color: #0f172a; }
          .order-row:last-child { margin-bottom: 0; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
          .price-highlight { color: #0284c7; font-size: 16px; font-weight: 800; }
          .bank-card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .bank-card h3 { margin: 0 0 10px; font-size: 14px; color: #1d4ed8; }
          .bank-detail { font-size: 12px; line-height: 1.6; color: #1e3a8a; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; font-size: 11px; text-align: center; color: #64748b; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>WALDO KOOL TRAVEL</h1>
            <p>XÁC NHẬN ĐĂNG KÝ GIỮ CHỖ DỊCH VỤ / TOUR THÀNH CÔNG</p>
          </div>
          
          <div class="body">
            <div class="status-badge">✓ HỒ SƠ ĐÃ ĐƯỢC TIẾP NHẬN & ĐIỀU PHỐI</div>
            <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
              Kính gửi <strong>${order.customer_name || 'Quý khách'}</strong>,<br>
              Cảm ơn Quý khách đã tin tưởng và lựa chọn dịch vụ của <strong>Waldo Kool Travel</strong>. Hệ thống đã tiếp nhận và lập mã xác nhận đặt chỗ cho chuyến đi của Quý khách với thông tin chi tiết dưới đây:
            </p>

            <div class="order-card">
              <div class="order-row">
                <span style="color:#64748b;">Mã Đơn Đặt Chỗ:</span>
                <strong>${order.booking_id || 'WK-' + Date.now()}</strong>
              </div>
              <div class="order-row">
                <span style="color:#64748b;">Dịch Vụ / Tour:</span>
                <strong>${order.tour_name || 'Tour Du Lịch Trọn Gói'}</strong>
              </div>
              <div class="order-row">
                <span style="color:#64748b;">Ngày Khởi Hành:</span>
                <strong>${order.departure_date || 'Theo thỏa thuận'}</strong>
              </div>
              <div class="order-row">
                <span style="color:#64748b;">Số Lượng Khách:</span>
                <span><strong>${order.pax_adults || 1}</strong> Người lớn ${order.pax_children ? `, <strong>${order.pax_children}</strong> Trẻ em` : ''}</span>
              </div>
              <div class="order-row">
                <span style="color:#64748b;">Khách Hàng & SĐT:</span>
                <strong>${order.customer_name} (${order.customer_phone || ''})</strong>
              </div>
              <div class="order-row">
                <span style="color:#64748b;">Email Nhận Xác Nhận:</span>
                <strong style="color:#0284c7;">${order.customer_email || 'Chưa cung cấp'}</strong>
              </div>
              <div class="order-row">
                <span style="color:#0f172a; font-weight:bold;">Tổng Chi Phí Dự Kiến:</span>
                <span class="price-highlight">${formattedPrice}</span>
              </div>
            </div>

            <div class="bank-card">
              <h3>💳 THÔNG TIN CHUYỂN KHOẢN ĐẶT CỌC (VIETQR)</h3>
              <div class="bank-detail">
                • <strong>Ngân hàng:</strong> ${this.config.bankInfo.bankName}<br>
                • <strong>Số tài khoản:</strong> <span style="font-family:monospace; font-size:14px; font-weight:bold; color:#0284c7;">${this.config.bankInfo.accountNumber}</span><br>
                • <strong>Chủ tài khoản:</strong> ${this.config.bankInfo.accountHolder}<br>
                • <strong>Số tiền cọc tối thiểu:</strong> <span style="color:#b45309; font-weight:bold;">${depositRequired}</span><br>
                • <strong>Nội dung chuyển khoản:</strong> <span style="background:#dbeafe; padding:2px 6px; border-radius:4px; font-weight:bold;">${order.customer_name} ${order.customer_phone} ${order.booking_id}</span>
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b; line-height: 1.6;">
              <em>* Lưu ý:</em> Chuyên viên tư vấn & điều phối của Waldo Kool Travel sẽ liên hệ lại qua số điện thoại <strong>${order.customer_phone}</strong> trong vòng 5 phút để xác nhận lại thông tin hợp đồng, hướng dẫn nộp hồ sơ visa (đối với tour quốc tế) và hỗ trợ hoàn tất phiếu thu.
            </p>
          </div>

          <div class="footer">
            <strong>CÔNG TY TNHH DU LỊCH WALDO KOOL (WALDO KOOL TRAVEL)</strong><br>
            Trụ sở: ${this.config.companyAddress}<br>
            Hotline & Zalo 24/7: ${this.config.companyPhone} • Email: ${this.config.senderEmail}<br>
            <em>Cảm ơn Quý khách và chúc Quý khách có một hành trình vẹn tròn trải nghiệm!</em>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Dispatch Email Confirmation
  sendConfirmationEmail: function(order) {
    if (!order.customer_email) {
      console.warn('[EmailService] Customer email is missing. Skipped automated dispatch.');
      return Promise.resolve({ success: false, reason: 'missing_email' });
    }

    console.info(`[EmailService] Preparing automated email dispatch to ${order.customer_email}...`);

    // 1. Generate full HTML body
    const emailHtml = this.generateEmailHtml(order);

    // 2. Store to Local Sent Log in localStorage for Admin inspection
    try {
      const sentHistory = JSON.parse(localStorage.getItem('waldo_kool_sent_emails') || '[]');
      sentHistory.unshift({
        id: 'EML-' + Date.now(),
        booking_id: order.booking_id,
        recipient: order.customer_email,
        customer_name: order.customer_name,
        tour_name: order.tour_name,
        subject: `[Waldo Kool Travel] Xác Nhận Đặt Chỗ Thành Công - Đơn Hàng #${order.booking_id}`,
        sent_at: new Date().toLocaleString('vi-VN'),
        status: 'DELIVERED (SIMULATED)',
        html_content: emailHtml
      });
      localStorage.setItem('waldo_kool_sent_emails', JSON.stringify(sentHistory));
    } catch (e) {
      console.warn('[EmailService] Local history save failed:', e);
    }

    // 3. Attempt external Webhook / Service if configured
    if (this.config.webhookUrl) {
      fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: order.customer_email,
          subject: `[Waldo Kool Travel] Xác Nhận Đặt Chỗ Thành Công - Đơn Hàng #${order.booking_id}`,
          html: emailHtml,
          order: order
        })
      }).catch(err => console.warn('[EmailService] Webhook call error:', err));
    }

    // Return success object with preview capability
    return Promise.resolve({
      success: true,
      recipient: order.customer_email,
      booking_id: order.booking_id,
      html: emailHtml
    });
  }
};

window.EmailConfirmationService = EmailConfirmationService;
