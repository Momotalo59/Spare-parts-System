
import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import ItemCard from './ItemCard';
import WithdrawDialog from './WithdrawDialog';
import RefillDialog from './RefillDialog';
import EditItemDialog from './EditItemDialog';
import DeleteItemDialog from './DeleteItemDialog';
import QRCodeDialog from './QRCodeDialog';
import ReturnDialog from './ReturnDialog'; // Import ReturnDialog

const ItemList = ({ items, loading, searchQuery, onUpdate, userData, category }) => {
  const [isWithdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [isRefillDialogOpen, setRefillDialogOpen] = useState(false);
  const [isReturnDialogOpen, setReturnDialogOpen] = useState(false); // State for ReturnDialog
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isQRCodeDialogOpen, setQRCodeDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const userRole = userData?.role;
  const displayName = userData?.displayName;

  const handleOpenDialog = (setter) => (item) => {
    setSelectedItem(item);
    setter(true);
  };

  const handleCloseDialog = (setter) => () => {
    setSelectedItem(null);
    setter(false);
    if (onUpdate) onUpdate();
  };

  const handleOpenWithdrawDialog = handleOpenDialog(setWithdrawDialogOpen);
  const handleCloseWithdrawDialog = handleCloseDialog(setWithdrawDialogOpen);
  
  const handleOpenRefillDialog = handleOpenDialog(setRefillDialogOpen);
  const handleCloseRefillDialog = handleCloseDialog(setRefillDialogOpen);

  const handleOpenReturnDialog = handleOpenDialog(setReturnDialogOpen);
  const handleCloseReturnDialog = handleCloseDialog(setReturnDialogOpen);

  const handleOpenEditDialog = handleOpenDialog(setEditDialogOpen);
  const handleCloseEditDialog = handleCloseDialog(setEditDialogOpen);

  const handleOpenDeleteDialog = handleOpenDialog(setDeleteDialogOpen);
  const handleCloseDeleteDialog = handleCloseDialog(setDeleteDialogOpen);

  const handleOpenQRCodeDialog = handleOpenDialog(setQRCodeDialogOpen);
  const handleCloseQRCodeDialog = handleCloseDialog(setQRCodeDialogOpen);

  const filteredItems = items.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: {
              xs: 'repeat(2, 1fr)', // Changed to 2 columns for mobile
              sm: 'repeat(3, 1fr)', // Adjusted for consistency
              md: 'repeat(4, 1fr)', 
              lg: 'repeat(5, 1fr)',
          },
        }}
      >
        {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                userData={userData}
                category={category}
                onWithdrawClick={() => handleOpenWithdrawDialog(item)}
                onRefillClick={() => handleOpenRefillDialog(item)}
                onReturnClick={() => handleOpenReturnDialog(item)} // Pass return handler
                onEditClick={() => handleOpenEditDialog(item)}
                onDeleteClick={() => handleOpenDeleteDialog(item)}
                onQRCodeClick={() => handleOpenQRCodeDialog(item)}
              />
            ))
        ) : (
          <Typography sx={{textAlign: 'center', color: 'rgba(255,255,255,0.7)', mt: 5, gridColumn: '1 / -1', fontFamily: 'Kanit'}}>
              {searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : `ไม่มีรายการในหมวดหมู่นี้`}
          </Typography>
        )}
      </Box>

      {/* Render Dialogs */}
      {selectedItem && <WithdrawDialog open={isWithdrawDialogOpen} onClose={handleCloseWithdrawDialog} item={selectedItem} displayName={displayName} category={category} />}
      {selectedItem && <RefillDialog open={isRefillDialogOpen} onClose={handleCloseRefillDialog} item={selectedItem} displayName={displayName} category={category} />}
      {selectedItem && <ReturnDialog open={isReturnDialogOpen} onClose={handleCloseReturnDialog} item={selectedItem} user={userData} />}
      {selectedItem && <EditItemDialog open={isEditDialogOpen} onClose={handleCloseEditDialog} item={selectedItem} category={category} displayName={displayName} />}
      {selectedItem && <DeleteItemDialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog} item={selectedItem} category={category} displayName={displayName} onConfirm={handleCloseDeleteDialog} />}
      {selectedItem && <QRCodeDialog open={isQRCodeDialogOpen} onClose={handleCloseQRCodeDialog} item={selectedItem} category={category} />}

    </Box>
  );
};

export default ItemList;
