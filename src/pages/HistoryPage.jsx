
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { unparse } from 'papaparse';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Paper,
    TextField,
    InputAdornment,
    Select,
    MenuItem,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    FormControl,
    InputLabel
} from '@mui/material';
import { ArrowBack, Search } from '@mui/icons-material';

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    mb: 3,
    color: '#fff',
};

const mainPaperStyle = {
    backgroundColor: 'rgb(43, 43, 43)',
    color: 'white',
    borderRadius: '16px',
    p: { xs: 2, sm: 3 },
    fontFamily: 'Kanit, sans-serif',
};

const filterContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    mb: 3,
};

const commonInputStyles = {
    '& .MuiOutlinedInput-root': {
        backgroundColor: '#3a3a3a',
        fontFamily: 'Kanit',
        color: 'white',
        '& input': { color: 'white', fontFamily: 'Kanit' },
        '& fieldset': { borderColor: '#555' },
        '&:hover fieldset': { borderColor: '#777' },
        '&.Mui-focused fieldset': { borderColor: '#A076F9' },
    },
    '& .MuiInputLabel-root': { color: '#aaa', fontFamily: 'Kanit', fontWeight: 'bold' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#A076F9' },
    '& .MuiSelect-icon': { color: '#aaa' },
};

const typeChipProps = (type) => {
    const sx = { color: '#ffffff', fontFamily: 'Kanit', fontWeight: 'bold' };
    let label = type;

    switch (type) {
        case 'เบิก':
        case 'withdraw':
            label = 'เบิก';
            sx.backgroundColor = '#ffc107'; // Yellow
            break;
        case 'ยืม':
        case 'borrow':
            label = 'ยืม';
            sx.backgroundColor = '#8E44AD'; // Purple
            break;
        case 'เติมสต็อก':
        case 'refill':
            label = 'เติมสต็อก';
            sx.backgroundColor = '#198754'; // Green
            break;
        case 'เพิ่มรายการใหม่':
        case 'add':
            label = 'เพิ่มรายการใหม่';
            sx.backgroundColor = '#0dcaf0'; // Blue
            break;
        case 'แก้ไขรายการ':
        case 'edit':
            label = 'แก้ไขรายการ';
            sx.backgroundColor = '#6f42c1'; // Purple
            break;
        case 'ลบ':
        case 'delete':
            label = 'ลบ';
            sx.backgroundColor = '#dc3545'; // Red
            break;
        case 'คืน':
        case 'return':
            label = 'คืน';
            sx.backgroundColor = '#fd7e14'; // Orange
            break;
        default:
            label = type;
            sx.backgroundColor = '#6c757d'; // Default Grey
            break;
    }
    return { label, sx };
};

const typeTranslations = {
    'all': 'ทั้งหมด',
    'withdraw': 'เบิก',
    'borrow': 'ยืม',
    'refill': 'เติมสต็อก',
    'add': 'เพิ่มรายการใหม่',
    'edit': 'แก้ไขรายการ',
    'delete': 'ลบ',
    'return': 'คืน',
    'เบิก': 'เบิก',
    'ยืม': 'ยืม',
    'เติมสต็อก': 'เติมสต็อก',
    'เพิ่มรายการใหม่': 'เพิ่มรายการใหม่',
    'แก้ไขรายการ': 'แก้ไขรายการ',
    'ลบ': 'ลบ',
    'คืน': 'คืน',
};

const HistoryPage = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('all');
    const [yearFilter, setYearFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setTransactions(transData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredTransactions = useMemo(() => transactions.filter(t => {
        const transactionDate = t.timestamp;
        const matchesSearch = searchTerm === '' ||
            t.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.user?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesMonth = monthFilter === 'all' || (transactionDate && transactionDate.getMonth() + 1 === parseInt(monthFilter));
        const matchesYear = yearFilter === 'all' || (transactionDate && transactionDate.getFullYear() === parseInt(yearFilter));
        
        const translatedTypeFilter = typeTranslations[typeFilter] || typeFilter;
        const matchesType = typeFilter === 'all' || t.type === translatedTypeFilter;

        return matchesSearch && matchesMonth && matchesYear && matchesType;
    }), [transactions, searchTerm, monthFilter, yearFilter, typeFilter]);

    const getCombinedNote = (t) => {
        return [t.reason, t.location, t.details].filter(Boolean).join(' - ') || '–';
    };

    const handleExport = () => {
        const dataToExport = filteredTransactions.map(t => {
            const isPositive = t.type === 'refill' || t.type === 'เติมสต็อก' || t.type === 'add' || t.type === 'เพิ่มรายการใหม่' || t.type === 'คืน' || t.type === 'return';
            const displayQuantity = isPositive ? t.quantity : -t.quantity;

            return {
                'เวลา': t.timestamp ? t.timestamp.toLocaleString('th-TH') : 'N/A',
                'รายการ': t.itemName,
                'ประเภท': typeTranslations[t.type] || t.type,
                'จำนวน': displayQuantity,
                'คงเหลือ': t.new_quantity, 
                'ผู้ดำเนินการ': t.user,
                'หมายเหตุ': getCombinedNote(t),
            };
        });

        const csv = unparse(dataToExport);
        const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const date = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
        link.setAttribute('download', `history-export-${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedTransactions = filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const availableYears = useMemo(() => [...new Set(transactions.map(t => t.timestamp?.getFullYear()).filter(Boolean))], [transactions]);

    const typeFilterButtons = ['all', 'withdraw', 'borrow', 'return', 'refill', 'add', 'edit', 'delete'];

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#1e1e1e', minHeight: '100vh', color: 'white' }}>
            <Box sx={{ maxWidth: 1400, margin: 'auto' }}>
                <Box sx={headerStyle}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontFamily: 'Kanit', fontWeight: 'bold' }}>
                        ประวัติการใช้งาน
                    </Typography>
                </Box>

                <Paper sx={mainPaperStyle}>
                     <Box sx={{ ...filterContainerStyle, justifyContent: 'space-between' }}>
                        <Box sx={filterContainerStyle}>
                            <TextField
                                placeholder="ค้นหาชื่อไอเทม หรือชื่อผู้ดำเนิน..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                sx={{ ...commonInputStyles, minWidth: '300px' }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ color: '#888' }} /></InputAdornment>,
                                }}
                            />
                             <FormControl sx={{ ...commonInputStyles, minWidth: 150 }}>
                                <InputLabel>เลือกเดือน</InputLabel>
                                <Select value={monthFilter} label="เลือกเดือน" onChange={e => setMonthFilter(e.target.value)}>
                                    <MenuItem value="all">ทุกเดือน</MenuItem>
                                    {[...Array(12)].map((_, i) => <MenuItem key={i + 1} value={i + 1}>{`เดือน ${i + 1}`}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ ...commonInputStyles, minWidth: 150 }}>
                                <InputLabel>เลือกปี</InputLabel>
                                <Select value={yearFilter} label="เลือกปี" onChange={e => setYearFilter(e.target.value)}>
                                    <MenuItem value="all">ทุกปี</MenuItem>
                                    {availableYears.map(year => <MenuItem key={year} value={year}>{`ปี ${year + 543}`}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleExport}
                            sx={{ fontFamily: 'Kanit', fontWeight: 'bold', bgcolor: '#198754', '&:hover': { bgcolor: '#157347' }, height: 56 }}
                        >
                            EXPORT TO CSV
                        </Button>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                        {typeFilterButtons.map((key) => (
                            <Button
                                key={key}
                                variant={typeFilter === key ? 'contained' : 'outlined'}
                                onClick={() => setTypeFilter(key)}
                                sx={{
                                    fontFamily: 'Kanit',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    px: 2,
                                    ...(typeFilter === key ? { bgcolor: '#A076F9', color: 'white', border: '1px solid #A076F9' } : { borderColor: '#555', color: '#ccc' })
                                }}
                            >
                                {typeTranslations[key]}
                            </Button>
                        ))}
                    </Box>

                    <TableContainer>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow sx={{ '& th': { borderColor: '#555', color: '#ccc', fontFamily: 'Kanit', fontWeight: 'bold', bgcolor: 'rgb(43, 43, 43)'} }}>
                                    <TableCell>เวลา</TableCell>
                                    <TableCell>รายการ</TableCell>
                                    <TableCell>ประเภท</TableCell>
                                    <TableCell align="center">จำนวน</TableCell>
                                    <TableCell>ผู้ดำเนินการ</TableCell>
                                    <TableCell>หมายเหตุ</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={6} align="center" sx={{ border: 'none', py: 10 }}><CircularProgress color="secondary" /></TableCell></TableRow>
                                ) : (
                                    paginatedTransactions.map((t) => {
                                        const isPositive = t.type === 'refill' || t.type === 'เติมสต็อก' || t.type === 'add' || t.type === 'เพิ่มรายการใหม่' || t.type === 'คืน' || t.type === 'return';

                                        if (t.type === 'edit' || t.type === 'แก้ไขรายการ') {
                                            return (
                                                <TableRow key={t.id} hover sx={{ '& td': { borderColor: '#444', fontFamily: 'Kanit' } }}>
                                                    <TableCell>{t.timestamp ? t.timestamp.toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}) + ' น.' : '–'}</TableCell>
                                                    <TableCell sx={{maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.itemName}</TableCell>
                                                    <TableCell><Chip {...typeChipProps(t.type)} size="small" /></TableCell>
                                                    <TableCell align="center" sx={{ color: '#9E9E9E', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        –
                                                    </TableCell>
                                                    <TableCell>{t.user}</TableCell>
                                                    <TableCell>{getCombinedNote(t)}</TableCell>
                                                </TableRow>
                                            )
                                        }
                                        return (
                                            <TableRow key={t.id} hover sx={{ '& td': { borderColor: '#444', fontFamily: 'Kanit' } }}>
                                                <TableCell>{t.timestamp ? t.timestamp.toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'}) + ' น.' : '–'}</TableCell>
                                                <TableCell sx={{maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.itemName}</TableCell>
                                                <TableCell><Chip {...typeChipProps(t.type)} size="small" /></TableCell>
                                                <TableCell align="center" sx={{ color: isPositive ? '#4caf50' : '#f44336', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {isPositive ? `+${t.quantity}` : `-${t.quantity}`}
                                                </TableCell>
                                                <TableCell>{t.user}</TableCell>
                                                <TableCell>{getCombinedNote(t)}</TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                     <TablePagination
                        sx={{ color: '#ccc', '.MuiTablePagination-selectIcon': { color: '#aaa' }, '.Mui-disabled': { color: '#666' } }}
                        component="div"
                        count={filteredTransactions.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        labelRowsPerPage="แถวต่อหน้า:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} จาก ${count}`}
                    />
                </Paper>
            </Box>
        </Box>
    );
};

export default HistoryPage;
