import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, RefreshCw, Upload, Smartphone } from 'lucide-react';
import Webcam from 'react-webcam';
import { deviceService } from '../../services/api';

export default function AddMobileModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '128',
    ram: '6',
    colour: 'Black',
    condition: 'Good',
    purchase_amount: '',
    paid_by: 'Rohit',
    imei: '',
    remarks: ''
  });

  const [useCamera, setUseCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const webcamRef = useRef(null);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setUseCamera(false);
    }
  }, [webcamRef]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.brand || !formData.model || !formData.purchase_amount) {
      setError('Please fill in Brand, Model Name, and Purchased Amount');
      return;
    }

    try {
      setLoading(true);
      await deviceService.createDevice({
        ...formData,
        image_data: capturedImage
      });
      setLoading(false);
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
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={20} color="#0284c7" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Add Mobile to Old Inventory</h3>
          </div>
          <button onClick={onClose} style={{ color: '#64748b' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mobile Brand *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Apple, Samsung, OnePlus" 
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. iPhone 13, Galaxy S22" 
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Storage (GB) *</label>
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
              <div className="form-group">
                <label className="form-label">RAM (GB) *</label>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Purchased Amount (₹ INR) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="e.g. 24000" 
                  value={formData.purchase_amount}
                  onChange={(e) => setFormData({ ...formData, purchase_amount: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <div className="form-group">
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
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Color</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Midnight, Phantom Black" 
                  value={formData.colour}
                  onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">IMEI / Serial (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="15-digit IMEI number" 
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                />
              </div>
            </div>

            {/* Photo Capture & Upload */}
            <div className="form-group">
              <label className="form-label">Device Photo</label>
              
              {useCamera ? (
                <div style={{ textAlign: 'center', background: '#000', borderRadius: '8px', padding: '10px' }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    style={{ width: '100%', maxHeight: '200px', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                    <button type="button" onClick={capturePhoto} className="btn-primary" style={{ padding: '8px 16px' }}>
                      <Camera size={16} /> Snap Photo
                    </button>
                    <button type="button" onClick={() => setUseCamera(false)} className="btn-secondary" style={{ padding: '8px 16px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : capturedImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <img src={capturedImage} alt="Device preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Photo attached</div>
                    <button type="button" onClick={() => setCapturedImage(null)} style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setUseCamera(true)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Camera size={16} /> Use Camera
                  </button>
                  <label className="btn-secondary" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                    <Upload size={16} /> Upload Image
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Remarks / Condition Details</label>
              <textarea 
                className="form-control" 
                rows="2" 
                placeholder="Scratch notes, accessories included, etc."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Mobile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
