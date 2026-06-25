
import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Button, CircularProgress, Paper, TextField } from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from 'axios'; // Import axios

const ItemDetails = ({ category, itemId, handleClose, user }) => {
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');

    const isTool = category === 'tools';
    const actionName = isTool ? 'ยืม' : 'เบิก';
    const title = isTool ? 'ยืมเครื่องมือ' : (category === 'safetys' ? 'เบิกอุปกรณ์เซฟตี้' : 'เบิกอะไหล่');
    const confirmButtonText = `ยืนยันการ${actionName}`;

    const fetchItem = useCallback(async () => {
        if (!category || !itemId) return;
        setLoading(true);
        try {
            const itemRef = doc(db, category, itemId);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                setItem({ id: itemSnap.id, ...itemSnap.data() });
            } else {
                toast.error('ไม่พบข้อมูลไอเทมนี้ในระบบ');
                handleClose();
            }
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลไอเทม');
            console.error(err);
            handleClose();
        } finally {
            setLoading(false);
        }
    }, [category, itemId, handleClose]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    const sendTelegramNotification = async (logData) => {
        try {
            // Map the logData to the format expected by the backend
            const notificationData = {
                type: logData.action,
                user: logData.user,
                itemName: logData.itemName,
                quantity: logData.quantity,
                unit: item?.unit,
                details: logData.reason
            };
            // The backend is now running on port 4001
            await axios.post('http://localhost:4001/notify', notificationData);
        } catch (error) {
            console.error("Failed to send Telegram notification:", error);
            // We don't show a toast here to not confuse the user,
            // as the main operation (Firestore update) was successful.
        }
    };

    const handleConfirm = async () => {
        const requestedQuantity = Number(quantity);

        if (reason.trim() === '') {
            toast.error('กรุณากรอกเหตุผล');
            return;
        }
        if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
            toast.error('กรุณาใส่จำนวนที่ถูกต้อง (มากกว่า 0)');
            return;
        }
        if (item.quantity < requestedQuantity) {
            toast.error('สินค้าคงเหลือไม่เพียงพอ');
            return;
        }

        const toastId = toast.loading(`กำลังทำรายการ${actionName}...`);

        try {
            const batch = writeBatch(db);

            const itemRef = doc(db, category, itemId);
            const newQuantity = item.quantity - requestedQuantity;
            batch.update(itemRef, { quantity: newQuantity });

            const historyRef = doc(collection(db, 'history'));
            const historyEntry = {
                action: actionName,
                itemId: item.id,
                itemName: item.name,
                category: category,
                quantity: requestedQuantity,
                reason: reason.trim(),
                user: user.displayName || user.email,
                userId: user.uid,
                timestamp: new Date(),
            };
            batch.set(historyRef, historyEntry);

            await batch.commit();

            toast.success('ทำรายการสำเร็จ!', { id: toastId });
            
            // --- Send notification AFTER successful DB commit ---
            await sendTelegramNotification(historyEntry);
            
            handleClose();

        } catch (err) {
            toast.error(`เกิดข้อผิดพลาด: ${err.message}`, { id: toastId });
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 3, maxWidth: 500 }}>
                <CircularProgress />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 4, pt: 3, width: '90%', maxWidth: '500px', borderRadius: '20px', bgcolor: '#3c3c3c', color: 'white', border: '1px solid #555' }}>
            <Typography variant="h5" component="h2" sx={{ mb: 2, textAlign: 'center', fontWeight: 'bold' }}>
                {title}
            </Typography>

            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
                 <Typography sx={{ mb: 0.5 }}>
                    <strong>ผู้ดำเนินการ:</strong> {user.displayName || user.email}
                </Typography>
                <Typography >
                    <strong>ชื่อรายการ:</strong> {item?.name}
                </Typography>
                <Typography sx={{ color: '#ffcdd2' }}>
                    <strong>จำนวนคงเหลือ:</strong> {item?.quantity} {item?.unit || 'ชิ้น'}
                </Typography>
            </Box>
            
            <TextField
                label="จำนวนที่ต้องการเบิก"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{ inputProps: { min: 1, max: item?.quantity } }}
            />

            <TextField
                label="เหตุผล *"
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant="outlined" color="secondary" onClick={handleClose}>ยกเลิก</Button>
                <Button variant="contained" color="primary" onClick={handleConfirm}>{confirmButtonText}</Button>
            </Box>
        </Paper>
    );
};

export default ItemDetails;
