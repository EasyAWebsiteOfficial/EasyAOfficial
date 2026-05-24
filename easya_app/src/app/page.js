'use client';

// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';

// Service configurations matching Odoo pricing rules exactly
const SERVICES = [
  { value: 'data', name: 'Thu Thập Dữ Liệu', price: 200000, unit: 'Mẫu' },
  { value: 'plagiarism', name: 'Kiểm Tra Đạo Văn (Turnitin)', price: 50000, unit: 'Bài' },
  { value: 'ai_check', name: 'Quét Đạo Văn AI (AI Scan)', price: 70000, unit: 'Bài' },
  { value: 'paraphrase', name: 'Hạ Đạo Văn & Hạ Tỷ Lệ AI', price: 120000, unit: 'Trang' },
  { value: 'spss', name: 'Xử Lý Số Liệu (SPSS/Stata/SmartPLS)', price: 1500000, unit: 'Gói' },
  { value: 'research', name: 'Nghiên Cứu Khoa Học Trọn Gói', price: 4000000, unit: 'Đề tài' },
  { value: 'thesis', name: 'Viết Khóa Luận / Báo Cáo Thực Tập', price: 3000000, unit: 'Đề tài' },
  { value: 'essay', name: 'Viết Tiểu Luận Học Phần', price: 350000, unit: 'Trang' },
  { value: 'slides', name: 'Giải Bài Tập & Thiết Kế Slide', price: 250000, unit: 'Bài' }
];

const LEVELS = [
  { value: 'uni', name: 'Hệ Đại Học (Bình thường)', multiplier: 1.0 },
  { value: 'postgrad', name: 'Hệ Cao Học / Thạc Sĩ', multiplier: 1.3 }
];

const DEADLINES = [
  { value: 'normal', name: 'Thường (Trên 7 ngày)', multiplier: 1.0 },
  { value: 'fast', name: 'Nhanh (3 đến 7 ngày)', multiplier: 1.2 },
  { value: 'urgent', name: 'Hỏa Tốc (Dưới 3 ngày)', multiplier: 1.5 }
];

export default function EasyAHomepage() {
  // Majors active tab state
  const [activeTab, setActiveTab] = useState('business');

  // Calculator states
  const [service, setService] = useState('data');
  const [level, setLevel] = useState('uni');
  const [qty, setQty] = useState(1);
  const [deadline, setDeadline] = useState('normal');

  // Contact info states
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactUni, setContactUni] = useState('');

  // Result and loading states
  const [totalPrice, setTotalPrice] = useState(200000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ type: '', text: '' });

  // Calculate pricing whenever inputs change
  useEffect(() => {
    const selectedService = SERVICES.find(s => s.value === service);
    const selectedLevel = LEVELS.find(l => l.value === level);
    const selectedDeadline = DEADLINES.find(d => d.value === deadline);

    if (selectedService && selectedLevel && selectedDeadline) {
      const price = selectedService.price * qty * selectedLevel.multiplier * selectedDeadline.multiplier;
      setTotalPrice(price);
    }
  }, [service, level, qty, deadline]);

  // Format price into VND currency string
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', 'đ');
  };

  // Get unit label for currently selected service
  const getUnit = () => {
    const selected = SERVICES.find(s => s.value === service);
    return selected ? selected.unit : 'Mẫu';
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactName || !contactPhone || !contactUni) {
      setSubmitMsg({ type: 'danger', text: 'Vui lòng nhập đầy đủ thông tin liên hệ!' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMsg({ type: '', text: '' });

    const selectedService = SERVICES.find(s => s.value === service)?.name || '';
    const selectedLevel = LEVELS.find(l => l.value === level)?.name || '';
    const selectedDeadline = DEADLINES.find(d => d.value === deadline)?.name || '';

    const payload = {
      name: contactName,
      phone: contactPhone,
      university: contactUni,
      service: selectedService,
      level: selectedLevel,
      qty: `${qty} ${getUnit()}`,
      deadline: selectedDeadline,
      price_estimate: formatVND(totalPrice)
    };

    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMsg({
          type: 'success',
          text: 'Gửi đăng ký thành công! Đội ngũ chuyên gia Easy A sẽ liên hệ qua Zalo/SĐT trong vòng 5 phút.'
        });
        // Reset form
        setContactName('');
        setContactPhone('');
        setContactUni('');
        setQty(1);
        setService('data');
        setLevel('uni');
        setDeadline('normal');
      } else {
        setSubmitMsg({
          type: 'danger',
          text: data.error || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng gọi Hotline trực tiếp!'
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitMsg({
        type: 'danger',
        text: 'Không thể kết nối máy chủ. Vui lòng chat Zalo hỗ trợ trực tiếp!'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* SECTION 0: NAVBAR HEADER */}
      <header className="easya-navbar">
        <div className="easya-nav-container">
          <a href="#" className="easya-logo">
            🎓 Easy<span>A</span>
          </a>
          <ul className="easya-nav-links">
            <li><a href="#services">Dịch Vụ</a></li>
            <li><a href="#majors">Khối Ngành</a></li>
            <li><a href="#calculator">Tính Phí Ước Tính</a></li>
            <li><a href="#testimonials">Đánh Giá</a></li>
            <li><a href="#calculator" className="easya-nav-btn">Tư Vấn Ngay</a></li>
          </ul>
        </div>
      </header>

      {/* SECTION 1: HERO BANNER */}
      <section className="easya-hero-section">
        <div className="hero-left">
          <span className="badge-slogan">
            <i className="fa-solid fa-star me-2"></i> Uy tín - Kịp thời - Chất lượng
          </span>
          <h1 className="hero-title">Đồng Hành Học Tập Đạt Điểm A Dễ Dàng</h1>
          <p className="hero-subtitle">
            Easy A cung cấp trọn gói giải pháp học tập toàn diện cho sinh viên các trường Đại học tại Việt Nam. Từ thu thập số liệu, xử lý thống kê đến viết tiểu luận, báo cáo thực tập và hỗ trợ nghiên cứu khoa học chuyên sâu.
          </p>
          <div className="hero-actions">
            <a href="#calculator" className="btn-primary">
              <i className="fa-solid fa-calculator me-2"></i> Tính Phí Ước Tính
            </a>
            <a href="#services" className="btn-secondary">
              <i className="fa-solid fa-list-check me-2"></i> Xem Dịch Vụ
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-stats-card">
            <div className="stat-item stat-item-blue">
              <i className="fa-solid fa-graduation-cap"></i>
              <h3>50+</h3>
              <p>Ngành Học</p>
            </div>
            <div className="stat-item stat-item-yellow">
              <i className="fa-solid fa-circle-check"></i>
              <h3>100%</h3>
              <p>Hài Lòng</p>
            </div>
            <div className="stat-item stat-item-info">
              <i className="fa-solid fa-bolt"></i>
              <h3>24/7</h3>
              <p>Kịp Thời</p>
            </div>
            <div className="stat-item stat-item-green">
              <i className="fa-solid fa-award"></i>
              <h3>9.5+</h3>
              <p>GPA TB</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CORE SERVICES GRID */}
      <section id="services">
        <div className="section-title-wrap">
          <span>Hỗ Trợ Học Tập Trọn Gói</span>
          <h2>Dịch Vụ Nổi Bật Tại Easy A</h2>
          <p>Đội ngũ chuyên gia từ Easy A sẵn sàng đồng hành cùng sinh viên giải quyết mọi khó khăn học tập.</p>
        </div>

        <div className="services-grid">
          {/* Card 1 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-database"></i>
            </div>
            <h3 className="service-card-title">Thu Thập Dữ Liệu</h3>
            <p className="service-card-text">
              Hỗ trợ thiết kế &amp; phân phối Google Form. Thu thập dữ liệu tài chính từ sàn chứng khoán, dữ liệu phi tài chính và dữ liệu sơ cấp/thứ cấp đa dạng phục vụ nghiên cứu khoa học.
            </p>
          </div>

          {/* Card 2 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-file-shield"></i>
            </div>
            <h3 className="service-card-title">Kiểm Tra Đạo Văn</h3>
            <p className="service-card-text">
              Hỗ trợ quét đạo văn bằng hệ thống tiêu chuẩn quốc tế như **Turnitin** và các phần mềm chuyên biệt tương thích chính xác với quy chế của từng trường Đại học.
            </p>
          </div>

          {/* Card 3 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-robot"></i>
            </div>
            <h3 className="service-card-title">Quét Đạo Văn AI</h3>
            <p className="service-card-text">
              Sử dụng công nghệ AI tiên tiến để quét, rà soát và phát hiện tỷ lệ các nội dung được khởi tạo bằng trí tuệ nhân tạo (ChatGPT, Claude...) trước khi nộp bài.
            </p>
          </div>

          {/* Card 4 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-pen-nib"></i>
            </div>
            <h3 className="service-card-title">Hạ Đạo Văn &amp; Hạ Tỷ Lệ AI</h3>
            <p className="service-card-text">
              Biên tập, viết lại (paraphrase) thủ công chuyên nghiệp giúp tối ưu câu chữ, cam kết hạ thấp tỷ lệ đạo văn và tỷ lệ AI đạt chuẩn quy định của giảng viên.
            </p>
          </div>

          {/* Card 5 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <h3 className="service-card-title">Xử Lý Số Liệu &amp; Thống Kê</h3>
            <p className="service-card-text">
              Phân tích chuyên sâu và chạy số liệu định lượng chuẩn xác bằng các công cụ hàng đầu: **SPSS**, **Stata**, **SmartPLS**, **Amos**, phiên giải kết quả chi tiết.
            </p>
          </div>

          {/* Card 6 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <h3 className="service-card-title">Nghiên Cứu Khoa Học</h3>
            <p className="service-card-text">
              Gói hỗ trợ làm bài nghiên cứu khoa học chuyên sâu, định hình ý tưởng, lập đề cương chi tiết và hoàn thiện nội dung cho hơn 50+ ngành học toàn quốc.
            </p>
          </div>

          {/* Card 7 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <h3 className="service-card-title">Báo Cáo &amp; Khóa Luận</h3>
            <p className="service-card-text">
              Hỗ trợ trọn gói khóa luận tốt nghiệp, chuyên đề tốt nghiệp, báo cáo thực tập, viết nhật ký thực tập cam kết bảo mật thông tin và bám sát yêu cầu.
            </p>
          </div>

          {/* Card 8 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-scroll"></i>
            </div>
            <h3 className="service-card-title">Tiểu Luận Học Phần</h3>
            <p className="service-card-text">
              Nhận viết bài tiểu luận chất lượng cao ở tất cả các môn chuyên ngành và môn đại cương (Mác-Lênin, Tư tưởng Hồ Chí Minh, Pháp luật đại cương...).
            </p>
          </div>

          {/* Card 9 */}
          <div className="service-card">
            <div className="service-icon-box">
              <i className="fa-solid fa-palette"></i>
            </div>
            <h3 className="service-card-title">Hỗ Trợ Giải Bài Tập &amp; Thiết Kế</h3>
            <p className="service-card-text">
              Giải bài tập chuyên ngành, thiết kế Slide báo cáo thuyết trình chuyên nghiệp (Canva, PowerPoint), vẽ phác thảo kỹ thuật/mỹ thuật theo yêu cầu riêng.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: MAJORS PORTAL (70+ MAJORS CATEGORIZED) */}
      <section id="majors" className="easya-majors-section">
        <div className="section-title-wrap">
          <span>Hỗ Trợ Toàn Diện</span>
          <h2>Danh Mục Các Khối Ngành Hỗ Trợ</h2>
          <p>Easy A có mạng lưới cộng tác viên rộng lớn hỗ trợ sinh viên tại hơn 70+ chuyên ngành học khác nhau.</p>
        </div>

        {/* Tabs Select Menu */}
        <div className="tabs-menu">
          <button 
            className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <i className="fa-solid fa-briefcase"></i> Kinh Doanh &amp; Quản Lý
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tech' ? 'active' : ''}`}
            onClick={() => setActiveTab('tech')}
          >
            <i className="fa-solid fa-laptop-code"></i> CNTT &amp; Kỹ Thuật
          </button>
          <button 
            className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <i className="fa-solid fa-heart-pulse"></i> Y Tế &amp; Sức Khỏe
          </button>
          <button 
            className={`tab-btn ${activeTab === 'humanities' ? 'active' : ''}`}
            onClick={() => setActiveTab('humanities')}
          >
            <i className="fa-solid fa-language"></i> Nhân Văn &amp; Xã Hội
          </button>
        </div>

        {/* Tab Panels */}
        <div className="majors-panel">
          {activeTab === 'business' && (
            <>
              <div className="major-item-tag">Quản trị kinh doanh</div>
              <div className="major-item-tag">Marketing</div>
              <div className="major-item-tag">Kinh doanh quốc tế</div>
              <div className="major-item-tag">Tài chính – Ngân hàng</div>
              <div className="major-item-tag">Kế toán</div>
              <div className="major-item-tag">Kiểm toán</div>
              <div className="major-item-tag">Logistics &amp; Chuỗi cung ứng</div>
              <div className="major-item-tag">Thương mại điện tử</div>
              <div className="major-item-tag">Quản trị nhân lực</div>
              <div className="major-item-tag">Bất động sản</div>
              <div className="major-item-tag">Kinh tế học</div>
              <div className="major-item-tag">Kinh tế quốc tế</div>
            </>
          )}

          {activeTab === 'tech' && (
            <>
              <div className="major-item-tag">Công nghệ thông tin</div>
              <div className="major-item-tag">Khoa học máy tính</div>
              <div className="major-item-tag">Kỹ thuật phần mềm</div>
              <div className="major-item-tag">Trí tuệ nhân tạo (AI)</div>
              <div className="major-item-tag">Thiết kế vi mạch bán dẫn</div>
              <div className="major-item-tag">Khoa học dữ liệu</div>
              <div className="major-item-tag">Kỹ thuật điều khiển &amp; TĐH</div>
              <div className="major-item-tag">Điện tử – Viễn thông</div>
              <div className="major-item-tag">Công nghệ kỹ thuật ô tô</div>
              <div className="major-item-tag">Kỹ thuật cơ điện tử</div>
              <div className="major-item-tag">Kiến trúc &amp; Xây dựng</div>
              <div className="major-item-tag">Công nghệ thực phẩm</div>
            </>
          )}

          {activeTab === 'health' && (
            <>
              <div className="major-item-tag">Y đa khoa (Bác sĩ)</div>
              <div className="major-item-tag">Răng – Hàm – Mặt</div>
              <div className="major-item-tag">Dược học</div>
              <div className="major-item-tag">Điều dưỡng</div>
              <div className="major-item-tag">Y học cổ truyền</div>
              <div className="major-item-tag">Kỹ thuật xét nghiệm y học</div>
              <div className="major-item-tag">Kỹ thuật phục hồi chức năng</div>
              <div className="major-item-tag">Y tế công cộng</div>
            </>
          )}

          {activeTab === 'humanities' && (
            <>
              <div className="major-item-tag">Ngôn ngữ Anh / Hàn / Nhật</div>
              <div className="major-item-tag">Tâm lý học hành vi</div>
              <div className="major-item-tag">Truyền thông đa phương tiện</div>
              <div className="major-item-tag">Quan hệ công chúng (PR)</div>
              <div className="major-item-tag">Luật kinh tế / Luật học</div>
              <div className="major-item-tag">Quan hệ quốc tế</div>
              <div className="major-item-tag">Quản trị du lịch &amp; lữ hành</div>
              <div className="major-item-tag">Sư phạm Tiểu học / Mầm non</div>
            </>
          )}
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE PRICING CALCULATOR */}
      <section id="calculator" className="easya-calculator-section">
        <div className="section-title-wrap">
          <span>Ước Tính Phí Nhanh</span>
          <h2>Công Cụ Tính Chi Phí Hỗ Trợ Học Tập</h2>
          <p>Dễ dàng lựa chọn dịch vụ phù hợp để ước lượng khoảng giá dự kiến. Cam kết giá cả hợp lý, đi đôi với chất lượng điểm A.</p>
        </div>

        <div className="calculator-card-layout">
          {/* Form */}
          <div className="calculator-wrapper">
            <form onSubmit={handleSubmit} className="calc-form-row">
              {/* Service Select */}
              <div>
                <label className="form-group-label">Dịch Vụ Cần Hỗ Trợ</label>
                <select 
                  value={service} 
                  onChange={(e) => setService(e.target.value)}
                  className="form-select"
                  required
                >
                  {SERVICES.map(s => (
                    <option key={s.value} value={s.value}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Level Select */}
              <div>
                <label className="form-group-label">Cấp Độ Học Tập</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)}
                  className="form-select"
                  required
                >
                  {LEVELS.map(l => (
                    <option key={l.value} value={l.value}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="form-group-label">Khối Lượng ({getUnit()})</label>
                <input 
                  type="number" 
                  value={qty} 
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="form-control"
                  min="1"
                  required
                />
              </div>

              {/* Deadline Select */}
              <div>
                <label className="form-group-label">Thời Hạn Hoàn Thành</label>
                <select 
                  value={deadline} 
                  onChange={(e) => setDeadline(e.target.value)}
                  className="form-select"
                  required
                >
                  {DEADLINES.map(d => (
                    <option key={d.value} value={d.value}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div className="form-group-full" style={{ borderTop: '1px dashed rgba(10,54,94,0.15)', margin: '1rem 0' }}></div>

              <h4 className="form-group-full" style={{ marginBottom: '0.5rem' }}>
                <i className="fa-solid fa-user-edit me-2"></i> Thông Tin Liên Hệ Tư Vấn
              </h4>

              {/* Name */}
              <div>
                <label className="form-group-label">Họ &amp; Tên Của Bạn</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="form-control"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="form-group-label">Số Điện Thoại / Zalo</label>
                <input 
                  type="tel" 
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="form-control"
                  placeholder="Ví dụ: 0987654321"
                  required
                />
              </div>

              {/* University */}
              <div className="form-group-full">
                <label className="form-group-label">Trường Đại Học Đang Theo Học</label>
                <input 
                  type="text" 
                  value={contactUni}
                  onChange={(e) => setContactUni(e.target.value)}
                  className="form-control"
                  placeholder="Ví dụ: Đại học Ngoại Thương (FTU)"
                  required
                />
              </div>
            </form>
          </div>

          {/* Pricing Output */}
          <div className="price-display-box">
            <span className="price-label">Giá Ước Tính Dự Kiến</span>
            <div className="price-value">{formatVND(totalPrice)}</div>
            <p className="price-note">
              Đây là mức giá tối thiểu ước tính cho gói dịch vụ của bạn. Chi phí thực tế có thể thay đổi tùy theo yêu cầu cụ thể của giảng viên hoặc tài liệu mẫu đi kèm.
            </p>
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="btn-warning-lg"
            >
              {isSubmitting ? (
                <><i className="fa-solid fa-circle-notch fa-spin me-2"></i> Đang gửi đăng ký...</>
              ) : (
                <><i className="fa-solid fa-paper-plane me-2"></i> Đăng Ký Tư Vấn Chi Tiết</>
              )}
            </button>

            {submitMsg.text && (
              <div 
                style={{ 
                  marginTop: '1.5rem', 
                  fontSize: '0.9rem', 
                  fontWeight: '700',
                  color: submitMsg.type === 'success' ? '#10b981' : '#f87171'
                }}
              >
                {submitMsg.type === 'success' ? (
                  <i className="fa-solid fa-circle-check me-2"></i>
                ) : (
                  <i className="fa-solid fa-triangle-exclamation me-2"></i>
                )}
                {submitMsg.text}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 5: STUDENT TESTIMONIALS */}
      <section id="testimonials" className="easya-testimonials-section">
        <div className="section-title-wrap">
          <span>Cảm Nhận Từ Học Viên</span>
          <h2>Sinh Viên Nói Gì Về Easy A?</h2>
        </div>

        <div className="testimonials-grid">
          {/* Testimonial 1 */}
          <div className="feedback-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p className="feedback-content">
              "Mình làm đề tài nghiên cứu khoa học chuyên ngành tài chính nhưng kẹt phần chạy số liệu Stata. Nhờ Easy A thu thập số liệu và hướng dẫn chạy kiểm định, mình đã được 9.5 bảo vệ thành công!"
            </p>
            <div className="user-info">
              <div className="avatar-placeholder">MT</div>
              <div className="user-details">
                <h5>Minh Thư</h5>
                <p>Sinh viên Kinh tế Quốc dân (NEU)</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="feedback-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p className="feedback-content">
              "Bài khóa luận của mình quét Turnitin ra tới 32% đạo văn. May có dịch vụ hạ đạo văn và giảm AI của Easy A, bài nộp cuối cùng chỉ còn 8%, giảng viên khen biên tập câu chữ rất mượt."
            </p>
            <div className="user-info">
              <div className="avatar-placeholder">DK</div>
              <div className="user-details">
                <h5>Duy Khánh</h5>
                <p>Sinh viên Bách Khoa (HUST)</p>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="feedback-card">
            <div className="stars">
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p className="feedback-content">
              "Dịch vụ cực kỳ uy tín và kịp thời! Mình cần làm Slide báo cáo Canva gấp trong đêm để sáng mai thuyết trình. Đội ngũ Easy A hoàn thành đúng giờ và slide thiết kế siêu bắt mắt!"
            </p>
            <div className="user-info">
              <div className="avatar-placeholder">LA</div>
              <div className="user-details">
                <h5>Lan Anh</h5>
                <p>Sinh viên Ngoại Thương (FTU)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: 'var(--primary-color)', color: 'rgba(255,255,255,0.7)', padding: '4rem 1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--pure-white)', fontFamily: 'var(--font-outfit)', fontSize: '1.5rem' }}>🎓 Easy A Support</h3>
          <p style={{ maxWidth: '500px', fontSize: '0.9rem', lineHeight: '1.6' }}>Đồng hành cùng hàng ngàn sinh viên Việt Nam vươn tới điểm số tối đa. Uy tín, bảo mật thông tin và trách nhiệm trọn vẹn.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="https://zalo.me/0767816876" target="_blank" style={{ color: 'var(--secondary-color)', fontSize: '1.25rem' }}><i className="fa-solid fa-comments"></i></a>
            <a href="tel:0767816876" style={{ color: 'var(--secondary-color)', fontSize: '1.25rem' }}><i className="fa-solid fa-phone"></i></a>
          </div>
          <p style={{ fontSize: '0.8rem', marginTop: '2rem' }}>&copy; {new Date().getFullYear()} Easy A. All rights reserved.</p>
        </div>
      </footer>

      {/* SECTION 6: FLOATING CONTACT CTAS */}
      <div className="easya-floating-ctas">
        {/* Zalo */}
        <a 
          href="https://zalo.me/0767816876" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="floating-btn zalo-btn"
          title="Tư vấn nhanh qua Zalo"
        >
          <i className="fa-solid fa-comments"></i>
          <span className="tooltip-text">Chat Zalo 24/7</span>
        </a>
        
        {/* Phone */}
        <a 
          href="tel:0767816876" 
          className="floating-btn phone-btn"
          title="Gọi Hotline hỗ trợ"
        >
          <i className="fa-solid fa-phone-volume"></i>
          <span className="tooltip-text">Call 076.781.6876</span>
        </a>
      </div>
    </>
  );
}
