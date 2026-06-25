
import React, { useState } from 'react';
import { Modal, Box, Typography, Button, CircularProgress } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
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
    p: { xs: 3, sm: 4 },
    borderRadius: '16px',
    color: '#fff',
    fontFamily: 'Kanit, sans-serif',
    textAlign: 'center',
};

const DeleteModal = ({ open, onClose, item, userDisplayName, category }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!item) return null;

    const handleConfirm = async () => {
        if (isProcessing) return;
        setIsProcessing(true);

        try {
            const batch = writeBatch(db);

            // 1. Delete the item document
            const itemRef = doc(db, category, item.id);
            batch.delete(itemRef);

            // 2. Create a transaction log for the deletion with corrected fields
            const transactionRef = doc(collection(db, "transactions"));
            batch.set(transactionRef, {
                itemId: item.id,
                itemName: item.name,
                category: category,
                quantity: item.quantity, // CORRECTED FIELD NAME (log the quantity that was removed)
                reason: 'ลบรายการออกจากระบบ',
                user: userDisplayName,   // CORRECTED FIELD NAME
                type: 'ลบ',              // CORRECTED VALUE
                timestamp: serverTimestamp(),
            });

            await batch.commit();
            onClose(); // Close modal on success

        } catch (error) {
            console.error("Error deleting item: ", error);
            alert("เกิดข้อผิดพลาดในการลบรายการ");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <WarningAmber sx={{ fontSize: 60, color: '#f8bb86' }} />

                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.8rem', mt: 2 }}>
                    ยืนยันการลบ
                </Typography>

                <Typography sx={{ mt: 1, fontFamily: 'Kanit', color: '#ccc', fontSize: '1rem', borderBottom: '1px solid #555', pb: 2.5, mb: 2.5 }}>
                    ผู้ดำเนินการ: {userDisplayName}
                </Typography>

                <Typography sx={{ fontFamily: 'Kanit', fontSize: '1.1rem', color: '#ddd' }}>
                    คุณแน่ใจหรือไม่ว่าต้องการลบรายการ
                </Typography>

                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1.4rem', color: '#ffc107', my: 1.5, textShadow: '0 0 10px rgba(255,193,7,0.4)' }}>
                    {item.name}
                </Typography>

                <Typography sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1rem', color: '#dc3545' }}>
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button 
                        variant="contained"
                        onClick={onClose}
                        disabled={isProcessing}
                        sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1rem', px: 4, py: 1, borderRadius: '12px', bgcolor: '#6c757d', '&:hover': { bgcolor: '#5a6268' } }}
                    >
                        ยกเลิก
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        sx={{ fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '1rem', px: 4, py: 1, borderRadius: '12px', bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' }, minWidth: 150 }}
                    >
                        {isProcessing ? <CircularProgress size={26} color="inherit" /> : 'ยืนยันการลบ'}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default DeleteModal;
