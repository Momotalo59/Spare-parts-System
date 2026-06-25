
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, CircularProgress, Tabs, Tab, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import ItemList from '../components/ItemList';
import AdminPanel from '../components/AdminPanel';
import AddItemDialog from '../components/AddItemDialog';

function a11yProps(index) {
  return {
    id: `category-tab-${index}`,
    'aria-controls': `category-tabpanel-${index}`,
  };
}

const Dashboard = ({ userData }) => {
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddItemDialogOpen, setAddItemDialogOpen] = useState(false);

  const collections = ['parts', 'tools', 'safetys'];
  const placeholders = ['ค้นหาในรายการอะไหล่...', 'ค้นหาในรายการเครื่องมือ...', 'ค้นหาในอุปกรณ์เซฟตี้...'];

  useEffect(() => {
    setItemsLoading(true);
    const currentCollection = collections[tabValue];

    const q = query(collection(db, currentCollection));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      itemsArray.sort((a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name, 'th-u-co-trad');
        }
        return 0;
      });

      setItems(itemsArray);
      setItemsLoading(false);
    }, (error) => {
      console.error(`Error fetching ${currentCollection}:`, error);
      setItems([]);
      setItemsLoading(false);
    });

    return () => unsubscribe();
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchTerm('');
  };
  
  const handleOpenAddItemDialog = () => {
    setAddItemDialogOpen(true);
  };

  const handleCloseAddItemDialog = () => {
    setAddItemDialogOpen(false);
  };

  const filteredItems = items.filter(item =>
    item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentCategory = collections[tabValue];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ maxWidth: '1000px', mx: 'auto', mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={placeholders[tabValue]}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9E9E9E', ml: 1 }} />
              </InputAdornment>
            ),
            style: {
              borderRadius: '9999px', 
              color: '#E0E0E0',
              fontFamily: 'Kanit',
            },
          }}
          sx={{
            mb: userData?.role === 'admin' ? 3 : 0,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#2E2E2E',
              height: '52px',
              transition: 'box-shadow 0.3s ease-in-out',
              '& fieldset': {
                borderRadius: '9999px',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                transition: 'border-color 0.3s ease-in-out',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(160, 118, 249, 0.7)',
              },
              '&.Mui-focused': {
                boxShadow: `0 0 8px rgba(160, 118, 249, 0.7)`,
                '& fieldset': {
                  borderColor: '#A076F9',
                },
              },
            },
          }}
        />

        {userData?.role === 'admin' && (
          <Box sx={{ p: 2, mt: 2, borderRadius: '16px', bgcolor: '#2E2E2E' }}>
            <AdminPanel onAddItemClick={handleOpenAddItemDialog} />
          </Box>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Item categories tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#A076F9', height: '4px', borderRadius: '2px' },
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontFamily: 'Kanit', textTransform: 'none', fontSize: '1rem' },
            '& .Mui-selected': { color: '#FFFFFF' },
          }}
        >
          <Tab label="รายการอะไหล่" {...a11yProps(0)} />
          <Tab label="รายการเครื่องมือ" {...a11yProps(1)} />
          <Tab label="อุปกรณ์เซฟตี้" {...a11yProps(2)} />
        </Tabs>
      </Box>

      {itemsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <ItemList 
            items={filteredItems} 
            userData={userData} 
            category={currentCategory} 
            searchQuery={searchTerm} />
      )}
      
      <AddItemDialog
        open={isAddItemDialogOpen}
        onClose={handleCloseAddItemDialog}
        category={currentCategory}
        userData={userData}
      />
    </Box>
  );
};

export default Dashboard;
