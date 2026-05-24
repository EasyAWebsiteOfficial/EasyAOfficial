'use client';

// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';

// Pricing config matching homepage exactly to calculate manual leads
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

export default function EasyAAdminDashboard() {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Leads and loading state
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Manual Lead Creation Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadUni, setNewLeadUni] = useState('');
  const [newLeadService, setNewLeadService] = useState('data');
  const [newLeadLevel, setNewLeadLevel] = useState('uni');
  const [newLeadQty, setNewLeadQty] = useState(1);
  const [newLeadDeadline, setNewLeadDeadline] = useState('normal');
  const [newLeadStatus, setNewLeadStatus] = useState('new');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);

  // Active note editing states
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Handle local session storage for passcode so user doesn't have to retype constantly
  useEffect(() => {
    const savedAuth = localStorage.getItem('easya_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchLeads();
    }
  }, []);

  // Fetch leads from PostgreSQL API
  const fetchLeads = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        setIsOffline(data.offline || false);
      } else {
        setError(data.error || 'Không thể tải danh sách leads.');
      }
    } catch (e) {
      console.error(e);
      setError('Lỗi kết nối API Serverless.');
    } finally {
      setLoading(false);
    }
  };

  // Authenticate Admin Passcode
  const handleLogin = (e) => {
    e.preventDefault();
    // Valid passcodes: '0901374245' (account password) or 'easya2026'
    if (passcode === '0901374245' || passcode === 'easya2026') {
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('easya_admin_auth', 'true');
      fetchLeads();
    } else {
      setAuthError('Mã passcode không chính xác. Vui lòng nhập lại!');
    }
  };

  // Sign out
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    localStorage.removeItem('easya_admin_auth');
  };

  // Convert estimate strings (e.g., "1.500.000 đ") to pure integers for summation
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

  // Format integer to VND currency
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(amount)
      .replace('₫', 'đ');
  };

  // Calculate pricing for manual leads input
  const calculateEstimate = () => {
    const s = SERVICES.find(x => x.value === newLeadService);
    const l = LEVELS.find(x => x.value === newLeadLevel);
    const d = DEADLINES.find(x => x.value === newLeadDeadline);
    if (s && l && d) {
      return formatVND(s.price * newLeadQty * l.multiplier * d.multiplier);
    }
    return "0 đ";
  };

  // Handle lead status updates
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        // Optimistically update UI
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      } else {
        alert('Cập nhật trạng thái thất bại: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Lỗi mạng khi cập nhật trạng thái.');
    }
  };

  // Handle note updates
  const handleNoteSave = async (id) => {
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: editingNoteText })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === id ? { ...l, admin_notes: editingNoteText } : l));
        setEditingNoteId(null);
      } else {
        alert('Cập nhật ghi chú thất bại: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Lỗi mạng khi cập nhật ghi chú.');
    }
  };

  // Handle lead deletions
  const handleDeleteLead = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lead này? Thao tác không thể khôi phục.')) return;
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setLeads(leads.filter(l => l.id !== id));
      } else {
        alert('Xóa lead thất bại: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Lỗi mạng khi xóa lead.');
    }
  };

  // Handle manual lead registration submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) {
      alert('Vui lòng nhập tên học viên và số điện thoại!');
      return;
    }

    setFormIsSubmitting(true);
    const selectedService = SERVICES.find(s => s.value === newLeadService);

    const payload = {
      name: newLeadName,
      phone: newLeadPhone,
      university: newLeadUni,
      service: selectedService?.name || '',
      level: LEVELS.find(l => l.value === newLeadLevel)?.name || '',
      qty: `${newLeadQty} ${selectedService?.unit || 'Bài'}`,
      deadline: DEADLINES.find(d => d.value === newLeadDeadline)?.name || '',
      price_estimate: calculateEstimate(),
      status: newLeadStatus,
      admin_notes: newLeadNotes
    };

    try {
      const response = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        alert('Thêm Lead thủ công thành công!');
        // Reset and hide form
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadUni('');
        setNewLeadNotes('');
        setNewLeadQty(1);
        setShowAddForm(false);
        fetchLeads(); // Reload leads
      } else {
        alert('Lỗi thêm lead: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Lỗi kết nối khi lưu lead mới.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // Perform filtering and searching in frontend
  const filteredLeads = leads.filter(l => {
    const matchSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.university && l.university.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchService = serviceFilter === 'all' || (l.service && l.service.includes(serviceFilter));

    return matchSearch && matchStatus && matchService;
  });

  // Calculate statistics from filtered list
  const totalCount = filteredLeads.length;
  const newCount = filteredLeads.filter(l => l.status === 'new' || !l.status).length;
  const contactingCount = filteredLeads.filter(l => l.status === 'contacting').length;
  const completedCount = filteredLeads.filter(l => l.status === 'completed').length;
  
  const estimatedRevenue = filteredLeads
    .filter(l => l.status !== 'cancelled')
    .reduce((sum, l) => sum + parsePrice(l.price_estimate), 0);

  const conversionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : "0.0";

  // Login Form Render
  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        <style jsx global>{`
          .admin-login-overlay {
            min-height: 100vh;
            background: radial-gradient(circle at top, #0f243a 0%, #050a12 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', system-ui, sans-serif;
            padding: 1.5rem;
          }
          .login-card {
            background: rgba(13, 27, 42, 0.7);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 195, 49, 0.15);
            padding: 2.5rem;
            border-radius: 20px;
            width: 100%;
            max-width: 420px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            text-align: center;
            color: #fefeff;
          }
          .login-icon {
            font-size: 3rem;
            color: #ffc331;
            margin-bottom: 1rem;
            display: inline-block;
            animation: pulse 2s infinite ease-in-out;
          }
          @keyframes pulse {
            0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255,195,49,0.2)); }
            50% { transform: scale(1.05); filter: drop-shadow(0 0 12px rgba(255,195,49,0.5)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(255,195,49,0.2)); }
          }
          .login-card h2 {
            margin-bottom: 0.5rem;
            font-weight: 800;
            color: #ffc331;
          }
          .login-card p {
            font-size: 0.85rem;
            color: rgba(255,255,255,0.6);
            margin-bottom: 2rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }
          .form-group label {
            display: block;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.5rem;
            color: rgba(255,255,255,0.8);
          }
          .passcode-input {
            width: 100%;
            padding: 0.85rem 1rem;
            background: rgba(5, 10, 18, 0.6);
            border: 1px solid rgba(255, 195, 49, 0.3);
            border-radius: 8px;
            color: #fefeff;
            font-size: 1.1rem;
            letter-spacing: 3px;
            text-align: center;
            transition: all 0.3s;
          }
          .passcode-input:focus {
            outline: none;
            border-color: #ffc331;
            box-shadow: 0 0 10px rgba(255, 195, 49, 0.25);
          }
          .btn-login {
            width: 100%;
            padding: 0.85rem;
            background: linear-gradient(135deg, #ffc331 0%, #d49d00 100%);
            border: none;
            border-radius: 8px;
            color: #050a12;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
          }
          .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 195, 49, 0.4);
          }
          .auth-error {
            color: #ff6b6b;
            font-size: 0.8rem;
            margin-top: 1rem;
            font-weight: 600;
          }
        `}</style>
        <div className="login-card">
          <span className="login-icon">🔑</span>
          <h2>Cổng Quản Trị Easy A</h2>
          <p>Nhập mã passcode bảo mật để kết nối dữ liệu Odoo CRM</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Passcode Quản Trị Viên</label>
              <input
                type="password"
                className="passcode-input"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-login">ĐĂNG NHẬP HỆ THỐNG</button>
            {authError && <div className="auth-error">{authError}</div>}
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Main Render
  return (
    <div className="admin-dashboard-container">
      <style jsx global>{`
        .admin-dashboard-container {
          min-height: 100vh;
          background: #050a12;
          color: #e2e8f0;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          padding: 2rem;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 1.5rem;
        }
        .admin-title-box h1 {
          font-size: 1.8rem;
          font-weight: 800;
          color: #ffc331;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .admin-title-box p {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          margin-top: 0.25rem;
        }
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        .btn-action-primary {
          background: linear-gradient(135deg, #ffc331 0%, #d49d00 100%);
          color: #050a12;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }
        .btn-action-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255,195,49,0.3);
        }
        .btn-action-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-action-secondary:hover {
          background: rgba(255,255,255,0.1);
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: rgba(13, 27, 42, 0.4);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          width: 60px;
          height: 60px;
          background: rgba(255, 195, 49, 0.03);
          border-radius: 50%;
          right: -10px;
          top: -10px;
        }
        .stat-card.revenue-card::after {
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.1);
        }
        .stat-card-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.5rem;
        }
        .stat-card-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fefeff;
        }
        .stat-card-value.yellow { color: #ffc331; }
        .stat-card-value.green { color: #10b981; }
        .stat-card-value.blue { color: #3b82f6; }
        
        /* Control Panel Filters */
        .control-panel {
          background: rgba(13, 27, 42, 0.3);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          align-items: center;
        }
        .search-input-box {
          position: relative;
        }
        .search-input {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          color: #fefeff;
          font-size: 0.85rem;
          transition: all 0.3s;
        }
        .search-input:focus {
          outline: none;
          border-color: #ffc331;
          box-shadow: 0 0 8px rgba(255,195,49,0.1);
        }
        .filter-select {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          color: #fefeff;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: #ffc331;
        }
        
        /* Table styles */
        .table-container {
          background: rgba(13, 27, 42, 0.3);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .leads-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .leads-table th {
          background: rgba(10, 54, 94, 0.25);
          color: rgba(255,255,255,0.7);
          font-weight: 700;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          white-space: nowrap;
        }
        .leads-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }
        .leads-table tr:hover {
          background: rgba(255,255,255,0.02);
        }
        .student-name {
          font-weight: 700;
          color: #fefeff;
        }
        .student-phone {
          color: rgba(255,255,255,0.6);
          font-family: monospace;
        }
        .university-tag {
          font-size: 0.75rem;
          background: rgba(59, 130, 246, 0.1);
          color: #93c5fd;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          display: inline-block;
        }
        .service-name {
          font-weight: 600;
          color: #e2e8f0;
        }
        .qty-deadline {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.45);
          margin-top: 0.25rem;
        }
        .price-estimate {
          font-weight: 700;
          color: #10b981;
        }
        
        /* Badges status */
        .status-select {
          border: none;
          background: transparent;
          color: inherit;
          font-size: inherit;
          font-weight: inherit;
          cursor: pointer;
          padding-right: 0.5rem;
        }
        .status-select:focus {
          outline: none;
        }
        .badge-status {
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .badge-status.new {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .badge-status.contacting {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .badge-status.completed {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .badge-status.cancelled {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        /* Notes section */
        .notes-cell {
          max-width: 200px;
        }
        .notes-content {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .notes-empty {
          font-style: italic;
          color: rgba(255,255,255,0.3);
          font-size: 0.75rem;
        }
        .btn-note-edit {
          background: none;
          border: none;
          color: #ffc331;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-top: 0.25rem;
          display: inline-block;
        }
        .note-edit-area {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,195,49,0.3);
          color: #fefeff;
          font-size: 0.75rem;
          padding: 0.4rem;
          border-radius: 6px;
          resize: vertical;
          min-height: 50px;
        }
        .note-edit-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .btn-note-save {
          background: #ffc331;
          color: #050a12;
          border: none;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-note-cancel {
          background: rgba(255,255,255,0.1);
          color: #e2e8f0;
          border: none;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        /* Action buttons */
        .btn-delete {
          background: none;
          border: none;
          color: rgba(239, 68, 68, 0.6);
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }
        .btn-delete:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        /* Modal Add Lead */
        .add-lead-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }
        .add-lead-modal {
          background: #0d1b2a;
          border: 1px solid rgba(255,195,49,0.2);
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffc331;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 0.75rem;
        }
        .modal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .modal-form-grid.full-width {
          grid-template-columns: 1fr;
        }
        .modal-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .modal-field.full {
          grid-column: span 2;
        }
        .modal-field label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.6);
        }
        .modal-input {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          color: #fefeff;
          font-size: 0.85rem;
        }
        .modal-input:focus {
          outline: none;
          border-color: #ffc331;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 1rem;
        }
        .price-estimate-badge {
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          font-weight: 700;
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px dashed rgba(16, 185, 129, 0.3);
          text-align: center;
          font-size: 1rem;
          margin-top: 0.25rem;
        }
        .offline-tag {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          font-size: 0.75rem;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(245, 158, 11, 0.3);
          display: inline-block;
          font-weight: 700;
        }
      `}</style>

      {/* ADMIN HEADER */}
      <header className="admin-header">
        <div className="admin-title-box">
          <h1>🎓 CRM Quản Trị Easy A</h1>
          <p>
            Mô phỏng Odoo CRM Backend — Đồng bộ Supabase PostgreSQL Database
            {isOffline && <span className="offline-tag ms-2">Offline Mode</span>}
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-action-primary"
            onClick={() => setShowAddForm(true)}
          >
            ➕ THÊM LEAD HỌC VIÊN
          </button>
          <button 
            className="btn-action-secondary"
            onClick={fetchLeads}
            title="Đồng bộ dữ liệu"
          >
            🔄 Tải Lại
          </button>
          <button 
            className="btn-action-secondary"
            onClick={handleLogout}
            style={{ color: '#ff6b6b', borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            Đăng Xuất
          </button>
        </div>
      </header>

      {/* STATISTICS ANALYTICS CARDS */}
      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">Tổng Số Lượng Leads</span>
          <span className="stat-card-value blue">{totalCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Leads Chưa Xử Lý (New)</span>
          <span className="stat-card-value yellow">{newCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Đang Tư Vấn Zalo/Call</span>
          <span className="stat-card-value" style={{ color: '#fbbf24' }}>{contactingCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Đã Chốt Hợp Đồng</span>
          <span className="stat-card-value green">{completedCount}</span>
        </div>
        <div className="stat-card revenue-card">
          <span className="stat-card-title">Tổng Dự Toán Doanh Thu</span>
          <span className="stat-card-value green">{formatVND(estimatedRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-title">Tỷ Lệ Chốt Thành Công</span>
          <span className="stat-card-value" style={{ color: '#a855f7' }}>{conversionRate}%</span>
        </div>
      </section>

      {/* FILTER & CONTROL PANEL */}
      <section className="control-panel">
        <div className="search-input-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔎 Tìm học viên, SĐT, trường học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="filter-select"
            style={{ width: '100%' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">📁 Tất cả trạng thái</option>
            <option value="new">🔵 Mới (Chưa xử lý)</option>
            <option value="contacting">🟡 Đang tư vấn</option>
            <option value="completed">🟢 Đã chốt đơn</option>
            <option value="cancelled">🔴 Đã hủy</option>
          </select>
        </div>
        <div>
          <select
            className="filter-select"
            style={{ width: '100%' }}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="all">🛠️ Tất cả Dịch Vụ</option>
            {SERVICES.map(s => (
              <option key={s.value} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* MAIN LEADS DATABASE TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ffc331' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>Đang truy vấn cơ sở dữ liệu PostgreSQL...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ff6b6b' }}>
          <p style={{ fontWeight: 700 }}>⚠️ {error}</p>
          <button className="btn-action-secondary mt-3" onClick={fetchLeads}>Thử lại</button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(13,27,42,0.2)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>Không tìm thấy Lead học viên nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="leads-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>ID</th>
                <th>Học Viên / Liên Hệ</th>
                <th>Trường Đại Học</th>
                <th>Dịch Vụ Chi Tiết</th>
                <th>Phí Dự Kiến</th>
                <th>Trạng Thái CRM</th>
                <th>Ghi Chú Quản Trị (Odoo Style)</th>
                <th style={{ width: '50px' }}>Tác Vụ</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((l) => (
                <tr key={l.id}>
                  {/* ID */}
                  <td style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>#{l.id}</td>
                  
                  {/* Contact Info */}
                  <td>
                    <div className="student-name">{l.name}</div>
                    <div className="student-phone">{l.phone}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.15rem' }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                    </div>
                  </td>
                  
                  {/* University */}
                  <td>
                    <span className="university-tag">{l.university || 'Chưa cung cấp'}</span>
                  </td>
                  
                  {/* Service details */}
                  <td>
                    <div className="service-name">{l.service}</div>
                    <div className="qty-deadline">
                      {l.qty} • {l.level} • {l.deadline}
                    </div>
                  </td>
                  
                  {/* Price */}
                  <td>
                    <span className="price-estimate">{l.price_estimate}</span>
                  </td>
                  
                  {/* Status Dropdown */}
                  <td>
                    <span className={`badge-status ${l.status || 'new'}`}>
                      <select 
                        value={l.status || 'new'} 
                        onChange={(e) => handleStatusChange(l.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="new">🔵 Chưa xử lý</option>
                        <option value="contacting">🟡 Đang tư vấn</option>
                        <option value="completed">🟢 Đã chốt đơn</option>
                        <option value="cancelled">🔴 Đã hủy</option>
                      </select>
                    </span>
                  </td>
                  
                  {/* Admin Notes */}
                  <td className="notes-cell">
                    {editingNoteId === l.id ? (
                      <div>
                        <textarea
                          className="note-edit-area"
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          placeholder="Nhập ghi chú chi tiết..."
                        />
                        <div className="note-edit-actions">
                          <button className="btn-note-save" onClick={() => handleNoteSave(l.id)}>Lưu</button>
                          <button className="btn-note-cancel" onClick={() => setEditingNoteId(null)}>Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {l.admin_notes ? (
                          <p className="notes-content" title={l.admin_notes}>{l.admin_notes}</p>
                        ) : (
                          <span className="notes-empty">Không có ghi chú.</span>
                        )}
                        <div>
                          <button 
                            className="btn-note-edit"
                            onClick={() => {
                              setEditingNoteId(l.id);
                              setEditingNoteText(l.admin_notes || '');
                            }}
                          >
                            📝 Sửa ghi chú
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteLead(l.id)}
                      title="Xóa Lead"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* POPUP MODAL: ADD LEAD MANUALLY */}
      {showAddForm && (
        <div className="add-lead-modal-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="add-lead-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">➕ Tạo Lead Mới Thủ Công (CRM)</div>
            
            <form onSubmit={handleManualSubmit}>
              <div className="modal-form-grid">
                {/* Name */}
                <div className="modal-field">
                  <label>Họ &amp; Tên Học Viên</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="modal-field">
                  <label>Số Điện Thoại / Zalo</label>
                  <input
                    type="tel"
                    className="modal-input"
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="Ví dụ: 0987654321"
                    required
                  />
                </div>

                {/* University */}
                <div className="modal-field full">
                  <label>Trường Đại Học</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={newLeadUni}
                    onChange={(e) => setNewLeadUni(e.target.value)}
                    placeholder="Ví dụ: Đại học Ngoại Thương (FTU)"
                  />
                </div>

                {/* Service */}
                <div className="modal-field">
                  <label>Dịch Vụ Đăng Ký</label>
                  <select
                    className="modal-input"
                    value={newLeadService}
                    onChange={(e) => setNewLeadService(e.target.value)}
                  >
                    {SERVICES.map(s => (
                      <option key={s.value} value={s.value}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div className="modal-field">
                  <label>Cấp Độ</label>
                  <select
                    className="modal-input"
                    value={newLeadLevel}
                    onChange={(e) => setNewLeadLevel(e.target.value)}
                  >
                    {LEVELS.map(l => (
                      <option key={l.value} value={l.value}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="modal-field">
                  <label>Khối Lượng ({SERVICES.find(s => s.value === newLeadService)?.unit || 'Đề tài'})</label>
                  <input
                    type="number"
                    className="modal-input"
                    value={newLeadQty}
                    onChange={(e) => setNewLeadQty(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    required
                  />
                </div>

                {/* Deadline */}
                <div className="modal-field">
                  <label>Thời Hạn</label>
                  <select
                    className="modal-input"
                    value={newLeadDeadline}
                    onChange={(e) => setNewLeadDeadline(e.target.value)}
                  >
                    {DEADLINES.map(d => (
                      <option key={d.value} value={d.value}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div className="modal-field">
                  <label>Trạng Thái Ban Đầu</label>
                  <select
                    className="modal-input"
                    value={newLeadStatus}
                    onChange={(e) => setNewLeadStatus(e.target.value)}
                  >
                    <option value="new">🔵 Chưa xử lý</option>
                    <option value="contacting">🟡 Đang tư vấn</option>
                    <option value="completed">🟢 Đã chốt đơn</option>
                    <option value="cancelled">🔴 Đã hủy</option>
                  </select>
                </div>

                {/* Fee Estimate */}
                <div className="modal-field">
                  <label>Phí Dự Kiến (Hệ Thống Tự Tính)</label>
                  <div className="price-estimate-badge">
                    {calculateEstimate()}
                  </div>
                </div>

                {/* Notes */}
                <div className="modal-field full">
                  <label>Ghi Chú Quản Trị</label>
                  <textarea
                    className="modal-input"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    value={newLeadNotes}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                    placeholder="Nhập các chi tiết liên lạc, ghi chú thỏa thuận hoặc lưu ý riêng..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  disabled={formIsSubmitting}
                >
                  {formIsSubmitting ? 'Đang Lưu...' : 'LƯU LEAD HỌC VIÊN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
