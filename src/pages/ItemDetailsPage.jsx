
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, CircularProgress, Container, Paper, Button, AppBar, Toolbar, IconButton, Grid, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useAuth from '../hooks/useAuth';
import ItemActions from '../components/ItemActions'; // Import the actions component
import BorrowReturnDialog from '../components/BorrowReturnDialog'; // Import dialog for actions
import HistoryLog from '../components/HistoryLog'; // To show history

const ItemDetailsPage = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Hook to get current user status

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isActionDialogOpen, setActionDialogOpen] = useState(false);
    const [actionType, setActionType] = useState('borrow'); // 'borrow' or 'return'
    const [isHistoryOpen, setHistoryOpen] = useState(false);

    const fetchItem = async () => {
        setLoading(true);
        setError('');
        const categories = ['parts', 'tools', 'safetys'];
        let foundItem = null;

        for (const category of categories) {
            const docRef = doc(db, category, itemId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                foundItem = { id: docSnap.id, ...docSnap.data(), category };
                break;
            }
        }

        if (foundItem) {
            setItem(foundItem);
        } else {
            setError('ไม่พบข้อมูลสำหรับรายการนี้ในฐานข้อมูล');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (itemId) {
            fetchItem();
        }
    }, [itemId]);

    const handleOpenActionDialog = (type) => {
        setActionType(type);
        setActionDialogOpen(true);
    };

    const handleOpenHistory = () => {
        setHistoryOpen(true);
    };

    const handleItemUpdate = () => {
        fetchItem(); // Refetch item data after an update
    };

    const getCategoryDisplayName = (category) => {
        const names = { parts: 'พัสดุ', tools: 'เครื่องมือ', safetys: 'อุปกรณ์นิรภัย' };
        return names[category] || category;
    };

    // Render loading state
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Render error state
    if (error) {
        return (
            <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="h5" color="error">{error}</Typography>
                 <Button variant="contained" onClick={() => navigate(user ? '/' : '/login')} sx={{mt: 2}}>
                    {user ? 'กลับสู่หน้าหลัก' : 'ไปที่หน้าล็อกอิน'}
                </Button>
            </Box>
        );
    }

    // Render item details
    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            <AppBar position="static" sx={{ backgroundColor: '#2d2d2d' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => navigate(user ? '/' : '/login')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: 'Kanit' }}>
                        รายละเอียดพัสดุ
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 4 }}>
                {item && (
                    <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: '16px', backgroundColor: '#2d2d2d', color: '#fff' }}>
                        <Grid container spacing={{ xs: 2, md: 4 }}>
                            {item.imageUrl && (
                                <Grid item xs={12} md={5}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <img src={item.imageUrl} alt={item.name} style={{ width: '100%', borderRadius: '12px' }} />
                                    </Box>
                                </Grid>
                            )}
                            <Grid item xs={12} md={7}>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontFamily: 'Kanit' }}>{item.name}</Typography>
                                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }}/>
                                <Typography sx={{ mb: 1.5 }}><strong>รหัส:</strong> {item.id}</Typography>
                                <Typography sx={{ mb: 1.5 }}><strong>หมวดหมู่:</strong> {getCategoryDisplayName(item.category)}</Typography>
                                <Typography sx={{ mb: 1.5 }}><strong>คงเหลือ:</strong> 
                                    <Typography component="span" sx={{ color: item.quantity > 5 ? '#66bb6a' : '#ffa726', fontWeight: 'bold', ml: 1 }}>
                                        {item.quantity} {item.unit}
                                    </Typography>
                                </Typography>
                                <Typography sx={{ mb: 1.5 }}><strong>ที่จัดเก็บ:</strong> {item.location || '-'}</Typography>
                                {item.description && <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.8)' }}>{item.description}</Typography>}
                            </Grid>
                        </Grid>

                        {/* Action buttons for logged-in users */}
                        {user && (
                            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                                <ItemActions
                                    item={item}
                                    onBorrow={() => handleOpenActionDialog('borrow')}
                                    onReturn={() => handleOpenActionDialog('return')}
                                    onHistory={handleOpenHistory}
                                />
                            </Box>
                        )}
                    </Paper>
                )}
            </Container>

            {/* Dialogs for actions - only mounted when needed */}
            {item && (
                <BorrowReturnDialog
                    key={`${actionType}-${item.id}`}
                    open={isActionDialogOpen}
                    onClose={() => setActionDialogOpen(false)}
                    item={item}
                    actionType={actionType}
                    user={user}
                    onSuccess={handleItemUpdate} 
                />
            )}
            {item && (
                 <HistoryLog 
                    open={isHistoryOpen} 
                    onClose={() => setHistoryOpen(false)} 
                    itemId={item.id} 
                />
            )}
        </Box>
    );
};

export default ItemDetailsPage;
