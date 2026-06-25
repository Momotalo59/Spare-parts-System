
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  InputAdornment,
  Paper
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// CORRECTED: Define CustomTextField outside the Login component
// This prevents it from being re-defined on every render, which was causing the focus loss issue.
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
      '& .MuiFilledInput-root:hover': {
          backgroundColor: '#3a3a3a',
      },
      '& .MuiFilledInput-root.Mui-focused': {
          backgroundColor: '#3a3a3a',
      },
      mb: 2
    }}
    {...props}
  />
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
        setError('กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  };

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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
          p: 4,
        }}
      >
        <Box component="img" src="/logo.png" sx={{ width: 100, height: 100, mb: 3, filter: 'brightness(0) invert(1)' }} />
        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 2, fontFamily: 'Kanit' }}>
          ยินดีต้อนรับสู่
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, fontFamily: 'Kanit' }}>
          คลังพัสดุและเครื่องมือ
        </Typography>
        <Typography sx={{ textAlign: 'center', fontFamily: 'Kanit', color: 'rgba(255, 255, 255, 0.8)' }}>
          ระบบบริหารสต็อกสำหรับแผนกช่างเทคนิคควบคุมระบบ
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
          p: 4,
        }}
      >
        <Paper 
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 450,
            p: {xs: 2, sm: 4},
            backgroundColor: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ color: '#ffffff', fontWeight: 'bold', mb: 1, fontFamily: 'Kanit' }}>
            เข้าสู่ระบบ
          </Typography>
          <Typography sx={{ color: '#b0b0b0', mb: 4, fontFamily: 'Kanit' }}>
            กรุณากรอกข้อมูลของคุณเพื่อเข้าใช้งาน
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <CustomTextField
              label="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: '#8e8e8e' }} />
                  </InputAdornment>
                ),
              }}
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
            />

            {error && (
              <Typography color="error" variant="body2" sx={{ my: 2, textAlign: 'center', fontFamily: 'Kanit' }}>
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
                backgroundColor: '#5865F2',
                borderRadius: '8px',
                mt: 2,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#4752C4'
                }
              }}
            >
              เข้าสู่ระบบ
            </Button>

            <Typography sx={{ color: '#8e8e8e', mt: 3, textAlign: 'center', fontFamily: 'Kanit' }}>
              ยังไม่มีบัญชี? <Link to="/signup" style={{ color: '#5865F2', textDecoration: 'none', fontWeight: 'bold' }}>ลงทะเบียน</Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
