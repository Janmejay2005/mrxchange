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
  XCircle,
  Key,
  Home
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

const INITIAL_MEMBERS = [
  { id: '1', name: 'Jeet Patel', email: 'jeet@mrxchange.com', phone: '+91 98765 43210', role: 'SUPERADMIN', status: 'ACTIVE', joinedDate: '2025-01-10', avatar: 'JP' },
  { id: '2', name: 'Sonal Sharma', email: 'sonal@mrxchange.com', phone: '+91 98765 12345', role: 'STAFF', status: 'ACTIVE', joinedDate: '2025-03-15', avatar: 'SS' },
  { id: '3', name: 'Rohit Kumar', email: 'rohit@mrxchange.com', phone: '+91 98123 45678', role: 'STAFF', status: 'ACTIVE', joinedDate: '2025-05-20', avatar: 'RK' },
  { id: '4', name: 'Neha Gupta', email: 'neha@mrxchange.com', phone: '+91 97890 12345', role: 'SUPERADMIN', status: 'ACTIVE', joinedDate: '2025-06-01', avatar: 'NG' },
  { id: '5', name: 'Aman Verma', email: 'aman@mrxchange.com', phone: '+91 96543 21098', role: 'STAFF', status: 'INACTIVE', joinedDate: '2025-07-12', avatar: 'AV' }
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF', // 'STAFF' | 'SUPERADMIN'
    status: 'ACTIVE'
  });

  useEffect(() => {
    localStorage.setItem('mrx_team_members', JSON.stringify(members));
  }, [members]);

  const filteredMembers = members.filter(m => {
    if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
    const q = (searchTerm || globalSearch || '').trim().toLowerCase();
    if (q) {
      const matchName = m.name.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      const matchPhone = m.phone.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  const totalMembers = members.length;
  const superAdminCount = members.filter(m => m.role === 'SUPERADMIN').length;
  const staffCount = members.filter(m => m.role === 'STAFF').length;
  const activeCount = members.filter(m => m.status === 'ACTIVE').length;

  const openAddModal = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      status: member.status
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? {
        ...m,
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone,
        role: memberForm.role,
        status: memberForm.status
      } : m));
      alert(`Member "${memberForm.name}" updated successfully!`);
    } else {
      const initials = memberForm.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MB';
      const newMember = {
        id: String(Date.now()),
        name: memberForm.name,
        email: memberForm.email,
        phone: memberForm.phone,
        role: memberForm.role,
        status: memberForm.status,
        joinedDate: new Date().toISOString().split('T')[0],
        avatar: initials
      };
      setMembers([newMember, ...members]);
      alert(`New ${memberForm.role === 'SUPERADMIN' ? 'Super Admin' : 'Staff Member'} created successfully!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteMember = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the system?`)) {
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
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>Members in Super Admin</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage store team members, staff permissions, and Super Admin access control.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
            <Home size={14} /> / <span style={{ color: '#0284c7', fontWeight: 600 }}>Members in Super Admin</span>
          </div>
          <button onClick={openAddModal} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Member / Super Admin
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Team Members</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>{totalMembers}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Registered Store Accounts</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Super Admins</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6', marginTop: '6px' }}>{superAdminCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Full Control Access</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Staff Members</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>{staffCount}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Operational Inventory Staff</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Status</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>{activeCount} Active</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Currently Enabled</div>
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
              placeholder="Search member by name, email, phone..." 
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
            <option value="SUPERADMIN">Super Admin Only</option>
            <option value="STAFF">Staff Member Only</option>
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
              <th>Email / Identifier</th>
              <th>Phone Number</th>
              <th>Role</th>
              <th>Date Joined</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              filteredMembers.map((m, idx) => (
                <tr key={m.id}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: m.role === 'SUPERADMIN' ? '#8b5cf6' : '#0284c7', color: '#fff', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{m.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>ID: #{m.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.email}</td>
                  <td>{m.phone}</td>
                  <td>
                    {m.role === 'SUPERADMIN' ? (
                      <span style={{ background: '#f3e8ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={14} /> Super Admin
                      </span>
                    ) : (
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={14} /> Staff Member
                      </span>
                    )}
                  </td>
                  <td>{m.joinedDate}</td>
                  <td>
                    <button 
                      onClick={() => toggleStatus(m.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                      title="Click to toggle Active/Inactive"
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
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => openEditModal(m)} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#0284c7', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        <Edit size={14} /> Edit Role
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

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7', margin: 0 }}>
                  {editingMember ? 'Edit Member Role & Access' : 'Add New Member / Super Admin'}
                </h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', margin: 0 }}>Set member identity and permissions level.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#64748b" /></button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter full name" 
                  value={memberForm.name} 
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Email Address / Identifier *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@mrxchange.com" 
                  value={memberForm.email} 
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="form-label">Phone Number *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="+91 98765 43210" 
                  value={memberForm.phone} 
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} 
                  required 
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Role Level *</label>
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
                      justify: 'center',
                      gap: '6px'
                    }}
                  >
                    <UserCheck size={16} /> Staff Member
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
                      justify: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShieldCheck size={16} /> Super Admin
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Account Status</label>
                <select 
                  className="form-control" 
                  value={memberForm.status} 
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active (Can Login)</option>
                  <option value="INACTIVE">Inactive (Access Suspended)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                  {editingMember ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
