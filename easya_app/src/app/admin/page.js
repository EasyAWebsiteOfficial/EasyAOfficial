'use client';

// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';

// Service configurations matching homepage pricing rules exactly
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

// Odoo stages configuration
const ODOO_STAGES = [
  { key: 'new', name: 'Mới (New)', color: '#2563eb' },
  { key: 'contacting', name: 'Đang tư vấn (Contacting)', color: '#eab308' },
  { key: 'completed', name: 'Đã chốt (Won)', color: '#16a34a' },
  { key: 'cancelled', name: 'Đã hủy (Lost)', color: '#dc2626' }
];

export default function EasyAOdooAdminDashboard() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // CRM Layout view toggler: 'kanban' or 'list' (Odoo default is kanban)
  const [currentView, setCurrentView] = useState('kanban');

  // Leads and system state
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Manual Lead creation form popup
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

  // Lead inline note editing states
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Check login session storage
  useEffect(() => {
    const savedAuth = localStorage.getItem('easya_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchLeads();
    }
  }, []);

  // Fetch all leads from the backend PostgreSQL serverless API
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
        setError(data.error || 'Lỗi tải danh sách leads.');
      }
    } catch (e) {
      console.error(e);
      setError('Lỗi kết nối đến máy chủ API.');
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === '0901374245' || passcode === 'easya2026') {
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('easya_admin_auth', 'true');
      fetchLeads();
    } else {
      setAuthError('Mã passcode bảo mật không chính xác!');
    }
  };

  // Sign out handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    localStorage.removeItem('easya_admin_auth');
  };

  // Helpers to parse currency estimates for computations
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

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

  // Inline patch request to shift lead status instantly (dragging cards simulation)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      } else {
        alert('Lỗi cập nhật: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Lỗi mạng khi cập nhật trạng thái.');
    }
  };

  // Inline note saving
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
        alert('Lỗi cập nhật ghi chú: ' + (data.error || ''));
      }
    } catch (e) {
      alert('Lỗi kết nối mạng.');
    }
  };

  // Lead deletions
  const handleDeleteLead = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lead này khỏi Odoo CRM? Thao tác không thể khôi phục.')) return;
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setLeads(leads.filter(l => l.id !== id));
      } else {
        alert('Xóa lead thất bại.');
      }
    } catch (e) {
      alert('Lỗi kết nối mạng khi xóa.');
    }
  };

  // Lead creation handler
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) {
      alert('Vui lòng điền họ tên học viên và số điện thoại!');
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
      qty: `${newLeadQty} ${selectedService?.unit || 'Mẫu'}`,
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
        alert('Đã tạo cơ hội kinh doanh mới!');
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadUni('');
        setNewLeadNotes('');
        setNewLeadQty(1);
        setShowAddForm(false);
        fetchLeads(); // Refresh database rows
      } else {
        alert('Lỗi thêm: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Lỗi mạng khi lưu dữ liệu.');
    } finally {
      setFormIsSubmitting(false);
    }
  };

  // Perform search and filter
  const filteredLeads = leads.filter(l => {
    const matchSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      (l.university && l.university.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchService = serviceFilter === 'all' || (l.service && l.service.includes(serviceFilter));

    return matchSearch && matchService;
  });

  // Calculate sum of prices for each column (stage) to show in Odoo column headers
  const getStageTotalRevenue = (stageKey) => {
    return filteredLeads
      .filter(l => (l.status || 'new') === stageKey)
      .reduce((sum, l) => sum + parsePrice(l.price_estimate), 0);
  };

  const getStageCount = (stageKey) => {
    return filteredLeads.filter(l => (l.status || 'new') === stageKey).length;
  };

  // Login Page Render (Odoo style login)
  if (!isAuthenticated) {
    return (
      <div className="odoo-login-container">
        <style jsx global>{`
          .odoo-login-container {
            min-height: 100vh;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding: 1.5rem;
          }
          .odoo-login-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 2.5rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            text-align: center;
          }
          .odoo-logo-brand {
            font-size: 2.5rem;
            font-weight: 800;
            color: #714B67;
            margin-bottom: 0.5rem;
            letter-spacing: -1px;
          }
          .odoo-logo-brand span {
            color: #00A09D;
          }
          .odoo-login-card h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #495057;
            margin-bottom: 2rem;
          }
          .odoo-form-group {
            margin-bottom: 1.5rem;
            text-align: left;
          }
          .odoo-form-group label {
            display: block;
            font-size: 0.85rem;
            font-weight: 600;
            color: #6c757d;
            margin-bottom: 0.5rem;
          }
          .odoo-input {
            width: 100%;
            padding: 0.65rem 0.85rem;
            background: #ffffff;
            border: 1px solid #ced4da;
            border-radius: 4px;
            color: #495057;
            font-size: 0.95rem;
            transition: border-color 0.25s, box-shadow 0.25s;
          }
          .odoo-input:focus {
            outline: none;
            border-color: #714B67;
            box-shadow: 0 0 0 3px rgba(113, 75, 103, 0.15);
          }
          .btn-odoo-primary {
            width: 100%;
            padding: 0.7rem;
            background: #714B67;
            border: none;
            border-radius: 4px;
            color: #ffffff;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: background 0.25s;
          }
          .btn-odoo-primary:hover {
            background: #5c3b53;
          }
          .odoo-error {
            color: #dc3545;
            font-size: 0.85rem;
            margin-top: 1rem;
            font-weight: 600;
          }
        `}</style>
        <div className="odoo-login-card">
          <div className="odoo-logo-brand">odoo<span>.crm</span></div>
          <h3>Easy A Administration</h3>
          <form onSubmit={handleLogin}>
            <div className="odoo-form-group">
              <label>Mã bảo mật Passcode</label>
              <input
                type="password"
                className="odoo-input"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Nhập passcode quản trị"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-odoo-primary">ĐĂNG NHẬP (LOG IN)</button>
            {authError && <div className="odoo-error">⚠️ {authError}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="odoo-crm-viewport">
      {/* GLOBAL ODOO CRM STYLE ACCENTS */}
      <style jsx global>{`
        .odoo-crm-viewport {
          min-height: 100vh;
          background: #f8f9fa;
          color: #212529;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          display: flex;
          flex-direction: column;
          font-size: 13px;
        }

        /* 1. Top navigation header */
        .odoo-top-nav {
          height: 46px;
          background: #714b67;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1rem;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .nav-left-branding {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-waffle-menu {
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.85;
        }
        .nav-app-name {
          font-weight: 700;
          font-size: 14px;
        }
        .nav-app-menu-links {
          display: flex;
          gap: 15px;
          list-style: none;
          font-size: 13px;
          margin-left: 20px;
        }
        .nav-app-menu-links li {
          opacity: 0.8;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 3px;
        }
        .nav-app-menu-links li.active {
          opacity: 1;
          font-weight: 600;
          background: rgba(255,255,255,0.1);
        }
        .nav-right-user {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 13px;
        }
        .database-indicator {
          background: rgba(0,0,0,0.25);
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        /* 2. Control panel & breadcrumbs */
        .odoo-control-panel {
          background: #ffffff;
          border-bottom: 1px solid #dee2e6;
          padding: 10px 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .control-row-1 {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .breadcrumb-box {
          font-size: 18px;
          color: #495057;
        }
        .breadcrumb-root {
          color: #714b67;
          font-weight: 700;
          cursor: pointer;
        }
        .breadcrumb-separator {
          margin: 0 8px;
          color: #adb5bd;
        }
        .breadcrumb-active {
          color: #212529;
          font-weight: 500;
        }
        .search-and-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 320px;
        }
        .odoo-search-bar {
          width: 100%;
          border: 1px solid #ced4da;
          border-radius: 4px;
          padding: 5px 10px;
          font-size: 13px;
          background: #fdfdfd;
        }
        .odoo-search-bar:focus {
          outline: none;
          border-color: #714b67;
        }
        .control-row-2 {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .action-buttons-group {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-odoo-create {
          background: #00A09D;
          color: #ffffff;
          border: 1px solid #00A09D;
          font-weight: 600;
          padding: 5px 14px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
        }
        .btn-odoo-create:hover {
          background: #00878A;
        }
        .btn-odoo-secondary {
          background: #ffffff;
          color: #495057;
          border: 1px solid #ced4da;
          padding: 5px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }
        .btn-odoo-secondary:hover {
          background: #f8f9fa;
          border-color: #b5b5b5;
        }
        .view-switcher-group {
          display: flex;
          background: #ffffff;
          border: 1px solid #ced4da;
          border-radius: 4px;
          overflow: hidden;
        }
        .btn-view-toggle {
          background: none;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #495057;
          font-size: 14px;
        }
        .btn-view-toggle.active {
          background: #e9ecef;
          color: #714b67;
          font-weight: 700;
        }
        .btn-view-toggle:not(:last-child) {
          border-right: 1px solid #ced4da;
        }

        /* 3. Main Workspace Container */
        .odoo-workspace {
          flex: 1;
          padding: 15px;
          overflow-y: auto;
        }

        /* 4. Kanban Pipeline View */
        .odoo-kanban-pipeline {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          align-items: start;
          min-height: 500px;
        }
        .kanban-column {
          background: #eff1f5;
          border-radius: 6px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid #e2e5ec;
        }
        .kanban-column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(113, 75, 103, 0.2);
          margin-bottom: 5px;
        }
        .column-title {
          font-weight: 700;
          font-size: 13px;
          color: #3e3f42;
        }
        .column-meta-info {
          font-size: 11px;
          font-weight: 700;
          color: #714b67;
          background: rgba(113, 75, 103, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          text-align: right;
        }
        .kanban-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 400px;
        }
        .kanban-card {
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .kanban-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.08);
          border-color: #714b67;
        }
        .card-student-name {
          font-weight: 700;
          color: #212529;
          font-size: 13px;
        }
        .card-uni-text {
          font-size: 11px;
          color: #714b67;
          font-weight: 600;
        }
        .card-service-tag {
          font-size: 11px;
          color: #495057;
          font-weight: 500;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-block;
          margin-top: 2px;
        }
        .card-details-row {
          font-size: 11px;
          color: #6c757d;
          margin-top: 2px;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          border-top: 1px dashed #e9ecef;
          padding-top: 6px;
        }
        .card-price {
          font-weight: 800;
          color: #00A09D;
          font-size: 13px;
        }
        .card-actions-quick {
          display: flex;
          gap: 4px;
        }
        .btn-card-quick {
          background: #f8f9fa;
          border: 1px solid #ced4da;
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 10px;
          cursor: pointer;
        }
        .btn-card-quick:hover {
          background: #e9ecef;
          color: #714b67;
        }
        .initials-avatar {
          width: 18px;
          height: 18px;
          background: #714b67;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
        }
        
        /* 5. List View Table styles */
        .odoo-list-container {
          background: #ffffff;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .odoo-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .odoo-table th {
          background: #f8f9fa;
          color: #495057;
          font-weight: 700;
          padding: 8px 12px;
          border-bottom: 2px solid #dee2e6;
          font-size: 12px;
          white-space: nowrap;
        }
        .odoo-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e9ecef;
          color: #212529;
          vertical-align: middle;
        }
        .odoo-table tr:hover {
          background: #f1f3f5;
        }
        .list-price {
          font-weight: 700;
          color: #00A09D;
        }
        .list-badge-status {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .list-badge-status.new { background: #e0f2fe; color: #0369a1; }
        .list-badge-status.contacting { background: #fef3c7; color: #b45309; }
        .list-badge-status.completed { background: #dcfce7; color: #15803d; }
        .list-badge-status.cancelled { background: #fee2e2; color: #b91c1c; }
        
        .list-status-select {
          border: none;
          background: transparent;
          font-weight: 700;
          color: inherit;
          cursor: pointer;
          outline: none;
        }

        /* 6. Admin Form Popups */
        .odoo-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1.5rem;
        }
        .odoo-modal {
          background: #ffffff;
          border-radius: 6px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #714b67;
        }
        .odoo-modal-header {
          background: #f8f9fa;
          padding: 12px 15px;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .odoo-modal-title {
          font-size: 15px;
          font-weight: 700;
          color: #714b67;
        }
        .btn-modal-close {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #6c757d;
        }
        .odoo-modal-body {
          padding: 20px;
        }
        .odoo-form-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .odoo-form-col-full {
          grid-column: span 2;
        }
        .odoo-label-static {
          font-weight: 700;
          font-size: 12px;
          color: #495057;
          margin-bottom: 4px;
          display: block;
        }
        .odoo-form-estimate {
          background: #eef9f9;
          border: 1px dashed #00A09D;
          color: #00A09D;
          font-weight: 800;
          font-size: 15px;
          padding: 8px;
          text-align: center;
          border-radius: 4px;
          margin-top: 4px;
        }
        .odoo-modal-footer {
          padding: 12px 15px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        /* 7. Inline Note styling */
        .inline-note-section {
          background: #fff9db;
          border: 1px solid #ffe3e3;
          padding: 4px;
          border-radius: 3px;
          font-size: 11px;
          margin-top: 3px;
        }
        .notes-edit-btn {
          border: none;
          background: none;
          color: #714b67;
          font-size: 10px;
          cursor: pointer;
          text-decoration: underline;
        }
        .notes-list-cell {
          max-width: 180px;
          font-size: 11px;
        }
        .btn-table-del {
          color: #dc3545;
          background: none;
          border: none;
          cursor: pointer;
        }
        .btn-table-del:hover {
          text-decoration: underline;
        }
      `}</style>

      {/* ODOO TOP NAVIGATION BAR */}
      <nav className="odoo-top-nav">
        <div className="nav-left-branding">
          <span className="nav-waffle-menu">☰</span>
          <span className="nav-app-name">EasyA CRM</span>
          <ul className="nav-app-menu-links">
            <li className="active">Đường ống (Pipeline)</li>
            <li onClick={() => setShowAddForm(true)}>Tạo nhanh</li>
            <li onClick={fetchLeads}>Đồng bộ</li>
          </ul>
        </div>
        <div className="nav-right-user">
          <span className="database-indicator">db: EasyAOfficial</span>
          <span>kaitokidthomas.com@gmail.com</span>
          <span onClick={handleLogout} style={{ cursor: 'pointer', textDecoration: 'underline', color: '#ffb3c1' }}>Đăng xuất</span>
        </div>
      </nav>

      {/* ODOO SUB-HEADER / CONTROL PANEL */}
      <div className="odoo-control-panel">
        <div className="control-row-1">
          <div className="breadcrumb-box">
            <span className="breadcrumb-root">CRM</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-active">Đường ống của tôi (My Pipeline)</span>
            {isOffline && <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '10px' }}>Offline Mode</span>}
          </div>
          <div className="search-and-filters">
            <input
              type="text"
              className="odoo-search-bar"
              placeholder="🔍 Tìm theo tên, SĐT, trường..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="control-row-2">
          <div className="action-buttons-group">
            <button className="btn-odoo-create" onClick={() => setShowAddForm(true)}>TẠO MỚI</button>
            <button className="btn-odoo-secondary" onClick={fetchLeads}>🔄 TẢI LẠI DỮ LIỆU</button>
            <div>
              <select
                className="btn-odoo-secondary"
                style={{ fontSize: '12px', padding: '4px 8px' }}
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <option value="all">🔍 Tất cả dịch vụ</option>
                {SERVICES.map(s => (
                  <option key={s.value} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="view-switcher-group">
            <button 
              className={`btn-view-toggle ${currentView === 'kanban' ? 'active' : ''}`}
              onClick={() => setCurrentView('kanban')}
              title="Xem Kanban (Đường ống Odoo)"
            >
              📊 Kanban
            </button>
            <button 
              className={`btn-view-toggle ${currentView === 'list' ? 'active' : ''}`}
              onClick={() => setCurrentView('list')}
              title="Xem Danh sách (Bảng tính Odoo)"
            >
              ☰ Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="odoo-workspace">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#714b67' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>⌛ Đang tải dữ liệu Odoo CRM...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#dc3545' }}>
            <h4>⚠️ Lỗi đồng bộ: {error}</h4>
            <button className="btn-odoo-create mt-2" onClick={fetchLeads}>Thử kết nối lại</button>
          </div>
        ) : (
          <>
            {/* VIEW 1: AUTHENTIC ODOO KANBAN VIEW */}
            {currentView === 'kanban' && (
              <div className="odoo-kanban-pipeline">
                {ODOO_STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter(l => (l.status || 'new') === stage.key);
                  const stageRevenue = getStageTotalRevenue(stage.key);
                  const stageCount = getStageCount(stage.key);

                  return (
                    <div className="kanban-column" key={stage.key}>
                      <div className="kanban-column-header">
                        <span className="column-title">{stage.name} ({stageCount})</span>
                        <span className="column-meta-info">{formatVND(stageRevenue)}</span>
                      </div>

                      <div className="kanban-cards-stack">
                        {stageLeads.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#adb5bd', border: '1px dashed #dee2e6', borderRadius: '4px', background: '#ffffff', fontSize: '11px' }}>
                            Kéo thả hoặc chuyển thẻ về đây
                          </div>
                        ) : (
                          stageLeads.map((l) => (
                            <div className="kanban-card" key={l.id}>
                              <div className="card-student-name">{l.name}</div>
                              <div className="card-uni-text">🎓 {l.university || 'Đại học'}</div>
                              
                              <div>
                                <span className="card-service-tag">{l.service}</span>
                              </div>
                              
                              <div className="card-details-row">
                                📞 <span style={{ fontFamily: 'monospace' }}>{l.phone}</span><br />
                                ⏱️ {l.qty} • {l.deadline}
                              </div>

                              {/* Ghi chú inline */}
                              {l.admin_notes ? (
                                <div className="inline-note-section">
                                  <strong>Notes:</strong> {l.admin_notes}
                                </div>
                              ) : null}

                              <div className="card-footer">
                                <span className="card-price">{l.price_estimate}</span>
                                
                                <div className="card-actions-quick">
                                  {stage.key !== 'new' && (
                                    <button 
                                      className="btn-card-quick" 
                                      onClick={() => {
                                        const currentIndex = ODOO_STAGES.findIndex(s => s.key === stage.key);
                                        handleStatusChange(l.id, ODOO_STAGES[currentIndex - 1].key);
                                      }}
                                      title="Chuyển sang cột trước"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  
                                  <button 
                                    className="btn-card-quick"
                                    onClick={() => {
                                      setEditingNoteId(l.id);
                                      setEditingNoteText(l.admin_notes || '');
                                    }}
                                    title="Sửa ghi chú"
                                  >
                                    📝
                                  </button>

                                  <button
                                    className="btn-card-quick"
                                    onClick={() => handleDeleteLead(l.id)}
                                    title="Xóa Lead"
                                    style={{ color: '#dc3545' }}
                                  >
                                    🗑️
                                  </button>

                                  {stage.key !== 'cancelled' && (
                                    <button 
                                      className="btn-card-quick"
                                      onClick={() => {
                                        const currentIndex = ODOO_STAGES.findIndex(s => s.key === stage.key);
                                        handleStatusChange(l.id, ODOO_STAGES[currentIndex + 1].key);
                                      }}
                                      title="Chuyển sang cột sau"
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW 2: AUTHENTIC ODOO LIST (TREE) VIEW */}
            {currentView === 'list' && (
              <div className="odoo-list-container">
                <table className="odoo-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>ID</th>
                      <th>Cơ hội/Tên Học Viên</th>
                      <th>Điện Thoại / Zalo</th>
                      <th>Trường Đại Học</th>
                      <th>Dịch Vụ Đăng Ký</th>
                      <th>Khối Lượng</th>
                      <th>Hạn Nộp</th>
                      <th>Cấp Học</th>
                      <th>Phí Dự Kiến</th>
                      <th>Giai Đoạn (Trạng Thái)</th>
                      <th>Ghi chú</th>
                      <th style={{ width: '40px' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((l) => (
                      <tr key={l.id}>
                        <td style={{ color: '#6c757d', fontWeight: 600 }}>#{l.id}</td>
                        <td style={{ fontWeight: 'bold' }}>{l.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{l.phone}</td>
                        <td>{l.university || 'N/A'}</td>
                        <td style={{ fontWeight: 600 }}>{l.service}</td>
                        <td>{l.qty}</td>
                        <td>{l.deadline}</td>
                        <td>{l.level}</td>
                        <td className="list-price">{l.price_estimate}</td>
                        <td>
                          <span className={`list-badge-status ${l.status || 'new'}`}>
                            <select
                              value={l.status || 'new'}
                              onChange={(e) => handleStatusChange(l.id, e.target.value)}
                              className="list-status-select"
                            >
                              <option value="new">MỚI (NEW)</option>
                              <option value="contacting">ĐANG TƯ VẤN</option>
                              <option value="completed">ĐÃ CHỐT (WON)</option>
                              <option value="cancelled">ĐÃ HỦY (LOST)</option>
                            </select>
                          </span>
                        </td>
                        <td className="notes-list-cell">
                          {editingNoteId === l.id ? (
                            <div>
                              <textarea
                                className="note-edit-area"
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                              />
                              <div className="note-edit-actions">
                                <button className="btn-note-save" onClick={() => handleNoteSave(l.id)}>Lưu</button>
                                <button className="btn-note-cancel" onClick={() => setEditingNoteId(null)}>Hủy</button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span>{l.admin_notes || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Không có</span>}</span>
                              <button className="notes-edit-btn ms-2" onClick={() => {
                                setEditingNoteId(l.id);
                                setEditingNoteText(l.admin_notes || '');
                              }}>Sửa</button>
                            </div>
                          )}
                        </td>
                        <td>
                          <button className="btn-table-del" onClick={() => handleDeleteLead(l.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* POPUP MODAL: ODOO STYLE LEAD FORM */}
      {showAddForm && (
        <div className="odoo-modal-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="odoo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="odoo-modal-header">
              <span className="odoo-modal-title">Tạo mới: Đường ống cơ hội Easy A</span>
              <button className="btn-modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <form onSubmit={handleManualSubmit}>
              <div className="odoo-modal-body">
                <div className="odoo-form-layout">
                  {/* Name */}
                  <div>
                    <label className="odoo-label-static">Tên học viên (Lead Name)</label>
                    <input
                      type="text"
                      className="odoo-input"
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Thị Hoa"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="odoo-label-static">Số điện thoại / Zalo</label>
                    <input
                      type="tel"
                      className="odoo-input"
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      required
                    />
                  </div>

                  {/* University */}
                  <div className="odoo-form-col-full">
                    <label className="odoo-label-static">Trường đại học</label>
                    <input
                      type="text"
                      className="odoo-input"
                      value={newLeadUni}
                      onChange={(e) => setNewLeadUni(e.target.value)}
                      placeholder="Ví dụ: Đại học Quốc gia Hà Nội"
                    />
                  </div>

                  {/* Service */}
                  <div>
                    <label className="odoo-label-static">Dịch vụ yêu cầu</label>
                    <select
                      className="odoo-input"
                      value={newLeadService}
                      onChange={(e) => setNewLeadService(e.target.value)}
                    >
                      {SERVICES.map(s => (
                        <option key={s.value} value={s.value}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Level */}
                  <div>
                    <label className="odoo-label-static">Cấp học đào tạo</label>
                    <select
                      className="odoo-input"
                      value={newLeadLevel}
                      onChange={(e) => setNewLeadLevel(e.target.value)}
                    >
                      {LEVELS.map(l => (
                        <option key={l.value} value={l.value}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="odoo-label-static">Khối lượng ({SERVICES.find(s => s.value === newLeadService)?.unit || 'Đơn vị'})</label>
                    <input
                      type="number"
                      className="odoo-input"
                      value={newLeadQty}
                      onChange={(e) => setNewLeadQty(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      required
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="odoo-label-static">Hạn hoàn thành</label>
                    <select
                      className="odoo-input"
                      value={newLeadDeadline}
                      onChange={(e) => setNewLeadDeadline(e.target.value)}
                    >
                      {DEADLINES.map(d => (
                        <option key={d.value} value={d.value}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="odoo-label-static">Trạng thái (Giai đoạn)</label>
                    <select
                      className="odoo-input"
                      value={newLeadStatus}
                      onChange={(e) => setNewLeadStatus(e.target.value)}
                    >
                      <option value="new">🔵 Mới (New)</option>
                      <option value="contacting">🟡 Đang tư vấn (Contacting)</option>
                      <option value="completed">🟢 Đã chốt (Won)</option>
                      <option value="cancelled">🔴 Đã hủy (Lost)</option>
                    </select>
                  </div>

                  {/* Estimate Display */}
                  <div>
                    <label className="odoo-label-static">Dự kiến chi phí (Odoo Engine)</label>
                    <div className="odoo-form-estimate">
                      {calculateEstimate()}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="odoo-form-col-full">
                    <label className="odoo-label-static">Ghi chú quản trị bổ sung</label>
                    <textarea
                      className="odoo-input"
                      style={{ minHeight: '60px', resize: 'vertical' }}
                      value={newLeadNotes}
                      onChange={(e) => setNewLeadNotes(e.target.value)}
                      placeholder="Lưu các thông tin trao đổi, yêu cầu riêng từ học viên..."
                    />
                  </div>
                </div>
              </div>

              <div className="odoo-modal-footer">
                <button
                  type="button"
                  className="btn-odoo-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  ĐÓNG
                </button>
                <button
                  type="submit"
                  className="btn-odoo-primary"
                  style={{ background: '#00A09D' }}
                  disabled={formIsSubmitting}
                >
                  {formIsSubmitting ? 'ĐANG LƯU...' : 'LƯU VÀ ĐÓNG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
