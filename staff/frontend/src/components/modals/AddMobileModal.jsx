import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Upload, Smartphone, Check, Image as ImageIcon, Trash2, Plus } from 'lucide-react';
import Webcam from 'react-webcam';
import { deviceService } from '../../services/api';

export default function AddMobileModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '128',
    ram: '6',
    colour: 'Midnight Black',
    condition: 'Fresh', // Exactly 'Fresh' or 'Repair' per PRD
    purchase_amount: '',
    paid_by: 'Rohit',
    repair: '',
    remarks: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Support for at least 2 images (e.g. Front & Back)
  const [images, setImages] = useState({
    image1: null, // Front / Screen
    image2: null, // Back / Body
    additional: [] // Any extra photos
  });

  const [activeCameraSlot, setActiveCameraSlot] = useState(null); // 'image1' | 'image2' | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const webcamRef = useRef(null);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current && activeCameraSlot) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (activeCameraSlot === 'image1') {
        setImages(prev => ({ ...prev, image1: imageSrc }));
      } else if (activeCameraSlot === 'image2') {
        setImages(prev => ({ ...prev, image2: imageSrc }));
      }
      setActiveCameraSlot(null);
    }
  }, [webcamRef, activeCameraSlot]);

  const handleSingleSlotUpload = (slot, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => ({ ...prev, [slot]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMultiFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (index === 0) {
          setImages(prev => ({ ...prev, image1: reader.result }));
        } else if (index === 1) {
          setImages(prev => ({ ...prev, image2: reader.result }));
        } else {
          setImages(prev => ({ ...prev, additional: [...prev.additional, reader.result] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (slot) => {
    if (slot === 'image1') setImages(prev => ({ ...prev, image1: null }));
    if (slot === 'image2') setImages(prev => ({ ...prev, image2: null }));
  };

  const removeAdditionalImage = (index) => {
    setImages(prev => ({
      ...prev,
      additional: prev.additional.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.brand || !formData.model || !formData.purchase_amount) {
      setError('Please fill in Brand, Model Name, and Purchased Amount');
      return;
    }

    const allImagesList = [images.image1, images.image2, ...images.additional].filter(Boolean);

    try {
      setLoading(true);
      await deviceService.createDevice({
        ...formData,
        purchase_amount: parseFloat(formData.purchase_amount) || 0,
        image_data: images.image1 || images.image2 || null,
        images: allImagesList
      });
      setLoading(false);
      // Reset form
      setFormData({
        brand: '',
        model: '',
        storage: '128',
        ram: '6',
        colour: 'Midnight Black',
        condition: 'Fresh',
        purchase_amount: '',
        paid_by: 'Rohit',
        repair: '',
        remarks: '',
        date: new Date().toISOString().split('T')[0]
      });
      setImages({ image1: null, image2: null, additional: [] });
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to add mobile device');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Fixed Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={18} color="#0284c7" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Add Mobile Entry</h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>Enter device specifications and upload at least 2 images</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ color: '#64748b', padding: 6, borderRadius: 6, background: '#f1f5f9' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Scrollable Form Body */}
          <div 
            className="modal-body" 
            style={{ 
              maxHeight: 'calc(88vh - 130px)', 
              overflowY: 'auto', 
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', border: '1px solid #fecaca' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Row 1: Brand & Model */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Brand *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Apple, Samsung, OnePlus" 
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Model *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. iPhone 13, Galaxy S22" 
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2: Storage & RAM */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Storage in GB *</label>
                <select 
                  className="form-control"
                  value={formData.storage}
                  onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                >
                  <option value="32">32 GB</option>
                  <option value="64">64 GB</option>
                  <option value="128">128 GB</option>
                  <option value="256">256 GB</option>
                  <option value="512">512 GB</option>
                  <option value="1024">1 TB</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">RAM *</label>
                <select 
                  className="form-control"
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                >
                  <option value="3">3 GB</option>
                  <option value="4">4 GB</option>
                  <option value="6">6 GB</option>
                  <option value="8">8 GB</option>
                  <option value="12">12 GB</option>
                  <option value="16">16 GB</option>
                </select>
              </div>
            </div>

            {/* Row 3: Color & Condition */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Color (in words) *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Space Grey, Phantom Black, Sierra Blue" 
                  value={formData.colour}
                  onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Condition * (Routing Target)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'Fresh' })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: formData.condition === 'Fresh' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      background: formData.condition === 'Fresh' ? '#ecfdf5' : '#ffffff',
                      color: formData.condition === 'Fresh' ? '#047857' : '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {formData.condition === 'Fresh' && <Check size={14} />}
                    Fresh (In-hand)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: 'Repair' })}
                    style={{
                      padding: '9px',
                      borderRadius: '8px',
                      border: formData.condition === 'Repair' ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                      background: formData.condition === 'Repair' ? '#fffbeb' : '#ffffff',
                      color: formData.condition === 'Repair' ? '#b45309' : '#475569',
                      fontWeight: 700,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {formData.condition === 'Repair' && <Check size={14} />}
                    Repair
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: Paid Amount & Paid By */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Paid Amount (₹ INR) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 24000" 
                  value={formData.purchase_amount}
                  onChange={(e) => setFormData({ ...formData, purchase_amount: e.target.value })}
                  min="0"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Paid By *</label>
                <select 
                  className="form-control"
                  value={formData.paid_by}
                  onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                >
                  <option value="Rohit">Rohit</option>
                  <option value="Aadarsh">Aadarsh</option>
                  <option value="Neha">Neha</option>
                  <option value="Aman">Aman</option>
                  <option value="Jeet">Jeet</option>
                  <option value="Sunal">Sunal</option>
                </select>
              </div>
            </div>

            {/* Row 5: Repair Details & Date */}
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Repair Notes / Estimated Cost</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Screen replacement, ₹1500 estimate" 
                  value={formData.repair}
                  onChange={(e) => setFormData({ ...formData, repair: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Date Added *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Remarks / Accessories</label>
              <textarea 
                className="form-control" 
                rows="2"
                placeholder="Additional notes about device condition, battery health, box/charger accessories..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>

            {/* DUAL IMAGE UPLOAD SECTION */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Device Images (At least 2 images recommended)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Front / Screen view and Back / Body view</div>
                </div>

                <label className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>
                  <Upload size={14} color="#0284c7" /> Select Multiple from Files
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleMultiFileUpload}
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>

              {/* Webcam Live Capture View */}
              {activeCameraSlot && (
                <div style={{ textAlign: 'center', background: '#0b132b', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                    Capturing for {activeCameraSlot === 'image1' ? 'Image 1 (Front View)' : 'Image 2 (Back View)'}
                  </div>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={{ width: '100%', maxHeight: '200px', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                    <button type="button" onClick={capturePhoto} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                      <Camera size={14} /> Snap Photo
                    </button>
                    <button type="button" onClick={() => setActiveCameraSlot(null)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* 2 Image Slots Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Slot 1: Front / Screen Photo */}
                <div style={{ background: '#ffffff', borderRadius: '8px', border: images.image1 ? '2px solid #0284c7' : '1px dashed #cbd5e1', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>1. Front Photo (Screen)</span>
                    {images.image1 && <span style={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>✓ Attached</span>}
                  </div>

                  {images.image1 ? (
                    <div>
                      <img 
                        src={images.image1} 
                        alt="Front Preview" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>
                          Change
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleSingleSlotUpload('image1', e.target.files[0])} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => removeImage('image1')} 
                          style={{ color: '#dc2626', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
                      <ImageIcon size={28} color="#94a3b8" />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => setActiveCameraSlot('image1')}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <Camera size={12} color="#0284c7" /> Camera
                        </button>
                        <label className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>
                          <Upload size={12} color="#059669" /> File
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleSingleSlotUpload('image1', e.target.files[0])} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot 2: Back / Body Photo */}
                <div style={{ background: '#ffffff', borderRadius: '8px', border: images.image2 ? '2px solid #0284c7' : '1px dashed #cbd5e1', padding: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>2. Back Photo (Body)</span>
                    {images.image2 && <span style={{ color: '#059669', fontSize: '11px', fontWeight: 700 }}>✓ Attached</span>}
                  </div>

                  {images.image2 ? (
                    <div>
                      <img 
                        src={images.image2} 
                        alt="Back Preview" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} 
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>
                          Change
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleSingleSlotUpload('image2', e.target.files[0])} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                        <button 
                          type="button" 
                          onClick={() => removeImage('image2')} 
                          style={{ color: '#dc2626', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', padding: '12px 0' }}>
                      <ImageIcon size={28} color="#94a3b8" />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          onClick={() => setActiveCameraSlot('image2')}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <Camera size={12} color="#0284c7" /> Camera
                        </button>
                        <label className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>
                          <Upload size={12} color="#059669" /> File
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleSingleSlotUpload('image2', e.target.files[0])} 
                            style={{ display: 'none' }} 
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra images if uploaded */}
              {images.additional.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {images.additional.map((extraImg, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                      <img 
                        src={extraImg} 
                        alt={`Extra ${idx}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(idx)}
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#dc2626',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', padding: '14px 24px' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={loading} 
              className="btn-primary" 
              style={{ minWidth: '160px', justifyContent: 'center' }}
            >
              {loading ? 'Saving Device...' : 'Add Mobile Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
