
import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import './QRCodeModal.css';
import { Download } from '@mui/icons-material';

const QRCodeModal = ({ item, onClose }) => {
  const qrCodeRef = useRef(null);
  const qrCodeValue = `${window.location.origin}/item/${item.id}`;

  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      toPng(qrCoderef.current, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `${item.name}-qrcode.png`;
          link.click();
        })
        .catch((err) => {
          console.error('oops, something went wrong!', err);
        });
    }
  };

  if (!item) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">QR Code สำหรับ: {item.name}</h2>
        <div className="qr-code-wrapper" ref={qrCodeRef}>
            <div className="qr-code-container">
                <QRCode
                    value={qrCodeValue}
                    size={256}
                    viewBox={`0 0 256 256`}
                />
            </div>
            <p className="item-name-under-qr">{item.name}</p>
        </div>
        <p className="scan-prompt">ใช้กล้องมือถือสแกนเพื่อเปิดหน้ารายการ</p>
        <button className="download-button" onClick={downloadQRCode}>
          <Download sx={{ marginRight: '8px' }} />
          ดาวน์โหลด QR Code
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
