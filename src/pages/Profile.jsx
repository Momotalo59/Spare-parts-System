import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext'; // Import and use our central auth context
import { Box, Typography, Button, CircularProgress, Paper, Divider, List, ListItem, ListItemText, Container } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

const Profile = () => {
  const { userProfile, loading: loadingAuth } = useAuth(); // Get user profile from context
  const [borrowedItems, setBorrowedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBorrowedItems = async () => {
      // Ensure we have the user profile before fetching their items
      if (!userProfile?.uid) return;
      
      setLoadingItems(true);
      try {
        // Fetch borrowed items from 'tools' collection based on the user's UID
        const q = query(collection(db, 'tools'), where("borrowerId", "==", userProfile.uid));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBorrowedItems(items);
      } catch (error) {
        console.error("Error fetching borrowed items: ", error);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchBorrowedItems();
  }, [userProfile]); // Rerun when the user profile is available

  // The main loading state now depends on both auth and item fetching
  if (loadingAuth || loadingItems) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ pt: 8 }}>
      <Paper elevation={3} sx={{ p: {xs: 2, sm: 4}, backgroundColor: '#2d2d2d', borderRadius: '16px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            โปรไฟล์ของฉัน
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            startIcon={<ArrowBack />}
            sx={{ backgroundColor: '#424242', '&:hover': { backgroundColor: '#555' } }}
          >
            กลับหน้าหลัก
          </Button>
        </Box>

        <Divider sx={{ mb: 3, backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {userProfile && (
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Typography>
              <span style={{ color: 'rgba(255,255,255,0.7)' }}>ชื่อ-นามสกุล:</span> {userProfile.displayName}
            </Typography>
            <Typography>
               <span style={{ color: 'rgba(255,255,255,0.7)' }}>รหัสพนักงาน:</span> {userProfile.employeeId}
            </Typography>
          </Box>
        )}
        
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          รายการที่ฉันยืมอยู่
        </Typography>

        {borrowedItems.length === 0 ? (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', backgroundColor: '#333', borderRadius: '8px' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>คุณยังไม่มียืมอุปกรณ์ใดๆ</Typography>
          </Paper>
        ) : (
          <List sx={{ backgroundColor: '#333', borderRadius: '8px', p: 0 }}>
            {borrowedItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemText 
                      primary={<Typography sx={{fontWeight: 'bold'}}>{item.name}</Typography>}
                      secondary={item.borrowDate && <Typography sx={{color: 'rgba(255,255,255,0.5)'}}>{`ยืมเมื่อ: ${item.borrowDate.toDate().toLocaleDateString('th-TH')}`}</Typography>}
                  />
                </ListItem>
                {index < borrowedItems.length - 1 && <Divider component="li" sx={{backgroundColor: 'rgba(255,255,255,0.12)'}} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;
