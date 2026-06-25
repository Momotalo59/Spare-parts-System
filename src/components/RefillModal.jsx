
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { db } from '../firebase';
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: '#343a40',
    border: '1px solid #555',
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    borderRadius: '16px',
    color: '#fff',
    fontFamily: 'Kanit, sans-serif',
};

const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#2b2b2b',
        '& input': { color: 'white', fontFamily: 'Kanit' },
        '& fieldset': { borderColor: '#555' },
        '&:hover fieldset': { borderColor: '#777' },
        '&.Mui-focused fieldset': { borderColor: '#A076F9' },
    },
    '& .MuiInputLabel-root': { 
        color: '#aaa', 
        fontFamily: 'Kanit'
    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#A076F9'
    }
};

const RefillModal = ({ open, onClose, item, userDisplayName, category }) => {
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setQuantity(1);
            setIsProcessing(false);
        }
    }, [open]);

    if (!item) return null;

    const handleConfirm = async () => {
        if (quantity < 1 || isProcessing) return;

        setIsProcessing(true);

        const refillQuantity = Number(quantity);
        const currentQuantity = Number(item.quantity);
        const newQuantity = currentQuantity + refillQuantity;

        try {
            const batch = writeBatch(db);

            // 1. Update item quantity
            const itemRef = doc(db, category, item.id);
            batch.update(itemRef, { quantity: newQuantity });

            // 2. Create transaction log with corrected fields
            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, {
                itemId: item.id,
                itemName: item.name,
                category: category,
                quantity: refillQuantity, // CORRECTED FIELD NAME
                reason: 'เติมสต็อก', // Default reason for refill
                user: userDisplayName,   // CORRECTED FIELD NAME
                type: 'เติมสต็อก', // CORRECTED VALUE
                timestamp: serverTimestamp(),
            });

            await batch.commit();
            onClose();

        } catch (error) {
            console.error("Error processing refill: ", error);
            alert("เกิดข้อผิดพลาดในการเติมสต็อก");
            setIsProcessing(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    เติมสต็อก: {item.name}
                </Typography>
                <Typography sx={{ mt: 1, fontFamily: 'Kanit', color: '#ccc', fontSize: '0.9rem' }}>
                    ผู้ดำเนินการ: {userDisplayName} | จำนวนปัจจุบัน: {item.quantity} ชิ้น
                </Typography>
                
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 3 }}>
                    <Typography sx={{ fontFamily: 'Kanit', mb: 1, fontSize: '1rem' }}>จำนวนที่ต้องการเพิ่ม</Typography>
                    <TextField
                        fullWidth
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        sx={textFieldStyles}
                        InputProps={{ inputProps: { min: 1 } }}
                    />
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onClose}
                        disabled={isProcessing}
                        sx={{ fontFamily: 'Kanit', fontWeight: 'bold', color: '#ccc', borderColor: '#777', px: 2.5, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
                    >
                        ยกเลิก
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirm}
                        disabled={quantity < 1 || isProcessing}
                        sx={{ 
                            fontFamily: 'Kanit', fontWeight: 'bold',
                            px: 3.5, minWidth: 100,
                            backgroundColor: '#A076F9', 
                            '&:hover': { backgroundColor: '#8952f5' },
                            '&.Mui-disabled': { backgroundColor: '#555', color: '#888'}
                        }}
                    >
                        {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'ยืนยัน'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default RefillModal;
