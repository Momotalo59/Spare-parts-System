
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography, Button } from '@mui/material';

const Scanner = ({ onScanSuccess, onBack }) => {
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'qr-reader', // ID of the element to render the scanner
            {
                fps: 10, // Frames per second for scanning
                qrbox: { width: 250, height: 250 }, // Size of the scanning box
                rememberLastUsedCamera: true,
                supportedScanTypes: [0] // 0 for camera
            },
            false // verbose
        );

        const handleScanSuccess = (decodedText, decodedResult) => {
            // Stop scanning after a successful scan
            scanner.clear();
            setScanResult(decodedText);
            // Pass the result to the parent component
            if (onScanSuccess) {
                onScanSuccess(decodedText);
            }
        };

        const handleScanError = (errorMessage) => {
            // handle scan error, you can ignore it or log it
            // console.error(errorMessage);
        };

        scanner.render(handleScanSuccess, handleScanError);

        // Cleanup function to clear the scanner on component unmount
        return () => {
            // Check if the scanner element exists before trying to clear
            if (document.getElementById('qr-reader')) {
                 scanner.clear().catch(error => console.error("Failed to clear scanner on unmount.", error));
            }           
        };
    }, [onScanSuccess]);

    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2, 
            p: 4, 
            width: '100%', 
            maxWidth: '600px', 
            margin: 'auto',
            backgroundColor: '#2b2b2b',
            borderRadius: '15px',
        }}>
            <Typography variant="h5" sx={{ fontFamily: 'Kanit', color: '#fff' }}>
                สแกน QR Code เพื่อเบิก/ยืม
            </Typography>
            
            <Box id="qr-reader" sx={{ width: '100%', maxWidth: '500px' }}></Box>

            {scanResult && (
                <Typography sx={{ color: 'lightgreen', fontFamily: 'Kanit' }}>
                    สแกนสำเร็จ: {scanResult}
                </Typography>
            )}

            <Button 
                variant="outlined" 
                onClick={onBack} 
                sx={{ fontFamily: 'Kanit', color: '#fff', borderColor: '#fff' }}
            >
                ย้อนกลับ
            </Button>
        </Box>
    );
};

export default Scanner;
