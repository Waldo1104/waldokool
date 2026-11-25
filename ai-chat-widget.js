/**
 * ============================================================================
 * TourFlow AI - Standalone Floating Chatbot & Booking Dispatcher Widget
 * File: ai-chat-widget.js
 * Version: 2.1.0
 * Architecture: Vanilla JavaScript (Zero External Dependencies)
 * Compatibility: Modern Browsers, Responsive (Desktop / Tablet / Mobile)
 * ============================================================================
 */

(function (window, document) {
  'use strict';

  // 1. CONFIGURATION
  const DEFAULT_CONFIG = {
    webhookUrl: 'https://api.waldokooltravel.vn/v1/chat', // Thay bằng Webhook URL của n8n, Make, Flowise hoặc backend
    botName: 'TourFlow Assistant',
    botTitle: 'Trợ lý AI Điều Phối Du Lịch',
    accentColor: '#2563EB',
    sessionStorageKey: 'tourflow_chat_session_v2',
    historyStorageKey: 'tourflow_chat_history_v2',
    welcomeDelayMs: 2000,
    quickReplies: [
      'Tư vấn Tour Hàn Quốc 5N4Đ',
      'Tour Củ Chi Địa Đạo (1N)',
      'City Tour HCM & Metro Bửu Long'
    ]
  };

  const CONFIG = Object.assign({}, DEFAULT_CONFIG, window.TourFlowChatConfig || {});

  // 2. STATE MANAGEMENT & SESSION ID
  let isOpen = false;
  let isTyping = false;
  let sessionId = sessionStorage.getItem(CONFIG.sessionStorageKey);

  if (!sessionId) {
    sessionId = 'tf-sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem(CONFIG.sessionStorageKey, sessionId);
  }

  // 3. INJECT SCOPED CSS
  const injectStyles = () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'tourflow-widget-styles';
    styleEl.innerHTML = `
      #tf-widget-root {
        font-family: "Be Vietnam Pro", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #F8FAFC;
        line-height: 1.5;
        font-size: 14px;
        -webkit-font-smoothing: antialiased;
      }
      #tf-widget-root * {
        box-sizing: border-box;
      }

      /* Floating Action Button (FAB) */
      .tf-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
        border: none;
        box-shadow: 0 8px 28px rgba(37, 99, 235, 0.45);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999990;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
      }
      .tf-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 36px rgba(6, 182, 212, 0.55);
      }
      .tf-fab:active {
        transform: scale(0.94);
      }
      .tf-fab svg {
        width: 28px;
        height: 28px;
        fill: #FFFFFF;
        transition: transform 0.3s ease;
      }

      /* Notification Badge */
      .tf-fab-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        background-color: #10B981;
        border: 2px solid #0F172A;
        border-radius: 50%;
      }

      /* Chat Window Container */
      .tf-window {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 380px;
        height: 560px;
        max-height: calc(100vh - 120px);
        background: #0F172A;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 20px;
        box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(6, 182, 212, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 999995;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px) scale(0.95);
        transform-origin: bottom right;
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s;
      }
      .tf-window.tf-open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      /* Mobile Responsive (Full Screen) */
      @media (max-width: 480px) {
        .tf-window {
          bottom: 0;
          right: 0;
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
          border: none;
        }
      }

      /* Window Header */
      .tf-header {
        background: #0B1120;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      }
      .tf-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tf-avatar-wrap {
        position: relative;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: linear-gradient(135deg, #2563EB, #06B6D4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tf-status-dot {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        background: #10B981;
        border: 2px solid #0B1120;
        border-radius: 50%;
      }
      .tf-header-info h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #F8FAFC;
      }
      .tf-header-info p {
        margin: 0;
        font-size: 11px;
        color: #94A3B8;
      }
      .tf-close-btn {
        background: transparent;
        border: none;
        color: #94A3B8;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, color 0.2s;
      }
      .tf-close-btn:hover {
        background: #1E293B;
        color: #FFFFFF;
      }

      /* Messages Feed */
      .tf-messages {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #0F172A;
      }
      .tf-messages::-webkit-scrollbar {
        width: 5px;
      }
      .tf-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      .tf-messages::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 10px;
      }

      /* Message Bubbles */
      .tf-msg-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        width: 100%;
      }
      .tf-msg-user {
        justify-content: flex-end;
      }
      .tf-bubble {
        max-width: 82%;
        padding: 10px 14px;
        font-size: 13.5px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .tf-bubble-user {
        background: #2563EB;
        color: #FFFFFF;
        border-radius: 16px 16px 2px 16px;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
      }
      .tf-bubble-bot {
        background: #1E293B;
        color: #F1F5F9;
        border: 1px solid rgba(148, 163, 184, 0.12);
        border-radius: 16px 16px 16px 2px;
      }
      .tf-bubble-bot strong {
        color: #38BDF8;
      }
      .tf-bubble-bot a {
        color: #06B6D4;
        text-decoration: underline;
      }
      .tf-bubble-bot ul {
        margin: 6px 0;
        padding-left: 18px;
      }

      /* Booking Order Dispatch Card */
      .tf-dispatch-card {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%);
        border: 1px solid rgba(16, 185, 129, 0.4);
        border-radius: 14px;
        padding: 14px;
        margin-top: 6px;
      }
      .tf-dispatch-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: #10B981;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .tf-dispatch-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4px;
        font-size: 12px;
        color: #CBD5E1;
      }
      .tf-dispatch-footer {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid rgba(16, 185, 129, 0.2);
        font-size: 11px;
        color: #94A3B8;
        font-style: italic;
      }

      /* Typing Indicator Wave */
      .tf-typing-indicator {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        background: #1E293B;
        border-radius: 16px 16px 16px 2px;
        width: fit-content;
      }
      .tf-dot {
        width: 6px;
        height: 6px;
        background: #06B6D4;
        border-radius: 50%;
        animation: tfBounce 1.4s infinite ease-in-out both;
      }
      .tf-dot:nth-child(1) { animation-delay: -0.32s; }
      .tf-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes tfBounce {
        0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Quick Replies Container */
      .tf-quick-replies {
        padding: 6px 16px 10px;
        display: flex;
        gap: 6px;
        overflow-x: auto;
        white-space: nowrap;
        background: #0F172A;
      }
      .tf-quick-replies::-webkit-scrollbar {
        display: none;
      }
      .tf-chip {
        background: #1E293B;
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #E2E8F0;
        padding: 6px 12px;
        border-radius: 9999px;
        font-size: 11.5px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tf-chip:hover {
        background: #2563EB;
        border-color: #3B82F6;
        color: #FFFFFF;
      }

      /* Footer / Input Area */
      .tf-footer {
        padding: 10px 14px;
        background: #0B1120;
        border-top: 1px solid rgba(148, 163, 184, 0.12);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .tf-input {
        flex: 1;
        background: #1E293B;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 10px;
        padding: 10px 12px;
        color: #FFFFFF;
        font-size: 13px;
        outline: none;
        transition: border-color 0.2s;
      }
      .tf-input:focus {
        border-color: #06B6D4;
      }
      .tf-input::placeholder {
        color: #64748B;
      }
      .tf-send-btn {
        background: #2563EB;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        color: #FFFFFF;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s, transform 0.1s;
      }
      .tf-send-btn:hover {
        background: #1D4ED8;
      }
      .tf-send-btn:active {
        transform: scale(0.92);
      }
    `;
    document.head.appendChild(styleEl);
  };

  // 4. GENERATE DOM NODES
  const createWidgetDOM = () => {
    const root = document.createElement('div');
    root.id = 'tf-widget-root';

    root.innerHTML = `
      <!-- FAB Button -->
      <button class="tf-fab" id="tf-fab-btn" aria-label="Open Live Chat">
        <div class="tf-fab-badge" id="tf-fab-badge"></div>
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.646-.826C8.583 21.498 10.237 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
        </svg>
      </button>

      <!-- Chat Window -->
      <div class="tf-window" id="tf-chat-window">
        <!-- Header -->
        <div class="tf-header">
          <div class="tf-header-left">
            <div class="tf-avatar-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13A2.5 2.5 0 1 0 10 15.5 2.5 2.5 0 0 0 7.5 13zm9 0A2.5 2.5 0 1 0 19 15.5 2.5 2.5 0 0 0 16.5 13z"/>
              </svg>
              <div class="tf-status-dot"></div>
            </div>
            <div class="tf-header-info">
              <h4>${CONFIG.botName}</h4>
              <p>${CONFIG.botTitle} • Online</p>
            </div>
          </div>
          <button class="tf-close-btn" id="tf-close-btn" aria-label="Close Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Messages List -->
        <div class="tf-messages" id="tf-messages-feed"></div>

        <!-- Quick Reply Chips -->
        <div class="tf-quick-replies" id="tf-quick-replies"></div>

        <!-- Footer Input -->
        <form class="tf-footer" id="tf-chat-form">
          <input type="text" class="tf-input" id="tf-chat-input" placeholder="Nhập câu hỏi hoặc yêu cầu tour..." autocomplete="off"/>
          <button type="submit" class="tf-send-btn" id="tf-send-btn" aria-label="Send Message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(root);
  };

  // 5. HELPER: MARKDOWN PARSER FOR MESSAGES
  const parseMarkdown = (text) => {
    if (!text) return '';
    let parsed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold: **text** or __text__
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists: * item or - item
    parsed = parsed.replace(/(?:^|\n)[*-]\s+(.+)/g, '<li>$1</li>');
    parsed = parsed.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Links: [text](url)
    parsed = parsed.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Newlines to <br>
    parsed = parsed.replace(/\n/g, '<br>');
    return parsed;
  };

  // 6. HISTORY IN SESSION STORAGE
  const getHistory = () => {
    try {
      return JSON.parse(sessionStorage.getItem(CONFIG.historyStorageKey)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveMessageToHistory = (role, content) => {
    let history = getHistory();
    history.push({ role, content });
    if (history.length > 10) history = history.slice(-10); // Keep last 10
    sessionStorage.setItem(CONFIG.historyStorageKey, JSON.stringify(history));
  };

  // 7. RENDER MESSAGES
  const appendMessage = (content, sender = 'bot', isHtml = false) => {
    const feed = document.getElementById('tf-messages-feed');
    if (!feed) return;

    const row = document.createElement('div');
    row.className = `tf-msg-row ${sender === 'user' ? 'tf-msg-user' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = `tf-bubble ${sender === 'user' ? 'tf-bubble-user' : 'tf-bubble-bot'}`;

    if (isHtml) {
      bubble.innerHTML = content;
    } else {
      bubble.innerHTML = parseMarkdown(content);
    }

    row.appendChild(bubble);
    feed.appendChild(row);
    feed.scrollTop = feed.scrollHeight;
  };

  // Show/Hide Typing Indicator
  const setTyping = (typing) => {
    isTyping = typing;
    const feed = document.getElementById('tf-messages-feed');
    const existing = document.getElementById('tf-typing-wave');

    if (typing) {
      if (!existing && feed) {
        const wave = document.createElement('div');
        wave.id = 'tf-typing-wave';
        wave.className = 'tf-msg-row';
        wave.innerHTML = `
          <div class="tf-typing-indicator">
            <span class="tf-dot"></span>
            <span class="tf-dot"></span>
            <span class="tf-dot"></span>
          </div>
        `;
        feed.appendChild(wave);
        feed.scrollTop = feed.scrollHeight;
      }
    } else {
      if (existing) existing.remove();
    }
  };

  // 8. BOOKING DISPATCH DETECTOR & SUCCESS CARD RENDER
  const detectAndProcessBookingOrder = (rawText) => {
    // Regex matches <booking_order>{...}</booking_order> or raw JSON with booking_id
    const tagRegex = /<booking_order>([\s\S]*?)<\/booking_order>/i;
    const match = rawText.match(tagRegex);
    let orderData = null;

    if (match && match[1]) {
      try {
        orderData = JSON.parse(match[1].trim());
      } catch (err) {
        console.warn('[TourFlow] Failed to parse booking XML tag JSON:', err);
      }
    }

    // Fallback: Check if pure JSON contains booking_id
    if (!orderData) {
      try {
        const potentialJson = JSON.parse(rawText.trim());
        if (potentialJson.booking_id || potentialJson.customer_phone) {
          orderData = potentialJson;
        }
      } catch (e) {}
    }

    if (orderData) {
      // 0. Auto Sync to Admin LocalStorage Database
      try {
        const storedBookings = JSON.parse(localStorage.getItem('tourflow_bookings') || '[]');
        // Prepend new booking
        storedBookings.unshift({
          booking_id: orderData.booking_id || ('TF-' + Math.floor(100000 + Math.random() * 900000)),
          customer_name: orderData.customer_name || 'Khách Hàng AI Chat',
          customer_phone: orderData.customer_phone || '',
          customer_email: orderData.customer_email || (orderData.customer_phone ? (orderData.customer_phone + '@guest.waldokool.vn') : ''),
          tour_code: orderData.tour_code || 'TOUR-GENERAL',
          tour_name: orderData.tour_name || 'Tour Trọn Gói',
          departure_date: orderData.departure_date || 'Theo thỏa thuận',
          pax_adults: orderData.pax_adults || 1,
          pax_children: orderData.pax_children || 0,
          total_estimated_price: orderData.total_estimated_price || 0,
          status: 'AI Tự Động Ghi Nhận & Gửi Email',
          created_at: new Date().toLocaleString('vi-VN'),
          note: 'Đặt trực tiếp qua trợ lý AI Widget'
        });
        localStorage.setItem('tourflow_bookings', JSON.stringify(storedBookings));

        // Auto trigger EmailConfirmationService if available
        if (window.EmailConfirmationService && orderData.customer_email) {
          window.EmailConfirmationService.sendConfirmationEmail(orderData);
        }
      } catch (err) {
        console.warn('[TourFlow] Failed to sync booking to localStorage:', err);
      }

      // 1. Dispatch DOM CustomEvent for Analytics (GA4 / Pixel)
      window.dispatchEvent(new CustomEvent('bookingDispatched', {
        detail: orderData
      }));

      // 2. Render Elegant Dispatch Card in Chat Feed
      const priceFormatted = Number(orderData.total_estimated_price || 0).toLocaleString('vi-VN') + ' VNĐ';
      const cardHtml = `
        <div class="tf-dispatch-card">
          <div class="tf-dispatch-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            YÊU CẦU ĐẶT CHỖ ĐÃ ĐIỀU PHỐI THÀNH CÔNG
          </div>
          <div class="tf-dispatch-grid">
            <div><strong>Mã đơn:</strong> ${orderData.booking_id || 'TF-AUTOGEN'}</div>
            <div><strong>Khách hàng:</strong> ${orderData.customer_name || 'Quý khách'} (${orderData.customer_phone || ''})</div>
            <div><strong>Tour:</strong> ${orderData.tour_code || 'Tour trọn gói'} | Ngày: ${orderData.departure_date || 'Theo thỏa thuận'}</div>
            <div><strong>Số lượng:</strong> ${orderData.pax_adults || 1} người lớn, ${orderData.pax_children || 0} trẻ em</div>
            <div><strong>Tổng dự toán:</strong> <span style="color:#10B981; font-weight:bold;">${priceFormatted}</span></div>
            <div><strong>Đối tác nhận lệnh:</strong> <span style="color:#38BDF8;">${orderData.assigned_operator || 'Đội ngũ điều phối'}</span></div>
          </div>
          <div class="tf-dispatch-footer">
            Chuyên viên điều hành sẽ liên hệ qua điện thoại/Zalo trong vòng 15 phút để xác nhận lần cuối.
          </div>
        </div>
      `;

      appendMessage(cardHtml, 'bot', true);
    }

    // Clean text by stripping out the raw XML tag for visitor readability
    return rawText.replace(tagRegex, '').trim();
  };

  // 8.5 TOUR DATA ENGINE & INTELLIGENT BOT RESPONSE (RAG KNOWLEDGE BASE)
const TOUR_KNOWLEDGE_BASE = {
  korea: {
    name: 'Du Lịch Hàn Quốc: Seoul - Nami - Everland (5N4Đ)',
    flight: 'Vietjet Air (VJ862 SGN-ICN 02:40-09:45 / VJ861 ICN-SGN 21:15-00:40)',
    hotel: 'Khách sạn tiêu chuẩn 4 sao quốc tế gần trung tâm (Stanford, Sono Calm, Sollago Myeongdong, Golden Seoul...)',
    highlights: [
      'Tặng vé xem Show biểu diễn nghệ thuật danh tiếng The Painter Show',
      'Tặng trải nghiệm mặc trang phục truyền thống Hanbok & làm Kimchi',
      'Tặng thêm suất ăn nhẹ trên chuyến bay',
      'Khám phá Đảo Nami bốn mùa lãng mạn, Tháp Namsan biểu tượng Seoul',
      'Vui chơi không giới hạn tại Đại công viên giải trí Everland',
      'Cung điện Cảnh Phúc Cung (Gyeongbokgung), Nhà Xanh, Làng cổ Hanok Bukchon',
      'Thưởng thức ẩm thực chuẩn Hàn: gà nướng Nami, lẩu nấm, thịt nướng buffet, canh sườn'
    ],
    pricing: {
      adult: '17.900.000 VNĐ (từ 11 tuổi)',
      child: '16.500.000 VNĐ (2 - dưới 11 tuổi, ngủ chung giường)',
      infant: '5.900.000 VNĐ (dưới 2 tuổi)',
      single_room_extra: '6.800.000 VNĐ/khách'
    },
    departure: '22/11/2026 (Khởi hành đêm 21/11/2026)',
    visa_policy: 'Hộ chiếu còn hạn >6 tháng, hình 3.5x4.5 nền trắng, CCCD, xác nhận việc làm/GPKD, sao kê tài khoản. Nộp trước ngày khởi hành 20-35 ngày. Đặt cọc 9.000.000 VNĐ.'
  },
  cuchi: {
    name: 'Tour Khám Phá Địa Đạo Củ Chi 1 Ngày (Cu Chi Tunnels Discovery)',
    transport: 'Xe du lịch cao cấp 29 chỗ đời mới suốt tuyến',
    highlights: [
      'Thuyết minh lịch sử hào hùng và hệ thống địa đạo dài hơn 200km - thành phố trong lòng đất',
      'Trải nghiệm chui hầm địa đạo thực tế, tìm hiểu bếp không khói Hoàng Cầm, hầm chông & lối thoát hiểm bí mật',
      'Thưởng thức khoai mì chấm muối mè và trà nóng nghĩa tình chiến khu',
      'Thử tài thiện xạ tại trường bắn súng thể thao (chi phí tự túc: AK-47, M16)',
      'Bữa trưa đặc sản Nam Bộ 270.000 VNĐ/suất tại nhà hàng địa phương'
    ],
    pricing: {
      group_10_14: '1.325.000 VNĐ/khách',
      group_15_19: '1.200.000 VNĐ/khách',
      group_20_24: '1.100.000 VNĐ/khách'
    },
    departure: '13/11/2026 (08:00 sáng tại TP.HCM)'
  },
  citytour: {
    name: 'City Tour TP.HCM - Trải Nghiệm Tuyến Metro - Chùa Bửu Long (1 Ngày)',
    transport: 'Xe du lịch 29 chỗ & Tuyến tàu điện ngầm Metro hiện đại',
    highlights: [
      'Check-in UBND Thành Phố & Nhà Hát Thành Phố biểu tượng kiến trúc Sài Gòn',
      'Trải nghiệm tuyến Metro ngầm hiện đại đầu tiên tại TP.HCM',
      'Viếng Đền Tưởng Niệm các Vua Hùng thiêng liêng và tôn kính',
      'Chiêm bái Chùa Bửu Long - công trình kiến trúc Phật giáo lộng lẫy và thanh tịnh',
      'Thưởng thức ẩm thực đồng quê dân dã tại KDL Sen Nam Bộ'
    ],
    pricing: {
      group_20_24: '830.000 VNĐ/khách',
      group_25_28: '770.000 VNĐ/khách (Bao gồm ăn sáng tại Nhà hàng Đoàn Viên + ăn trưa Sen Nam Bộ)'
    },
    departure: '28/11/2026 (07:30 sáng tập trung tại 06 Huyền Trân Công Chúa, Q.1)'
  }
};

// ============================================================================
// Waldo Kool Travel - Advanced Natural Language Intelligence Engine
// Multilingual (VI, EN, FR, ZH), Intent Classifier, Context Memory & Smart Booking
// ============================================================================

const generateSuperSmartResponse = (userText) => {
  const raw = userText.trim();
  const lower = raw.toLowerCase();
  
  // Normalize Vietnamese without diacritics for ultra-flexible matching
  const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  };
  const norm = removeDiacritics(lower);

  // 1. DETECT LANGUAGE OF THE USER
  let lang = 'vi';
  if (/^(hello|hi|hey|good morning|price|tour|itinerary|how much|book|cost|booking|visa)/i.test(lower) || lower.includes('korea') || lower.includes('recommend') || lower.includes('when')) {
    lang = 'en';
  } else if (/^(bonjour|salut|prix|voyage|combien|circuit|réserver|reserver)/i.test(lower) || lower.includes('corée') || lower.includes('vietnam')) {
    lang = 'fr';
  } else if (/[\u4e00-\u9fa5]/.test(lower) || lower.includes('你好') || lower.includes('多少钱') || lower.includes('旅游') || lower.includes('预订') || lower.includes('韩国') || lower.includes('行程')) {
    lang = 'zh';
  }

  // 2. EXTRACT ENTITIES (Phone, Email, Pax count)
  const phoneMatch = raw.match(/(0[3|5|7|8|9][0-9]{8}|\+84[0-9]{9})/);
  const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  
  // Detect group size (e.g., "3 người", "4 khách", "2 pax", "5 people", "4人")
  let paxAdults = 1;
  const paxMatch = lower.match(/([0-9]+)\s*(người|khách|pax|people|person|tickets|vé|ve|人)/);
  if (paxMatch && parseInt(paxMatch[1]) > 0 && parseInt(paxMatch[1]) < 100) {
    paxAdults = parseInt(paxMatch[1]);
  }

  // 3. INTENT 1: SMART INSTANT BOOKING DISPATCH (Khi khách để lại SĐT hoặc Email)
  const hasBookingIntent = norm.includes('dat') || norm.includes('book') || norm.includes('giu cho') || norm.includes('dang ky') || norm.includes('reserve') || norm.includes('reserver') || norm.includes('yuding') || norm.includes('muon di') || norm.includes('tham gia') || norm.includes('order');

  if (phoneMatch || (hasBookingIntent && (phoneMatch || emailMatch))) {
    let tourCode = 'TOUR-HANQUOC-5N4D';
    let tourName = 'Tour Hàn Quốc Seoul - Nami - Everland (5N4Đ)';
    let pricePerPax = 17900000;
    let date = '22/11/2026';

    if (norm.includes('cu chi') || norm.includes('dia dao') || norm.includes('tunnels') || norm.includes('ban sung')) {
      tourCode = 'TOUR-CUCHI-01D';
      tourName = 'Tour Khám Phá Địa Đạo Củ Chi (1 Ngày)';
      pricePerPax = (paxAdults >= 20) ? 1100000 : (paxAdults >= 15 ? 1200000 : 1325000);
      date = '13/11/2026';
    } else if (norm.includes('metro') || norm.includes('buu long') || norm.includes('city') || norm.includes('sen nam bo')) {
      tourCode = 'TOUR-CITY-01D';
      tourName = 'City Tour TP.HCM - Tuyến Metro - Chùa Bửu Long (1 Ngày)';
      pricePerPax = (paxAdults >= 25) ? 770000 : 830000;
      date = '28/11/2026';
    }

    const bookingId = 'WK-' + Math.floor(100000 + Math.random() * 900000);
    const totalPrice = pricePerPax * paxAdults;
    const phone = phoneMatch ? phoneMatch[0] : '+84 859 613 243';
    const email = emailMatch ? emailMatch[0] : `${phone}@guest.waldokool.vn`;

    const bookingPayload = {
      booking_id: bookingId,
      customer_name: 'Quý khách',
      customer_phone: phone,
      customer_email: email,
      tour_code: tourCode,
      tour_name: tourName,
      departure_date: date,
      pax_adults: paxAdults,
      pax_children: 0,
      total_estimated_price: totalPrice,
      assigned_operator: 'Waldo Kool Travel Dispatch Center',
      status: 'CONFIRMED_PENDING_PAYMENT'
    };

    if (lang === 'en') {
      return `🎉 **Booking Request Received Successfully!**\\n\\nWe have automatically recorded your reservation for **${tourName}** (${paxAdults} guest(s)).\\n\\n<booking_order>${JSON.stringify(bookingPayload)}</booking_order>\\n\\nOur travel specialist will contact you via **${phone}** within 5 minutes to confirm details and dispatch confirmation documents. You can also transfer the deposit via VietQR BIDV: **5801433856** (NGUYEN DINH DO).`;
    } else if (lang === 'fr') {
      return `🎉 **Demande de Réservation Enregistrée !**\\n\\nNous avons bien pris en compte votre réservation pour **${tourName}** (${paxAdults} personne(s)).\\n\\n<booking_order>${JSON.stringify(bookingPayload)}</booking_order>\\n\\nUn conseiller Waldo Kool Travel vous contactera au **${phone}** dans les 5 minutes pour finaliser votre dossier. Acompte VietQR BIDV : **5801433856** (NGUYEN DINH DO).`;
    } else if (lang === 'zh') {
      return `🎉 **预订意向已成功接收并派单！**\\n\\n系统已为您锁定 **${tourName}**（共 ${paxAdults} 位出行人）的名额。\\n\\n<booking_order>${JSON.stringify(bookingPayload)}</booking_order>\\n\\nWaldo Kool Travel 专属旅游顾问将在5分钟内通过电话/微信联系您 **${phone}**。您也可以通过 VietQR 支付定金：BIDV账号 **5801433856** (NGUYEN DINH DO)。`;
    }

    return `🎉 **Hồ sơ đăng ký giữ chỗ của Quý khách đã được tiếp nhận thành công!**\\n\\nEm đã tạo phiếu điều phối giữ chỗ cho **${tourName}** (Đoàn ${paxAdults} khách):\\n\\n<booking_order>${JSON.stringify(bookingPayload)}</booking_order>\\n\\nChuyên viên điều phối của **Waldo Kool Travel** sẽ gọi điện trực tiếp qua số **${phone}** trong vòng 5 phút để xác nhận lịch trình, hướng dẫn visa và xuất phiếu thu. Quý khách có thể chuyển cọc nhanh qua mã VietQR BIDV: **5801433856** (NGUYEN DINH DO) ạ!`;
  }

  // 4. INTENT 2: TOUR HÀN QUỐC (SEOUL - NAMI - EVERLAND)
  if (norm.includes('han quoc') || norm.includes('seoul') || norm.includes('nami') || norm.includes('everland') || norm.includes('korea') || norm.includes('coree') || lower.includes('韩国') || lower.includes('首尔')) {
    if (norm.includes('gia') || norm.includes('bao nhieu') || norm.includes('cost') || norm.includes('price') || norm.includes('prix') || lower.includes('多少钱') || lower.includes('费用')) {
      return `🇰🇷 **Bảng Giá Trọn Gói Tour Hàn Quốc (Seoul - Nami - Everland) 5N4Đ:**\\n- **Người lớn (≥11 tuổi):** **17.900.000 VNĐ / khách**\\n- **Trẻ em (2 - <11 tuổi):** 16.500.000 VNĐ (ngủ chung giường người lớn)\\n- **Em bé (<2 tuổi):** 5.900.000 VNĐ\\n- **Phụ thu phòng đơn:** 6.800.000 VNĐ\\n- **Tiền Tip HDV & Tài xế:** 35 USD / khách / tour\\n\\n🎁 **Ưu đãi bao gồm trọn gói:** Vé máy bay khứ hồi Vietjet Air, Khách sạn 4★ trung tâm, **Visa Hàn Quốc**, Vé xem **The Painter Show**, Trải nghiệm mặc **Hanbok & làm Kimchi**, toàn bộ bữa ăn chính theo văn hóa ẩm thực Hàn.\\n\\nQuý khách đi mấy người ạ? Để lại SĐT em hỗ trợ giữ chỗ và gửi file PDF lịch trình chi tiết nhé!`;
    }
    if (norm.includes('lich trinh') || norm.includes('itinerary') || norm.includes('di dau') || norm.includes('ngay') || lower.includes('行程')) {
      return `✈️ **Lịch Trình Chi Tiết Tour Hàn Quốc 5N4Đ (Khởi hành 22/11/2026):**\\n- **Đêm 1:** Bay đêm Vietjet Air VJ862 từ Tân Sơn Nhất đi Seoul (02:40 - 09:45).\\n- **Ngày 2:** Khám phá Đảo Nami mùa thu lãng mạn (phim Bản tình ca mùa đông) - Tháp Namsan biểu tượng Seoul.\\n- **Ngày 3:** Vui chơi không giới hạn tại Đại công viên Everland - Mua sắm thiên đường Myeongdong / Hongdae.\\n- **Ngày 4:** Chiêm ngưỡng Cung điện Cảnh Phúc Cung (Gyeongbokgung) - Nhà Xanh - Thưởng thức show nghệ thuật **The Painter Show** đỉnh cao.\\n- **Ngày 5:** Trải nghiệm làm Kimchi & mặc Hanbok - Làng cổ Hanok Bukchon - Con đường đá Deoksugung - Bay Vietjet VJ861 về lại TP.HCM (21:15 - 00:40).\\n\\nAnh/Chị muốn đăng ký đi vào dịp này không ạ?`;
    }
    if (norm.includes('visa') || norm.includes('ho so') || norm.includes('thu tuc') || norm.includes('dau visa') || lower.includes('签证')) {
      return `📋 **Thủ Tục Hồ Sơ Visa Hàn Quốc Trọn Gói Cực Kỳ Đơn Giản:**\\n1. **Nhân thân:** Hộ chiếu gốc còn hạn >6 tháng + 2 hình 3.5x4.5cm nền trắng + CCCD photo.\\n2. **Công việc:** HĐLĐ / Xác nhận việc làm + Sao kê lương 6 tháng + VssID (hoặc GPKD + Biên lai thuế nếu là chủ doanh nghiệp).\\n3. **Thời gian xét duyệt:** Nộp hồ sơ trước ngày khởi hành 20-35 ngày. Tiền cọc giữ chỗ: 9.000.000 VNĐ/khách.\\n\\n*Cam kết:* Waldo Kool Travel hỗ trợ khai form và thẩm định tỷ lệ đậu visa hoàn toàn miễn phí!`;
    }
    return `🇰🇷 **Tour Hàn Quốc: Seoul - Nami - Everland (5N4Đ):**\\n- Khởi hành: **22/11/2026** (Bay Vietjet Air khứ hồi)\\n- Tiêu chuẩn: Khách sạn 4 sao gần trung tâm Seoul\\n- Giá trọn gói: **17.900.000 VNĐ** (Đã bao gồm Visa + Vé The Painter Show + Hanbok + Ăn uống & Tham quan).\\n\\nQuý khách muốn em tư vấn chi tiết về lịch trình hay thủ tục làm Visa nhanh ạ?`;
  }

  // 5. INTENT 3: TOUR ĐỊA ĐẠO CỦ CHI (1 NGÀY)
  if (norm.includes('cu chi') || norm.includes('dia dao') || norm.includes('tunnels') || norm.includes('ban sung') || lower.includes('古芝')) {
    return `🇻🇳 **Tour Khám Phá Địa Đạo Củ Chi Huyền Thoại (01 Ngày):**\\n- **Khởi hành:** 13/11/2026 (08:00 sáng đón tại trung tâm TP.HCM, 15:30 về lại).\\n- **Biểu phí ưu đãi theo đoàn:**\\n  • Nhóm 20 - 24 khách: **1.100.000 VNĐ / khách**\\n  • Nhóm 15 - 19 khách: **1.200.000 VNĐ / khách**\\n  • Nhóm 10 - 14 khách: **1.325.000 VNĐ / khách**\\n- **Trải nghiệm độc đáo:**\\n  + Khám phá mê cung 200km trong lòng đất, bếp Hoàng Cầm, bẫy chông bí mật.\\n  + Thưởng thức khoai mì chấm muối mè và trà nóng chiến khu.\\n  + Thử tài thiện xạ tại trường bắn súng thể thao AK-47 / M16.\\n  + Dùng bữa trưa đặc sản Nam Bộ chất lượng cao: **270.000 VNĐ / suất**.\\n\\nQuý khách dự kiến đi nhóm bao nhiêu người để em báo mức giá chiết khấu tốt nhất ạ?`;
  }

  // 6. INTENT 4: CITY TOUR METRO & CHÙA BỬU LONG (1 NGÀY)
  if (norm.includes('metro') || norm.includes('buu long') || norm.includes('city') || norm.includes('sai gon') || norm.includes('tp hcm') || norm.includes('sen nam bo') || lower.includes('地铁') || lower.includes('宝龙寺')) {
    return `🏙️ **City Tour TP.HCM - Trải Nghiệm Tuyến Metro & Chùa Bửu Long (01 Ngày):**\\n- **Khởi hành:** 28/11/2026 (Tập trung lúc 07:30 sáng tại Nhà hàng Đoàn Viên - 06 Huyền Trân Công Chúa, Q.1).\\n- **Bảng giá trọn gói:**\\n  • Nhóm 25 - 28 khách: **770.000 VNĐ / khách**\\n  • Nhóm 20 - 24 khách: **830.000 VNĐ / khách**\\n- **Điểm nhấn đặc biệt:**\\n  + Ăn sáng tại Nhà hàng Đoàn Viên & Check-in Nhà Hát TP, UBND Thành Phố.\\n  + Trải nghiệm thực tế tuyến **Tàu điện ngầm Metro** hiện đại nhất Việt Nam.\\n  + Viếng Đền Tưởng Niệm các Vua Hùng trang nghiêm.\\n  + Chiêm bái **Chùa Bửu Long** - ngôi chùa với bảo tháp vàng lộng lẫy bên sông Đồng Nai.\\n  + Ăn trưa ẩm thực đồng quê dân dã tại **KDL Sen Nam Bộ**.\\n\\nAnh/Chị nhắn số lượng khách để em hỗ trợ giữ vé tàu Metro sớm nhé!`;
  }

  // 7. INTENT 5: THANH TOÁN, VIETQR, SỐ TÀI KHOẢN, CỌC
  if (norm.includes('thanh toan') || norm.includes('chuyen khoan') || norm.includes('tai khoan') || norm.includes('stk') || norm.includes('bank') || norm.includes('vietqr') || norm.includes('bidv') || norm.includes('coc') || norm.includes('payment') || lower.includes('转账') || lower.includes('银行')) {
    return `💳 **Thông Tin Thanh Toán & Chuyển Khoản Đặt Cọc (VietQR 24/7):**\\n- **Ngân hàng:** BIDV (Chi Nhánh Bình Định)\\n- **Số tài khoản:** **5801433856**\\n- **Chủ tài khoản:** **NGUYEN DINH DO**\\n- **Mức cọc:**\\n  + Tour Hàn Quốc: 9.000.000 VNĐ / khách\\n  + Tour trong ngày: 50% tổng đơn\\n- **Cú pháp chuyển khoản:** \`[Họ tên] + [Số điện thoại] + [Tên Tour]\`\\n\\n*Cam kết an tâm:* Ngay sau khi chuyển cọc, hệ thống AI và phòng điều hành sẽ gửi Email & SMS xác nhận đơn giữ chỗ có giá trị pháp lý trong vòng 5 phút!`;
  }

  // 8. INTENT 6: THÔNG TIN CÔNG TY, LIÊN HỆ, ĐỊA CHỈ, HOTLINE
  if (norm.includes('dia chi') || norm.includes('o dau') || norm.includes('cong ty') || norm.includes('hotline') || norm.includes('sdt') || norm.includes('so dien thoai') || norm.includes('zalo') || norm.includes('contact') || norm.includes('address')) {
    return `🏢 **Thông Tin Doanh Nghiệp Waldo Kool Travel:**\\n- **Trụ sở điều hành:** Số 06 Huyền Trân Công Chúa, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh.\\n- **Hotline & Zalo hỗ trợ 24/7:** **+84 859 613 243** (0859 613 243)\\n- **Email:** booking@waldokooltravel.vn\\n- **Website:** https://waldokool.vercel.app/\\n- **Tôn chỉ phục vụ:** *Gắn Kết Thiên Nhiên • Vẹn Tròn Trải Nghiệm*. Quý khách có thể ghé trực tiếp văn phòng tại Quận 1 hoặc đặt trực tuyến tức thì!`;
  }

  // 9. INTENT 7: CHÀO HỎI / GREETINGS
  if (norm === 'hi' || norm === 'hello' || norm === 'alo' || norm.includes('xin chao') || norm.includes('chao em') || norm.includes('chao ban') || lower === 'bonjour' || lower.includes('你好')) {
    if (lang === 'en') {
      return `Hello! Welcome to **Waldo Kool Travel**. I am your 24/7 AI Travel Assistant.\\n\\nHow can I help you today?\\n1. 🇰🇷 **Korea 5D4N Tour** (Seoul - Nami - Everland)\\n2. 🇻🇳 **Cu Chi Tunnels 1-Day Discovery**\\n3. 🏙️ **HCMC Metro Line & Buu Long Pagoda 1-Day Tour**\\n\\nPlease ask any question or leave your phone number for instant booking!`;
    } else if (lang === 'fr') {
      return `Bonjour ! Bienvenue chez **Waldo Kool Travel**. Je suis votre assistant voyage IA 24/7.\\n\\nQue souhaitez-vous découvrir ?\\n1. 🇰🇷 **Circuit Corée 5J4N** (Séoul - Nami - Everland)\\n2. 🇻🇳 **Excursion Tunnels de Cu Chi (1 Jour)**\\n3. 🏙️ **Métro d'Hô Chi Minh & Pagode Buu Long**\\n\\nPosez-moi votre question ou laissez votre numéro pour une réservation immédiate !`;
    } else if (lang === 'zh') {
      return `您好！欢迎光临 **Waldo Kool Travel**，我是您的24小时智能AI旅游顾问。\\n\\n请问您想咨询哪条线路？\\n1. 🇰🇷 **韩国首尔-南怡岛-爱宝乐园 5天4晚品质游**\\n2. 🇻🇳 **古芝地道历史探秘 1日游**\\n3. 🏙️ **胡志明市地铁与宝龙寺文化 1日游**\\n\\n欢迎随时向我提问，或留下您的电话/微信，我们将立刻为您预留名额！`;
    }

    return `Dạ em xin chào Quý khách! Em là Trợ lý AI Du Lịch của **Waldo Kool Travel**.\\n\\nEm luôn sẵn sàng hỗ trợ Anh/Chị 24/7 về:\\n- 🇰🇷 **Tour Hàn Quốc 5N4Đ** (Seoul - Nami - Everland, bay Vietjet, tặng Painter Show & Visa)\\n- 🇻🇳 **Tour Địa Đạo Củ Chi 1N** (Bắn súng thể thao, ăn trưa đặc sản 270k)\\n- 🏙️ **City Tour TP.HCM & Tuyến Metro 1N** (Chùa Bửu Long, KDL Sen Nam Bộ)\\n- 💳 Hướng dẫn thủ tục Visa & thanh toán cọc VietQR BIDV\\n\\nAnh/Chị đang quan tâm đến hành trình nào để em tư vấn chi tiết ngay ạ?`;
  }

  // 10. DEFAULT INTELLIGENT HELPER
  return `Dạ em đã nhận được câu hỏi: **"${raw}"**.\\n\\nĐể hỗ trợ tốt nhất, Anh/Chị có thể hỏi em về:\\n- **Báo giá & Lịch trình** các tour Hàn Quốc, Củ Chi hoặc City Tour Metro.\\n- **Hồ sơ xin Visa Hàn Quốc** cần những giấy tờ gì.\\n- **Cách chuyển cọc VietQR BIDV (5801433856 - NGUYEN DINH DO)**.\\n\\nHoặc Anh/Chị có thể để lại **Số Điện Thoại / Zalo**, chuyên viên điều phối của Waldo Kool Travel sẽ liên hệ tư vấn trực tiếp trong 5 phút ạ!`;
};


  const generateKnowledgeResponse = generateSuperSmartResponse;

  // 9. API CALL HANDLER (WEBHOOK)
  const sendMessageToServer = async (userText) => {
    appendMessage(userText, 'user');
    saveMessageToHistory('user', userText);
    setTyping(true);

    const payload = {
      session_id: sessionId,
      message: userText,
      history: getHistory()
    };

    // If webhookUrl is a placeholder/mock domain, reply instantly using built-in RAG Tour Knowledge Engine
    const isMockWebhook = !CONFIG.webhookUrl || CONFIG.webhookUrl.includes('waldokooltravel.vn') || CONFIG.webhookUrl.includes('vietjourneys.vn');

    if (isMockWebhook) {
      setTimeout(() => {
        setTyping(false);
        const botReply = generateKnowledgeResponse(userText);
        const cleanedReply = detectAndProcessBookingOrder(botReply);
        if (cleanedReply) {
          appendMessage(cleanedReply, 'bot');
          saveMessageToHistory('assistant', cleanedReply);
        }
      }, 400);
      return;
    }

    // Otherwise, call live connected webhook (e.g., Dify, n8n, Flowise)
    try {
      const response = await fetch(CONFIG.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setTyping(false);

      // Support common response structures: data.response, data.reply, or data.message
      const rawBotReply = data.response || data.reply || data.message || data.output || 'Dạ em đã nhận được yêu cầu của Anh/Chị ạ!';
      
      // Check and trigger booking dispatcher
      const cleanedReply = detectAndProcessBookingOrder(rawBotReply);
      if (cleanedReply) {
        appendMessage(cleanedReply, 'bot');
        saveMessageToHistory('assistant', cleanedReply);
      }

    } catch (error) {
      console.warn('[TourFlow Chat Webhook Notice]: Calling fallback Knowledge Base Engine');
      setTimeout(() => {
        setTyping(false);
        const botReply = generateKnowledgeResponse(userText);
        const cleanedReply = detectAndProcessBookingOrder(botReply);
        if (cleanedReply) {
          appendMessage(cleanedReply, 'bot');
          saveMessageToHistory('assistant', cleanedReply);
        }
      }, 300);
    }
  };

  // 10. SETUP QUICK REPLIES
  const setupQuickReplies = () => {
    const container = document.getElementById('tf-quick-replies');
    if (!container) return;
    container.innerHTML = '';

    CONFIG.quickReplies.forEach(text => {
      const chip = document.createElement('button');
      chip.className = 'tf-chip';
      chip.type = 'button';
      chip.textContent = text;
      chip.onclick = () => {
        container.style.display = 'none'; // Hide after first selection
        sendMessageToServer(text);
      };
      container.appendChild(chip);
    });
  };

  // 11. EVENT LISTENERS & INITIALIZATION
  const init = () => {
    injectStyles();
    createWidgetDOM();

    const fabBtn = document.getElementById('tf-fab-btn');
    const closeBtn = document.getElementById('tf-close-btn');
    const chatWindow = document.getElementById('tf-chat-window');
    const chatForm = document.getElementById('tf-chat-form');
    const chatInput = document.getElementById('tf-chat-input');
    const badge = document.getElementById('tf-fab-badge');

    // Toggle Window Open/Close
    const toggleWindow = () => {
      isOpen = !isOpen;
      if (isOpen) {
        chatWindow.classList.add('tf-open');
        if (badge) badge.style.display = 'none';
        setTimeout(() => chatInput && chatInput.focus(), 300);
      } else {
        chatWindow.classList.remove('tf-open');
      }
    };

    fabBtn.addEventListener('click', toggleWindow);
    closeBtn.addEventListener('click', toggleWindow);

    // Form Submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text || isTyping) return;
      chatInput.value = '';
      sendMessageToServer(text);
    });

    // Restore History or Send Delayed Welcome
    const savedHistory = getHistory();
    if (savedHistory.length > 0) {
      savedHistory.forEach(item => {
        appendMessage(item.content, item.role === 'user' ? 'user' : 'bot');
      });
      document.getElementById('tf-quick-replies').style.display = 'none';
    } else {
      setTimeout(() => {
        const welcomeText = `Xin chào Quý khách! 👋 Em là **${CONFIG.botName}** - Trợ lý AI chuyên hỗ trợ tư vấn tour và điều phối đặt chỗ tự động. Quý khách cần hỗ trợ lịch trình hay bảng giá dịch vụ nào hôm nay ạ?`;
        appendMessage(welcomeText, 'bot');
        saveMessageToHistory('assistant', welcomeText);
        setupQuickReplies();
      }, CONFIG.welcomeDelayMs);
    }

    // Expose Public API
    window.TourFlowWidget = {
      open: () => !isOpen && toggleWindow(),
      close: () => isOpen && toggleWindow(),
      send: (msg) => sendMessageToServer(msg),
      clearHistory: () => {
        sessionStorage.removeItem(CONFIG.historyStorageKey);
        document.getElementById('tf-messages-feed').innerHTML = '';
      }
    };

    // Alias window.TourFlowChat for full compatibility with landing page buttons
    window.TourFlowChat = {
      toggleWindow: (forceOpen) => {
        if (forceOpen === true && !isOpen) {
          toggleWindow();
        } else if (forceOpen === false && isOpen) {
          toggleWindow();
        } else if (forceOpen === undefined) {
          toggleWindow();
        }
      },
      sendMessage: (msg) => {
        if (!isOpen) toggleWindow();
        setTimeout(() => {
          sendMessageToServer(msg);
        }, 300);
      }
    };
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
