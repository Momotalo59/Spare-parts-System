import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography, Paper, Snackbar, Alert } from '@mui/material';
import BorrowReturnDialog from '../components/BorrowReturnDialog';

const ScanPage = ({ items, user, onSuccess }) => {
    const [scannedData, setScannedData] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [error, setError] = useState('');
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'qr-scanner',
            { fps: 10, qrbox: 250 },
            false
        );
        scannerRef.current = scanner;

        const onScanSuccess = (decodedText, decodedResult) => {
            if (decodedText !== scannedData) {
                setScannedData(decodedText);
                const foundItem = items.find(item => item.id === decodedText);

                if (foundItem) {
                    setSelectedItem(foundItem);
                    setDialogOpen(true);
                    setError('');
                } else {
                    setError(`ไม่พบรายการสำหรับ QR Code: ${decodedText}`);
                    setSelectedItem(null);
                }
            }
        };

        scanner.render(onScanSuccess);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner.", error);
            });
        };
    }, [items, scannedData]);

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedItem(null);
        setScannedData(null); // Reset to allow scanning the same QR code again
    };

    const handleSuccess = (transactionData) => {
        onSuccess(transactionData);
        handleCloseDialog();
    };

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', bgcolor: 'background.default' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', mt: 2, mb: 2 }}>
                สแกน QR Code
            </Typography>
            <Paper 
                elevation={4} 
                sx={{ 
                    width: '100%', 
                    maxWidth: '500px', 
                    overflow: 'hidden', 
                    borderRadius: 2, 
                    border: '2px solid', 
                    borderColor: 'primary.main'
                }}
            >
                <div id="qr-scanner" />
            </Paper>
            
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {selectedItem && (
                <BorrowReturnDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    item={selectedItem}
                    userEmail={user.email}
                    onSuccess={handleSuccess}
                />
            )}
        </Box>
    );
};

export default ScanPage;
