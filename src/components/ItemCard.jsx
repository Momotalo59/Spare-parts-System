
import React from 'react';
import { Card, CardMedia, Typography, Box, Button, Tooltip } from '@mui/material';
import { QrCode2 } from '@mui/icons-material';

const ItemCard = ({ item, userData, category, onWithdrawClick, onRefillClick, onReturnClick, onEditClick, onDeleteClick, onQRCodeClick }) => {

    const isTool = category === 'tools';
    const userRole = userData?.role;
    const currentUserUID = userData?.uid;

    // --- RENDER CORRECT CARD BASED ON CATEGORY ---
    if (isTool) {
        return <ToolCard item={item} userRole={userRole} currentUserUID={currentUserUID} onWithdrawClick={onWithdrawClick} onReturnClick={onReturnClick} onEditClick={onEditClick} onDeleteClick={onDeleteClick} onQRCodeClick={onQRCodeClick} />;
    } else {
        return <StandardCard item={item} userRole={userRole} category={category} onWithdrawClick={onWithdrawClick} onRefillClick={onRefillClick} onEditClick={onEditClick} onDeleteClick={onDeleteClick} onQRCodeClick={onQRCodeClick} />;
    }
};

// --- COMPONENT FOR TOOLS ---
const ToolCard = ({ item, userRole, currentUserUID, onWithdrawClick, onReturnClick, onEditClick, onDeleteClick, onQRCodeClick }) => {
    const totalQuantity = item.quantity || 1; // Assume 1 if not specified
    const borrowedCount = item.borrowed || 0;
    const availableCount = totalQuantity - borrowedCount;
    
    const isBorrowedByCurrentUser = item.borrowedBy && item.borrowedBy.includes(currentUserUID);
    const isUnavailable = availableCount <= 0 && !isBorrowedByCurrentUser;

    const handleMainButtonClick = () => {
        if (isBorrowedByCurrentUser) {
            onReturnClick(item);
        } else {
            onWithdrawClick(item);
        }
    };

    return (
        <Card sx={toolCardStyle}>
             <Box sx={{...imageWrapperStyle, borderBottom: '1px solid #444'}}>
                <CardMedia component="img" image={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} sx={imageStyle}/>
                <Tooltip title="แสดง QR Code"><QrCode2 sx={{ position: 'absolute', top: 12, right: 12, fontSize: '2.2rem', color: '#555', opacity: 0.6, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '6px', p: '5px', transition: 'opacity 0.2s', '&:hover': { opacity: 1, color: '#000' } }} onClick={() => onQRCodeClick(item)} /></Tooltip>
            </Box>
            <Box sx={contentWrapperStyle}>
                <Box>
                    <Tooltip title={item.name} placement="top-start"><Typography sx={{...itemNameStyle, fontSize: '1.1rem', mb: 1.5, color: '#f1f1f1'}}>{item.name}</Typography></Tooltip>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                        <Typography sx={{...stockInfoStyle, backgroundColor: '#27ae60'}}>มี: {availableCount}/{totalQuantity}</Typography>
                        <Typography sx={{...stockInfoStyle, backgroundColor: '#7f8c8d'}}>ยืม: {borrowedCount}</Typography>
                    </Box>
                </Box>
                <Box>
                    <Button 
                        fullWidth 
                        variant="contained" 
                        sx={{
                            ...toolMainButtonStyle,
                            backgroundColor: isBorrowedByCurrentUser ? '#8e44ad' : '#f39c12',
                            mb: 1.5, 
                            '&:hover': { 
                                backgroundColor: isBorrowedByCurrentUser ? '#9b59b6' : '#e67e22' 
                            },
                            '&.Mui-disabled': {
                                backgroundColor: '#555',
                                color: '#888',
                                boxShadow: 'none'
                            }
                        }} 
                        onClick={handleMainButtonClick}
                        disabled={isUnavailable}
                    >
                        {isBorrowedByCurrentUser ? 'คืน' : 'ยืม'}
                    </Button>
                    {userRole === 'admin' && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            <Button variant="contained" sx={{ ...toolSmallButtonStyle, backgroundColor: '#3498db', '&:hover': { backgroundColor: '#2980b9' } }} onClick={() => onEditClick(item)}>แก้ไข</Button>
                            <Button variant="contained" sx={{ ...toolSmallButtonStyle, backgroundColor: '#e74c3c', '&:hover': { backgroundColor: '#c0392b' } }} onClick={() => onDeleteClick(item)}>ลบ</Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </Card>
    );
};

// --- COMPONENT FOR SPARE PARTS & SAFETY ITEMS ---
const StandardCard = ({ item, userRole, category, onWithdrawClick, onRefillClick, onEditClick, onDeleteClick, onQRCodeClick }) => {
    const getStockChipProperties = (quantity) => {
        const numQuantity = Number(quantity) || 0;
        if (numQuantity >= 5) return { label: `คงเหลือ: ${numQuantity}`, color: '#28a745' };
        if (numQuantity > 0) return { label: `ใกล้หมด: ${numQuantity}`, color: '#ffc107' };
        return { label: 'หมด', color: '#dc3545' };
    };

    const stockChip = getStockChipProperties(item.quantity);
    const isItemUnavailable = (Number(item.quantity) || 0) === 0;

    return (
        <Card sx={originalCardStyle}>
            <Box sx={imageWrapperStyle}>
                <CardMedia component="img" image={item.imageUrl || 'https://via.placeholder.com/300'} alt={item.name} sx={imageStyle} />
                <Tooltip title="แสดง QR Code"><QrCode2 sx={{ position: 'absolute', top: 10, right: 10, fontSize: '2rem', color: '#444', opacity: 0.5, cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '5px', p: '4px', '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,1)' } }} onClick={() => onQRCodeClick(item)} /></Tooltip>
            </Box>
            <Box sx={contentWrapperStyle}>
                <Box>
                    <Tooltip title={item.name} placement="top-start"><Typography sx={{...itemNameStyle, height: '1.4rem', mb: 2, WebkitLineClamp: 1, WebkitBoxOrient: 'vertical'}}>{item.name}</Typography></Tooltip>
                    <Box sx={{ display: 'inline-block', py: 0.8, px: 2.5, backgroundColor: stockChip.color, borderRadius: '50px', color: stockChip.color === '#ffc107' ? 'black' : 'white', fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center'}}>{stockChip.label}</Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                    {userRole === 'admin' ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                            <Button variant="contained" sx={{ ...originalAdminButtonStyle, backgroundColor: '#28a745', '&:hover': { backgroundColor: '#218838' } }} onClick={() => onWithdrawClick(item)} disabled={isItemUnavailable}>เบิก</Button>
                            <Button variant="contained" sx={{ ...originalAdminButtonStyle, backgroundColor: '#fd7e14', '&:hover': { backgroundColor: '#e66a00' } }} onClick={() => onRefillClick(item)}>เติม</Button>
                            <Button variant="contained" sx={{ ...originalAdminButtonStyle, backgroundColor: '#0d6efd', '&:hover': { backgroundColor: '#0b5ed7' } }} onClick={() => onEditClick(item)}>แก้ไข</Button>
                            <Button variant="contained" sx={{ ...originalAdminButtonStyle, backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }} onClick={() => onDeleteClick(item)}>ลบ</Button>
                        </Box>
                    ) : (
                        <Button fullWidth variant="contained" sx={{ ...originalAdminButtonStyle, backgroundColor: '#28a745', fontSize: '1.2rem', py: 1.4, '&:hover': { backgroundColor: '#218838' } }} onClick={() => onWithdrawClick(item)} disabled={isItemUnavailable}>เบิก</Button>
                    )}
                </Box>
            </Box>
        </Card>
    );
}

// --- STYLES (SHARED AND SPECIFIC) ---
const imageWrapperStyle = { height: '200px', position: 'relative', backgroundColor: 'white', padding: '16px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imageStyle = { objectFit: 'contain', width: '100%', maxHeight: '100%' };
const contentWrapperStyle = { p: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 };
const itemNameStyle = { fontFamily: 'Kanit', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const stockInfoStyle = { py: 0.6, px: 2, borderRadius: '8px', fontFamily: 'Kanit', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' };

const originalCardStyle = { display: 'flex', flexDirection: 'column', height: '440px', backgroundColor: '#343a40', borderRadius: '16px', color: 'white', fontFamily: 'Kanit, sans-serif', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.125)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)' } };
const originalAdminButtonStyle = { fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '12px', color: 'white', width: '100%', py: 1.2, fontSize: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'background-color 0.2s ease' };

const toolCardStyle = { height: '440px', display: 'flex', flexDirection: 'column', backgroundColor: '#2b2b2b', borderRadius: '16px', color: 'white', fontFamily: 'Kanit, sans-serif', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)' } };
const toolMainButtonStyle = { fontFamily: 'Kanit', fontWeight: 'bold', textTransform: 'none', borderRadius: '12px', color: 'white', width: '100%', py: 1.3, fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'background-color 0.2s ease, box-shadow 0.2s ease' };
const toolSmallButtonStyle = { ...toolMainButtonStyle, py: 1, fontSize: '1rem' };

export default ItemCard;
