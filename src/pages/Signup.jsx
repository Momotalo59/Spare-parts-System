
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from '../firebase';
import { doc, setDoc } from "firebase/firestore";
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  InputAdornment,
  Paper,
  Grid
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !employeeId || !email || !password || !confirmPassword) {
        setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(res.user, { displayName });
      
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        firstName,
        lastName,
        displayName,
        employeeId,
        email,
        role: 'user' // Default role
      });

      navigate('/');
    } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
            setError('อีเมลนี้มีผู้ใช้งานแล้ว');
        } else if (err.code === 'auth/weak-password') {
            setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        } else {
            setError('เกิดข้อผิดพลาดในการลงทะเบียน โปรดลองอีกครั้ง');
            console.error(err);
        }
    }
  };
  
  const CustomTextField = (props) => (
    <TextField
      fullWidth
      variant="filled"
      InputProps={{
        ...props.InputProps,
        disableUnderline: true,
        style: {
          borderRadius: '8px',
          backgroundColor: '#2E2E2E',
          color: '#fff',
          fontFamily: 'Kanit'
        }
      }}
      InputLabelProps={{
        style: { 
          color: '#8e8e8e',
          fontFamily: 'Kanit'
        },
      }}
      sx={{
        '& .MuiFilledInput-root': {
            backgroundColor: '#3a3a3a',
        },
        '& .MuiFilledInput-root.Mui-focused': {
            backgroundColor: '#3a3a3a',
        },
      }}
      {...props}
    />
  );

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Left decorative panel */}
      <Box
        sx={{
          width: '50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
          color: '#ffffff',
          p: 4,
        }}
      >
        <Box component="img" src="/logo.png" sx={{ width: 100, height: 100, mb: 3, filter: 'brightness(0) invert(1)' }} />
        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 2, fontFamily: 'Kanit' }}>
          สร้างบัญชีผู้ใช้ใหม่
        </Typography>
        <Typography sx={{ textAlign: 'center', fontFamily: 'Kanit', color: 'rgba(255, 255, 255, 0.8)' }}>
          ร่วมเป็นส่วนหนึ่งของระบบบริหารจัดการสต็อกสำหรับแผนกช่างเทคนิคควบคุมระบบ
          <br />
          โรงพยาบาลโอเวอร์บรุ๊คเชียงราย
        </Typography>
      </Box>

      {/* Right panel with the form */}
      <Box
        sx={{
          width: { xs: '100%', md: '50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#121212',
          p: 2 // Reduced padding
        }}
      >
        <Paper 
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 500,
            p: {xs: 2, sm: 3},
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1, fontFamily: 'Kanit' }}>
            ลงทะเบียน
          </Typography>
          <Typography sx={{ color: '#b0b0b0', mb: 3, fontFamily: 'Kanit' }}>
            กรอกข้อมูลเพื่อสร้างบัญชีของคุณ
          </Typography>

          <Box component="form" onSubmit={handleSignup} sx={{ width: '100%', mt: 1 }}>
            <Grid container spacing={1.5} sx={{mb: 1.5}}>
                <Grid item xs={12} sm={6}>
                    <CustomTextField
                        label="ชื่อจริง"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <CustomTextField
                        label="นามสกุล"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </Grid>
            </Grid>
             <CustomTextField
              label="รหัสพนักงาน"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeOutlinedIcon sx={{ color: '#8e8e8e' }} />
                  </InputAdornment>
                ),
              }}
              sx={{mb: 1.5}}
            />
            <CustomTextField
              label="อีเมล"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#8e8e8e' }} />
                  </InputAdornment>
                ),
              }}
               sx={{mb: 1.5}}
            />
            <CustomTextField
              label="รหัสผ่าน"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: '#8e8e8e' }} />
                  </InputAdornment>
                ),
              }}
               sx={{mb: 1.5}}
            />
            <CustomTextField
              label="ยืนยันรหัสผ่าน"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CheckCircleOutlineIcon sx={{ color: '#8e8e8e' }} />
                  </InputAdornment>
                ),
              }}
              sx={{mb: 1.5}}
            />

            {error && (
              <Typography color="error" variant="body2" sx={{ my: 1.5, textAlign: 'center', fontFamily: 'Kanit' }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                p: '12px',
                fontSize: '1rem',
                fontWeight: 'bold',
                fontFamily: 'Kanit',
                backgroundColor: '#8A2BE2',
                borderRadius: '8px',
                mt: 1.5,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#7B1FA2'
                }
              }}
            >
              สร้างบัญชี
            </Button>

            <Typography sx={{ color: '#8e8e8e', mt: 2, textAlign: 'center', fontFamily: 'Kanit' }}>
              มีบัญชีอยู่แล้ว? <Link to="/login" style={{ color: '#8A2BE2', textDecoration: 'none', fontWeight: 'bold' }}>เข้าสู่ระบบ</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Signup;
