import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  Home,
  Lock,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const ALL_APPLICATION_TABS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/old-inventory', label: 'Old Inventory', icon: '📦' },
  { path: '/old-in-hand', label: 'Old In-hand Inventory', icon: '📱' },
  { path: '/repair-stock', label: 'Repair Inventory', icon: '🔧' },
  { path: '/rejected-stocks', label: 'Rejected Inventory', icon: '🗑️' },
  { path: '/booked-exchange', label: 'Exchange', icon: '🔄' },
  { path: '/booked', label: 'Booked', icon: '🔖' },
  { path: '/new-in-hand', label: 'New In-hand Inventory', icon: '🛍️' },
  { path: '/pending-payments', label: 'Pending & Receiving Payments', icon: '💳' },
  { path: '/profit-expense-statistic', label: 'Profit, Expense & Statistics', icon: '📈' },
  { path: '/reports', label: 'Report', icon: '📑' }
];

const INITIAL_MEMBERS = [
  { id: '1', name: 'Jeet Patel', username: 'Jeet@1', email: 'jeet@mrxchange.com', phone: '+91 98765 43210', role: 'SUPERADMIN', status: 'ACTIVE', joinedDate: '2025-01-10', avatar: 'JP', allowedTabs: ['*'] },
  { id: '2', name: 'Sonal Sharma', username: 'Sonal@1', email: 'sonal@mrxchange.com', phone: '+91 98765 12345', role: 'SUPERADMIN', status: 'ACTIVE', joinedDate: '2025-03-15', avatar: 'SS', allowedTabs: ['*'] },
  { id: '3', name: 'Rohit Kumar', username: 'Rohit@1', email: 'rohit@mrxchange.com', phone: '+91 98123 45678', role: 'STAFF', status: 'ACTIVE', joinedDate: '2025-05-20', avatar: 'RK', allowedTabs: ['/dashboard', '/old-inventory', '/old-in-hand', '/booked-exchange'] },
  { id: '4', name: 'Neha Gupta', username: 'Neha@1', email: 'neha@mrxchange.com', phone: '+91 97890 12345', role: 'STAFF', status: 'ACTIVE', joinedDate: '2025-06-01', avatar: 'NG', allowedTabs: ['/dashboard', '/booked-exchange', '/new-in-hand'] },
  { id: '5', name: 'Aman Verma', username: 'Aman@1', email: 'aman@mrxchange.com', phone: '+91 96543 21098', role: 'STAFF', status: 'INACTIVE', joinedDate: '2025-07-12', avatar: 'AV', allowedTabs: ['/dashboard', '/repair-stock'] }
];

export default function MembersSuperAdmin() {
  const { globalSearch } = useOutletContext() || {};
  const [members, setMembers] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mrx_team_members') || '[]');
      return stored.length > 0 ? stored : INITIAL_MEMBERS;
    } catch (e) {
      return INITIAL_MEMBERS;
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // 2-Step Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Info & Credentials, 2: Tab Permissions
  const [editingMember, setEditingMember] = useState(null);

  const [memberForm, setMemberForm] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    role: 'STAFF',
    status: 'ACTIVE',
    allowedTabs: ['/dashboard', '/old-inventory', '/old-in-hand', '/booked-exchange']
  });

  useEffect(() => {
    localStorage.setItem('mrx_team_members', JSON.stringify(members));
  }, [members]);

  const filteredMembers = members.filter(m => {
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    const q = (searchTerm || globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchName = m.name.toLowerCase().includes(q);
      const matchUsername = (m.username || '').toLowerCase().includes(q);
      const matchPhone = (m.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchUsername && !matchPhone) return false;
    }
    return true;
  });

  const totalMembers = members.length;
  const superAdminCount = members.filter(m => m.role === 'SUPERADMIN').length;
  const staffCount = members.filter(m => m.role === 'STAFF').length;

  const openAddModal = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      username: '',
      password: '',
      phone: '',
      role: 'STAFF',
      status: 'ACTIVE',
      allowedTabs: ['/dashboard', '/old-inventory', '/old-in-hand', '/booked-exchange']
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      username: member.username || member.name.replace(/\s+/g, '') + '@1',
      password: member.password || 'password123',
      phone: member.phone || '',
      role: member.role,
      status: member.status,
      allowedTabs: member.allowedTabs || ['/dashboard']
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleStep1Confirmation = (e) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.username || !memberForm.password) {
      alert('Please fill in Name, Username, and Password.');
      return;
    }
    // Proceed to Step 2: Grant Tab Access
    setModalStep(2);
  };

  const toggleTabPermission = (path) => {
    setMemberForm(prev => {
      const current = prev.allowedTabs || [];
      if (current.includes(path)) {
        return { ...prev, allowedTabs: current.filter(p => p !== path) };
      } else {
        return { ...prev, allowedTabs: [...current, path] };
      }
    });
  };

  const selectAllTabs = () => {
    setMemberForm(prev => ({
      ...prev,
      allowedTabs: ALL_APPLICATION_TABS.map(t => t.path)
    }));
  };

  const clearAllTabs = () => {
    setMemberForm(prev => ({
      ...prev,
      allowedTabs: ['/dashboard']
    }));
  };

  const handleFinalSave = () => {
    const isSuper = memberForm.role === 'SUPERADMIN';
    const finalTabs = isSuper ? ['*'] : memberForm.allowedTabs;

    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? {
        ...m,
        name: memberForm.name,
        username: memberForm.username,
        password: memberForm.password,
        phone: memberForm.phone,
        role: memberForm.role,
        status: memberForm.status,
        allowedTabs: finalTabs
      } : m));
      alert(`Member "${memberForm.name}" updated successfully with ${isSuper ? 'Full Access' : finalTabs.length + ' allowed tabs'}!`);
    } else {
      const initials = memberForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MB';
      const newMember = {
        id: String(Date.now()),
        name: memberForm.name,
        username: memberForm.username,
        password: memberForm.password,
        email: `${memberForm.username.toLowerCase()}@mrxchange.com`,
        phone: memberForm.phone || '+91 98765 00000',
        role: memberForm.role,
        status: memberForm.status,
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: initials,
        allowedTabs: finalTabs
      };
      setMembers([newMember, ...members]);
      alert(`User "${memberForm.name}" (${memberForm.username}) created successfully! Granted access to ${isSuper ? 'All Tabs' : finalTabs.length + ' Tabs'}.`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id, name) => {
    if (name === 'Jeet Patel' || name === 'Sonal Sharma') {
      alert('Default Super Admins (Jeet Patel & Sonal Sharma) cannot be removed.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove "${name}" from team members?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setMembers(prev => prev.map(m => m.id === id ? {
      ...m,
      status: m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    } : m));
  };

  return (
    <div>
      {/* Header & Breadcrumb */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Members</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            Jeet & Sonal Super Admin Control • Add team members, set usernames/passwords, and grant tab access permissions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Members</span>
          </div>
          <button onClick={openAddModal} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
            <Plus size={18} /> (+Add Member)
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Accounts</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>{totalMembers}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Registered Team Members</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Super Admins (Jeet & Sonal)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6', marginTop: '6px' }}>{superAdminCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Full Control System Owners</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Custom Access Users</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{staffCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Configured Tab Access</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by name, username, phone..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select 
            className="form-control" 
            style={{ width: '180px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            <option value="SUPERADMIN">Super Admin</option>
            <option value="STAFF">Custom Member</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Member Name</th>
              <th>Username</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Granted Tabs Access</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No members match your criteria.
                </td>
              </tr>
            ) : (
              filteredMembers.map((m, idx) => (
                <tr key={m.id}>
                  <td data-label="#">{idx + 1}</td>
                  <td data-label="Member">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.role === 'SUPERADMIN' ? '#8b5cf6' : '#0284c7', color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Joined: {m.joinedDate}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Username" style={{ fontWeight: 700, color: '#0284c7' }}>{m.username || m.email}</td>
                  <td data-label="Phone">{m.phone}</td>
                  <td data-label="Role">
                    {m.role === 'SUPERADMIN' ? (
                      <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Super Admin
                      </span>
                    ) : (
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={14} /> Member Staff
                      </span>
                    )}
                  </td>
                  <td data-label="Tab Access">
                    {m.role === 'SUPERADMIN' || (m.allowedTabs && m.allowedTabs.includes('*')) ? (
                      <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>
                        ⭐ Full System Access (All Tabs)
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 700 }}>
                        🔑 {(m.allowedTabs || []).length} / {ALL_APPLICATION_TABS.length} Tabs Enabled
                      </span>
                    )}
                  </td>
                  <td data-label="Status">
                    <button 
                      onClick={() => toggleStatus(m.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      title="Toggle Active/Inactive"
                    >
                      {m.status === 'ACTIVE' ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          ● Active
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                          ○ Inactive
                        </span>
                      )}
                    </button>
                  </td>
                  <td data-label="Action" style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => openEditModal(m)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Edit size={14} /> Edit Access
                      </button>
                      <button 
                        onClick={() => handleDeleteMember(m.id, m.name)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2-Step (+Add) Member & Tab Access Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px', borderRadius: '16px', padding: '24px' }}>
            
            {/* Modal Header with Step Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>
                    {editingMember ? 'Edit User Credentials & Access' : '+Add Team Member'}
                  </h2>
                  <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                    Step {modalStep} of 2
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>
                  {modalStep === 1 
                    ? 'Enter member credentials (Username & Password).' 
                    : 'Select which tabs Jeet or Sonal grant this member access to.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            {/* STEP 1: Enter Username & Password Credentials */}
            {modalStep === 1 && (
              <form onSubmit={handleStep1Confirmation}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rohit Kumar" 
                    value={memberForm.name} 
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Username *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Rohit@1" 
                      value={memberForm.username} 
                      onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700 }}>Password *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. rohit123" 
                      value={memberForm.password} 
                      onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="+91 98765 43210" 
                    value={memberForm.phone} 
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} 
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Role Level *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, role: 'STAFF' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: memberForm.role === 'STAFF' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: memberForm.role === 'STAFF' ? '#e0f2fe' : '#ffffff',
                        color: memberForm.role === 'STAFF' ? '#0369a1' : '#64748b',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <UserCheck size={16} /> Custom Member
                    </button>

                    <button
                      type="button"
                      onClick={() => setMemberForm({ ...memberForm, role: 'SUPERADMIN' })}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: memberForm.role === 'SUPERADMIN' ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                        background: memberForm.role === 'SUPERADMIN' ? '#f3e8ff' : '#ffffff',
                        color: memberForm.role === 'SUPERADMIN' ? '#7c3aed' : '#64748b',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ShieldCheck size={16} /> Super Admin
                    </button>
                  </div>
                </div>

                {/* Confirmation Button to proceed to Step 2 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                    Confirmation (Next: Tab Access) <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Configure Allowed Tabs Access Checklist */}
            {modalStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); handleFinalSave(); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    User: <span style={{ color: '#0284c7' }}>{memberForm.name}</span> ({memberForm.username})
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={selectAllTabs} style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                      Select All
                    </button>
                    <button type="button" onClick={clearAllTabs} style={{ fontSize: '11px', background: '#f1f5f9', color: '#64748b', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                      Reset
                    </button>
                  </div>
                </div>

                {memberForm.role === 'SUPERADMIN' ? (
                  <div style={{ padding: '16px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '10px', fontSize: '13px', fontWeight: 700, marginBottom: '16px', border: '1px solid #ddd6fe' }}>
                    ⭐ Super Admins automatically have full access to ALL tabs and system settings.
                  </div>
                ) : (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginBottom: '20px', background: '#ffffff' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {ALL_APPLICATION_TABS.map((tab) => {
                        const isChecked = memberForm.allowedTabs && memberForm.allowedTabs.includes(tab.path);
                        return (
                          <div 
                            key={tab.path}
                            onClick={() => toggleTabPermission(tab.path)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '10px 14px', 
                              borderRadius: '8px', 
                              border: isChecked ? '1px solid #0284c7' : '1px solid #e2e8f0', 
                              background: isChecked ? '#f0f9ff' : '#f8fafc', 
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: isChecked ? '#0369a1' : '#475569' }}>
                                {tab.label}
                              </span>
                            </div>
                            <div>
                              {isChecked ? (
                                <CheckSquare size={18} color="#0284c7" />
                              ) : (
                                <Square size={18} color="#94a3b8" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => setModalStep(1)} 
                    className="btn-secondary" 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={16} /> Back to Credentials
                  </button>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ padding: '10px 24px', fontWeight: 800 }}
                  >
                    Save User & Confirm Access
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
