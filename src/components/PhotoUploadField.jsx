import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Institutional monochrome PhotoUploadField
 * Supports drag & drop, file selection, <= 5MB validation, preview thumbnail,
 * replace, remove, and zoom modal.
 */
export default function PhotoUploadField({
  label,
  description,
  value,
  onChange,
  onRemove,
  required = false
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  const handleFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPG, PNG, WebP) are allowed.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size (${sizeMB}MB) exceeds 5MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      onChange(base64);
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{
      border: '1px solid #222',
      borderRadius: '8px',
      padding: '14px',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </span>
            {required && (
              <span style={{ fontSize: '10px', color: '#888', background: '#1c1c1c', padding: '1px 5px', borderRadius: '3px' }}>
                REQ
              </span>
            )}
          </div>
          {description && (
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#777' }}>
              {description}
            </p>
          )}
        </div>

        {value ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10b981' }}>
            <CheckCircle size={12} /> Ready
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: '#555' }}>Max 5MB</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Upload Zone / Preview */}
      {value ? (
        <div style={{
          position: 'relative',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid #333',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px'
        }}>
          {/* Thumbnail */}
          <div
            onClick={() => setShowLightbox(true)}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#141414',
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
              border: '1px solid #222'
            }}
            title="Click to zoom preview"
          >
            <img
              src={value}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              transition: 'opacity 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
            >
              <Eye size={16} color="#fff" />
            </div>
          </div>

          {/* Details & Actions */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '11px', color: '#aaa', wordBreak: 'break-all' }}>
              Image loaded & verified
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleBrowseClick}
                style={{
                  background: '#1a1a1a',
                  color: '#ccc',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={11} /> Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  onRemove();
                }}
                style={{
                  background: '#200e0e',
                  color: '#f87171',
                  border: '1px solid #451a1a',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={11} /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
          style={{
            border: `1px dashed ${dragOver ? '#fff' : '#333'}`,
            borderRadius: '6px',
            padding: '18px 12px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#151515' : '#050505',
            transition: 'all 0.15s ease'
          }}
        >
          <Camera size={22} color={dragOver ? '#fff' : '#666'} style={{ margin: '0 auto 6px', display: 'block' }} />
          <div style={{ fontSize: '12px', color: '#ddd', fontWeight: 500 }}>
            {dragOver ? 'Drop image here' : 'Drop photo or click to browse'}
          </div>
          <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
            JPG, PNG, WebP up to 5MB
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#ef4444',
          background: '#200808',
          border: '1px solid #4a1515',
          padding: '6px 8px',
          borderRadius: '4px'
        }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {showLightbox && value && (
        <div
          onClick={() => setShowLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              background: '#0d0d0d',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{label} (Full Preview)</span>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ overflow: 'auto', textAlign: 'center', maxHeight: '72vh' }}>
              <img
                src={value}
                alt={label}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
