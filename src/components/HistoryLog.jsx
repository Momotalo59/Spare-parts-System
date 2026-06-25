import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { 
    Box, Button, Typography, TextField, Paper, TablePagination, CircularProgress, 
    IconButton, FormControl, InputLabel, Select, MenuItem, Grid, Chip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import GetAppIcon from '@mui/icons-material/GetApp';

const HistoryLog = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filter, setFilter] = useState('ทั้งหมด');

  const [selectedMonth, setSelectedMonth] = useState('ทั้งหมด');
  const [selectedYear, setSelectedYear] = useState('ทั้งหมด');
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "transactions"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let historyData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        };
      });

      setHistory(historyData);
      const years = ['ทั้งหมด', ...Array.from(new Set(historyData.map(item => item.timestamp.getFullYear()))).sort((a, b) => b - a)];
      setAvailableYears(years);

      setLoading(false);
    }, (error) => {
      console.error("Error fetching history: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = history;
    const typeMap = {
        'เบิก': ['เบิก', 'withdraw'],
        'ยืม': ['ยืม', 'เบิก/ยืม'],
        'คืน': ['คืน'],
        'เพิ่มรายการ': ['เพิ่มรายการ', 'เพิ่มรายการใหม่'],
        'แก้ไข': ['แก้ไข', 'แก้ไขรายการ'],
        'ลบ': ['ลบ', 'ลบรายการ'],
        'เติมสต็อก': ['เติมสต็อก']
    };

    if (filter !== 'ทั้งหมด') {
      result = result.filter(item => typeMap[filter]?.includes(item.type));
    }

    if (selectedYear !== 'ทั้งหมด') {
        result = result.filter(item => item.timestamp.getFullYear() === selectedYear);
    }

    if (selectedMonth !== 'ทั้งหมด') {
        result = result.filter(item => item.timestamp.getMonth() + 1 === selectedMonth);
    }

    if (searchTerm) {
      result = result.filter(item =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHistory(result);
    setPage(0);
  }, [searchTerm, filter, selectedMonth, selectedYear, history]);

    const getTypeLabel = (type) => {
        const typeMappings = {
            'withdraw': 'เบิก', 'เบิก': 'เบิก',
            'ยืม': 'ยืม', 'เบิก/ยืม': 'ยืม',
            'คืน': 'คืน', 
            'เติมสต็อก': 'เติมสต็อก', 
            'เพิ่มรายการ': 'เพิ่มรายการ', 'เพิ่มรายการใหม่': 'เพิ่มรายการ', 
            'แก้ไข': 'แก้ไข', 'แก้ไขรายการ': 'แก้ไข',
            'ลบ': 'ลบ', 'ลบรายการ': 'ลบ'
        };
        return typeMappings[type] || type;
    }

    const getTypeChip = (type) => {
        let label = getTypeLabel(type);
        let style = { fontWeight: 'bold', color: '#fff', fontFamily: 'Kanit', borderRadius: '8px', height: '26px' };

        switch(label) {
            case 'เบิก':
                style.backgroundColor = '#FFA726'; 
                break;
            case 'ยืม':
                style.backgroundColor = '#8E44AD';
                break;
            case 'คืน':
                style.backgroundColor = '#42A5F5';
                break;
            case 'เติมสต็อก':
                 style.backgroundColor = '#66BB6A';
                 break;
            case 'เพิ่มรายการ':
                 style.backgroundColor = '#26A69A';
                 break;
            case 'แก้ไข':
                style.backgroundColor = '#AB47BC';
                break;
            case 'ลบ':
                style.backgroundColor = '#EF5350';
                break;
            default:
                style.backgroundColor = '#78909C';
        }

        return <Chip label={label} size="small" sx={style} />;
    };

    const getFormattedQuantity = (type, quantity) => {
        const label = getTypeLabel(type);
        const numQuantity = Number(quantity);

        if (['คืน', 'เติมสต็อก', 'เพิ่มรายการ'].includes(label)) {
            if (isNaN(numQuantity) || numQuantity === 0) {
                 return { value: '–', color: '#9E9E9E' };
            }
            return { value: `+${Math.abs(numQuantity)}`, color: '#66BB6A' };
        } 
        
        if (['เบิก', 'ยืม'].includes(label)) {
            if (isNaN(numQuantity) || numQuantity === 0) {
                 return { value: '–', color: '#9E9E9E' };
            }
            return { value: `${-Math.abs(numQuantity)}`, color: '#EF5350' };
        } 

        if (['แก้ไข', 'ลบ'].includes(label)) {
            return { value: '–', color: '#9E9E9E' };
        }
        
        return { value: '–', color: '#9E9E9E' };
    };

    const formatQuantity = (type, quantity) => {
        const { value, color } = getFormattedQuantity(type, quantity);
        return <Typography sx={{ color, fontWeight: 'bold', fontFamily: 'Kanit' }}>{value}</Typography>
    }

    const handleExport = () => {
        const headers = ['เวลา', 'รายการ', 'ประเภท', 'จำนวน', 'ผู้ดำเนินการ', 'หมายเหตุ'];
        const csvRows = filteredHistory.map(log => {
            const typeLabel = getTypeLabel(log.type);
            const quantityValue = getFormattedQuantity(log.type, log.quantity).value;
            const row = [
                log.timestamp.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                log.itemName || '',
                typeLabel,
                quantityValue,
                log.user || '–',
                log.details || log.reason || ''
            ];
            return row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
        });
        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ประวัติการทำรายการ_${new Date().toLocaleDateString('th-TH')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  const filterButtons = ['ทั้งหมด', 'เบิก', 'ยืม', 'คืน', 'เติมสต็อก', 'เพิ่มรายการ', 'แก้ไข', 'ลบ'];
  const months = [
      { value: 'ทั้งหมด', label: 'ทุกเดือน' }, { value: 1, label: 'ม.ค.' }, { value: 2, label: 'ก.พ.' },
      { value: 3, label: 'มี.ค.' }, { value: 4, label: 'เม.ย.' }, { value: 5, label: 'พ.ค.' },
      { value: 6, label: 'มิ.ย.' }, { value: 7, label: 'ก.ค.' }, { value: 8, label: 'ส.ค.' },
      { value: 9, label: 'ก.ย.' }, { value: 10, label: 'ต.ค.' }, { value: 11, label: 'พ.ย.' },
      { value: 12, label: 'ธ.ค.' }
  ];

  const formControlStyle = { 
    '& .MuiInputBase-root': { backgroundColor: '#3c3c3c', color: '#fff', borderRadius: '12px' }, 
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, 
    '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Kanit' },
    '& .MuiSelect-icon': { color: 'rgba(255, 255, 255, 0.7)' }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={onBack} sx={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }}><ArrowBackIosNewIcon sx={{ fontSize: '1.2rem' }} /></IconButton>
          <Typography variant="h4" sx={{ fontFamily: 'Kanit', fontWeight: 'bold', color: '#fff' }}>ประวัติการใช้งาน</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
              <TextField
                  label="ค้นหาชื่อไอเทม หรือชื่อผู้ดำเนินการ..."
                  variant="outlined" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  sx={formControlStyle}
              />
          </Grid>
          <Grid item xs={6} md={3}>
              <FormControl fullWidth sx={formControlStyle}>
                  <InputLabel>เลือกเดือน</InputLabel>
                  <Select value={selectedMonth} label="เลือกเดือน" onChange={(e) => setSelectedMonth(e.target.value)} MenuProps={{ PaperProps: { sx: { bgcolor: '#3A3A3C', color: 'white' } } }}>
                      {months.map(month => <MenuItem key={month.value} value={month.value}>{month.label}</MenuItem>)}
                  </Select>
              </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
              <FormControl fullWidth sx={formControlStyle}>
                  <InputLabel>เลือกปี</InputLabel>
                  <Select value={selectedYear} label="เลือกปี" onChange={(e) => setSelectedYear(e.target.value)} MenuProps={{ PaperProps: { sx: { bgcolor: '#3A3A3C', color: 'white' } } }}>
                      {availableYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                  </Select>
              </FormControl>
          </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {filterButtons.map(btn => (
                  <Button key={btn} variant={filter === btn ? 'contained' : 'outlined'} onClick={() => setFilter(btn)} sx={{ fontFamily: 'Kanit', borderRadius: '50px', textTransform: 'none', px: 2.5, py: 0.8, borderColor: filter === btn ? '#8A2BE2' : 'rgba(255, 255, 255, 0.3)', backgroundColor: filter === btn ? '#8A2BE2' : 'transparent', color: '#fff', '&:hover': { backgroundColor: filter === btn ? '#7B1FA2' : 'rgba(255, 255, 255, 0.1)', borderColor: filter === btn ? '#7B1FA2' : '#fff' } }}>
                      {btn}
                  </Button>
              ))}
          </Box>
          <Button variant="contained" startIcon={<GetAppIcon />} onClick={handleExport} sx={{ fontFamily: 'Kanit', textTransform: 'none', backgroundColor: '#1DB954', borderRadius: '12px', px: 3, py: 1.2, '&:hover': { backgroundColor: '#17A44A' } }}>Export to CSV</Button>
      </Box>
      
      {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : (
        <>
          <Box sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)', // Mobile
              sm: 'repeat(3, 1fr)', // Tablet
              lg: 'repeat(5, 1fr)', // PC
            }
          }}>
            {filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
              <Paper key={log.id} sx={{ p: 2, backgroundColor: '#3c3c3c', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#aaa', fontFamily: 'Kanit' }}>
                  {log.timestamp.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit'})}
                </Typography>
                <Typography sx={{ color: '#fff', fontWeight: 'bold', fontFamily: 'Kanit', my: 0.5 }} noWrap>
                  {log.itemName}
                </Typography>
                {getTypeChip(log.type)}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'Kanit', color: '#ddd' }}>จำนวน:</Typography>
                  {formatQuantity(log.type, log.quantity)}
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'Kanit', color: '#ddd', pt:1, borderTop: '1px solid #555', mt:1 }} noWrap>
                  โดย: {log.user || '–'}
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'Kanit', color: '#aaa' }} noWrap>
                  {log.details || log.reason || '–'}
                </Typography>
              </Paper>
            ))}
          </Box>

          <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredHistory.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{color: '#fff', mt: 2}}
              labelRowsPerPage="แสดงแถวต่อหน้า:"
          />
        </>
      )}
    </Box>
  );
};

export default HistoryLog;
