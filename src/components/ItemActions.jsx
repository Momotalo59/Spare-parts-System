
import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';

import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    CircularProgress
} from '@mui/material';
import BorrowReturnDialog from './BorrowReturnDialog';

const functions = getFunctions();
const notifyTelegram = httpsCallable(functions, 'notifyTelegram');

// CORRECT: Accept the final 'user' prop that has been passed down
const ItemActions = ({ item, category, user, userRole, onSuccess }) => {

    const [isBorrowReturnOpen, setIsBorrowReturnOpen] = useState(false);
    const [actionType, setActionType] = useState('');
    const [simpleDialog, setSimpleDialog] = useState({ open: false, type: null });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editData, setEditData] = useState({});
    const [quantity, setQuantity] = useState(1);

    const handlePrettyDialogOpen = (type) => {
        setActionType(type);
        setIsBorrowReturnOpen(true);
    };

    const handleDialogSuccess = async (data) => {
        setIsBorrowReturnOpen(false);
        await notifyTelegram({
            type: data.type === 'เบิก/ยืม' ? 'withdraw' : 'return',
            itemName: data.itemName,
            quantityChanged: data.type === 'เบิก/ยืม' ? -data.quantity : +data.quantity,
            user: data.user,
            reason: data.details,
        });
        if (onSuccess) onSuccess();
    };

    const handleSimpleOpen = (type) => {
        if (type === 'edit') {
            setEditData({ name: item.name, imageUrl: item.imageUrl, quantity: item.quantity, unit: item.unit });
        }
        setQuantity(1);
        setSimpleDialog({ open: true, type: type });
    };

    const handleSimpleClose = () => {
        if (isSubmitting) return;
        setSimpleDialog({ open: false, type: null });
        setTimeout(() => setEditData({}), 300);
    };

    const handleSimpleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const docRef = doc(db, category, item.id);
            const updaterName = user?.displayName || user?.email || 'N/A';
            let notificationPayload = { user: updaterName };

            if (simpleDialog.type === 'edit') {
                const updatedData = { ...editData, lastUpdated: serverTimestamp(), updater: updaterName };
                if (category !== 'tools') updatedData.quantity = Number(editData.quantity);
                await updateDoc(docRef, updatedData);
                notificationPayload = { ...notificationPayload, type: 'edit', itemName: item.name, newItemName: updatedData.name };
            } else if (simpleDialog.type === 'delete') {
                await deleteDoc(docRef);
                notificationPayload = { ...notificationPayload, type: 'delete', itemName: item.name };
            } else if (simpleDialog.type === 'refill') {
                const numQuantity = Number(quantity);
                if (numQuantity <= 0 || !Number.isInteger(numQuantity)) throw new Error('กรุณากรอกจำนวนเต็มบวก');
                const newQuantity = (item.quantity || 0) + numQuantity;
                await updateDoc(docRef, { quantity: newQuantity, lastUpdated: serverTimestamp(), updater: updaterName });
                notificationPayload = { ...notificationPayload, type: 'refill', itemName: item.name, quantityChanged: +numQuantity, newQuantity };
            }
            
            await notifyTelegram(notificationPayload);
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(`Error during ${simpleDialog.type}:`, error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setIsSubmitting(false);
            handleSimpleClose();
        }
    };

    // --- STYLES & RENDER ---
    const gridButtonSx = (color, hoverColor) => ({
        fontFamily: 'Kanit',
        color: 'white',
        borderRadius: '12px',
        // CORRECT: Increased font size and font weight for visibility
        fontSize: '1rem', 
        fontWeight: 'bold', 
        padding: '6px 0', // Adjusted padding slightly for the new font size
        textTransform: 'none',
        backgroundColor: color,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': { backgroundColor: hoverColor, transform: 'translateY(-1px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
        '&.Mui-disabled': { backgroundColor: '#555', color: '#888', boxShadow: 'none' }
    });

    // ... renderSimpleDialogContent and getSimpleDialogTitle are unchanged ...
    const renderSimpleDialogContent = () => {
        switch (simpleDialog.type) {
            case 'refill':
                return <>
                    <DialogContentText>คงเหลือปัจจุบัน: {item.quantity}</DialogContentText>
                    <TextField autoFocus margin="dense" label="จำนวนที่เติม" type="number" fullWidth variant="standard" defaultValue={1} onChange={e => setQuantity(e.target.value)} />
                </>;
            case 'edit':
                return <>
                    <TextField margin="dense" label="ชื่อ" type="text" fullWidth variant="standard" value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                    {category !== 'tools' && <TextField margin="dense" label="จำนวน" type="number" fullWidth variant="standard" value={editData.quantity === undefined ? item.quantity : editData.quantity} onChange={e => setEditData({ ...editData, quantity: e.target.value })} />}
                    <TextField margin="dense" label="หน่วย (เช่น ชิ้น, แผ่น)" type="text" fullWidth variant="standard" value={editData.unit || ''} onChange={e => setEditData({ ...editData, unit: e.target.value })} />
                    <TextField margin="dense" label="URL รูปภาพ" type="text" fullWidth variant="standard" value={editData.imageUrl || ''} onChange={e => setEditData({ ...editData, imageUrl: e.target.value })} />
                </>;
            case 'delete':
                return <DialogContentText>ยืนยันการลบ "{item.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้</DialogContentText>;
            default: return null;
        }
    }

    const getSimpleDialogTitle = () => {
        const titles = { refill: 'เติมสต็อก', edit: 'แก้ไข', delete: 'ลบ' };
        return `${titles[simpleDialog.type] || 'ยืนยัน'}: ${item.name}`;
    }

    // If user object is not yet available (during initial load), show a placeholder.
    if (!user) {
        return <Box sx={{ p: 1, minHeight: '84px' }}><CircularProgress size={24}/></Box>;
    }

    // --- MAIN RENDER LOGIC ---
    if (userRole !== 'admin') {
        return (
             <Box sx={{ p: 1 }}>
                <Button 
                    fullWidth 
                    onClick={() => handlePrettyDialogOpen(item.status === 'ว่าง' ? (category === 'tools' ? 'borrow' : 'borrow') : 'return')}
                    disabled={category === 'tools' && item.status !== 'ว่าง' && item.borrower !== user?.displayName}
                    sx={gridButtonSx(item.status === 'ว่าง' ? (category === 'tools' ? '#ff9800' : '#4caf50') : '#9e9e9e', item.status === 'ว่าง' ? (category === 'tools' ? '#ffa726' : '#66bb6a') : '#bdbdbd')}
                >
                    {category === 'tools' ? (item.status === 'ว่าง' ? 'ยืม' : 'คืน') : 'เบิก'}
                </Button>
             </Box>
        );
    }

    // ADMIN VIEW
    return (
        <>
            <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {category === 'tools' ? (
                    <>
                        <Button onClick={() => handlePrettyDialogOpen(item.status === 'ว่าง' ? 'borrow' : 'return')} sx={{ ...gridButtonSx(item.status === 'ว่าง' ? '#ff9800' : '#6c757d', '#ffa726'), py: 1.5 }} disabled={isSubmitting}>
                            {item.status === 'ว่าง' ? 'ยืม' : 'คืน'}
                        </Button>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                            <Button onClick={() => handleSimpleOpen('edit')} sx={gridButtonSx('#2196f3', '#42a5f5')}>แก้ไข</Button>
                            <Button onClick={() => handleSimpleOpen('delete')} sx={gridButtonSx('#f44336', '#ef5350')}>ลบ</Button>
                        </Box>
                    </>
                ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Button onClick={() => handlePrettyDialogOpen('borrow')} sx={gridButtonSx('#4caf50', '#66bb6a')} disabled={item.quantity <= 0}>เบิก</Button>
                        <Button onClick={() => handleSimpleOpen('refill')} sx={gridButtonSx('#ff9800', '#ffa726')}>เติม</Button>
                        <Button onClick={() => handleSimpleOpen('edit')} sx={gridButtonSx('#2196f3', '#42a5f5')}>แก้ไข</Button>
                        <Button onClick={() => handleSimpleOpen('delete')} sx={gridButtonSx('#f44336', '#ef5350')}>ลบ</Button>
                    </Box>
                )}
            </Box>

            {isBorrowReturnOpen && (
                 <BorrowReturnDialog
                    item={item}
                    open={isBorrowReturnOpen}
                    onClose={() => setIsBorrowReturnOpen(false)}
                    onSuccess={handleDialogSuccess}
                    user={user} // Pass the full user object
                    actionType={actionType}
                />
            )}

            <Dialog open={simpleDialog.open} onClose={handleSimpleClose} PaperProps={{ sx: { borderRadius: '16px', width: '100%', maxWidth: '400px' } }}>
                 <DialogTitle sx={{ fontFamily: 'Kanit', fontWeight: 'bold' }}>{getSimpleDialogTitle()}</DialogTitle>
                 <DialogContent>{renderSimpleDialogContent()}</DialogContent>
                 <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleSimpleClose} disabled={isSubmitting} variant='outlined' sx={{ fontFamily: 'Kanit' }}>ยกเลิก</Button>
                    <Button onClick={handleSimpleSubmit} disabled={isSubmitting} variant='contained' sx={{ fontFamily: 'Kanit' }}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'ยืนยัน'}
                    </Button>
                 </DialogActions>
            </Dialog>
        </>
    );
};

export default ItemActions;
