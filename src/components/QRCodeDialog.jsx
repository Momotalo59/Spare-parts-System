
import React, { useRef } from 'react';
import { Dialog, DialogContent, Typography, Button, Box, IconButton } from '@mui/material';
import { Close, GetApp } from '@mui/icons-material';
import QRCode from 'react-qr-code'; // Use the correct, existing library
import { toPng } from 'html-to-image';

const QRCodeDialog = ({ open, onClose, item, category }) => {
    const qrCodeRef = useRef(null);

    if (!item) return null;

    const qrUrl = `${window.location.origin}/action/${category}/${item.id}`;

    const handleDownload = () => {
        const node = qrCodeRef.current;
        if (node) {
            toPng(node, { cacheBust: true, backgroundColor: 'white', quality: 1.0 })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = `${item.name.replace(/ /g, '_')}_qr.png`;
                    link.href = dataUrl;
                    link.click();
                })
                .catch((err) => {
                    console.error('Oops, something went wrong!', err);
                });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    backgroundColor: '#2c2c2c',
                    color: 'white',
                    p: { xs: 1, sm: 2 },
                    fontFamily: 'Kanit, sans-serif',
                    width: '100%',
                    maxWidth: '420px',
                    textAlign: 'center',
                }
            }}
        >
            <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, color: '#aaa' }}>
                <Close />
            </IconButton>
            <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography sx={{ fontFamily: 'Kanit', fontSize: '1rem', mb: 2 }}>
                    QR Code สำหรับ: <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                </Typography>

                {/* This is the container that will be downloaded as an image */}
                <Box ref={qrCodeRef} sx={{ bgcolor: 'white', p: 2, borderRadius: '16px', display: 'inline-block' }}>
                    <QRCode value={qrUrl} size={256} level="L" />
                    <Typography sx={{ fontFamily: 'Kanit', color: '#333', mt: 1, fontWeight: 500, fontSize: '0.9rem' }}>
                        {item.name}
                    </Typography>
                </Box>

                <Typography sx={{ fontFamily: 'Kanit', color: '#ccc', mt: 2.5, fontSize: '0.9rem' }}>
                    ใช้กล้องมือถือสแกนเพื่อเปิดหน้าทำรายการ
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<GetApp />}
                    onClick={handleDownload}
                    sx={{
                        mt: 2,
                        fontFamily: 'Kanit',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: '50px',
                        px: 4,
                        py: 1.2,
                        fontSize: '1rem',
                        color: '#fff',
                        backgroundColor: '#4285F4',
                        '&:hover': { backgroundColor: '#3367D6' },
                    }}
                >
                    ดาวน์โหลด QR Code
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default QRCodeDialog;
