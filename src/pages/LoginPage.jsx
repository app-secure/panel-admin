import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton, Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de red. Verifica tu conexión.',
  'auth/invalid-email': 'El formato del correo no es válido.',
};

const getLoginError = (err) => {
  // Error del backend (axios) — credenciales inválidas
  if (err?.response) {
    const status = err.response.status;
    if (status === 401 || status === 403) return 'Correo o contraseña incorrectos.';
    if (status === 404) return 'Usuario no encontrado.';
    if (status === 400) return 'Correo o contraseña incorrectos.';
    return `Error del servidor (${status}).`;
  }
  // Error de Firebase
  return FIREBASE_ERRORS[err?.code] ?? 'Ocurrió un error inesperado.';
};

const KEYFRAMES = `
  @keyframes fadeSlideRight {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeSlideLeft {
    from { opacity: 0; transform: translateX(-36px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    bgcolor: '#ffffff',
    color: '#1a2f40',
    fontSize: 13,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: 'transparent' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(42,127,143,0.4)', borderWidth: 1 },
    '&.Mui-focused': { bgcolor: '#ffffff' },
  },
  '& .MuiInputBase-input': {
    py: 1.15,
    color: '#1a2f40',
    '&::placeholder': { color: '#8fa0b0', opacity: 1 },
  },
};

export default function LoginPage() {
  const { login, user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#1a5f6e' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (user) return <Navigate to={isAdmin ? '/dashboard' : '/acceso-denegado'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const rol = await login(email, password);
      navigate(rol?.toUpperCase() === 'ADMIN' ? '/dashboard' : '/acceso-denegado', { replace: true });
    } catch (err) {
      setError(getLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a5f6e 0%, #2a7f8f 50%, #1e6b7a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Esferas decorativas */}
        <Box sx={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)', filter: 'blur(70px)', top: -150, left: -150, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(10,50,60,0.35)', filter: 'blur(60px)', bottom: -100, right: '35%', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', filter: 'blur(45px)', top: '55%', left: '25%', pointerEvents: 'none' }} />

        {/* ── IZQUIERDA — branding (ocupa ~50%) ── */}
        <Box sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          px: { md: 8, lg: 12 },
          animation: 'fadeSlideLeft 0.7s ease both',
        }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.35em', fontSize: 11, textTransform: 'uppercase', mb: 2 }}>
            Aplicaciones Distribuidas — UTA
          </Typography>

          <Typography variant="h2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 200, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: { md: '2.6rem', lg: '3.2rem' }, lineHeight: 1.05, mb: 0.5 }}>
            Panel
          </Typography>
          <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: { md: '2.6rem', lg: '3.2rem' }, lineHeight: 1.05, mb: 2.5 }}>
            Admin
          </Typography>

          <Box sx={{ width: 44, height: 2, bgcolor: 'rgba(255,255,255,0.55)', mb: 3 }} />

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, letterSpacing: '0.03em', lineHeight: 2, mb: 5 }}>
            Sistema de gestión centralizado<br />
            para administración de usuarios,<br />
            productos y compras.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
            {[
              ['01', 'Gestión de usuarios'],
              ['02', 'Control de productos'],
              ['03', 'Historial de compras'],
              ['04', 'Failover automático'],
            ].map(([num, label], i) => (
              <Box key={num} sx={{ display: 'flex', alignItems: 'center', gap: 2, animation: `fadeUp 0.6s ease ${0.1 + i * 0.08}s both` }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', width: 20 }}>{num}</Typography>
                <Box sx={{ width: 28, height: '1px', bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: '0.04em' }}>{label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── DERECHA — formulario (~50%) ── */}
        <Box sx={{
          width: { xs: '100%', md: '48%' },
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, md: 6, lg: 10 },
          py: 4,
          animation: 'fadeSlideRight 0.65s cubic-bezier(0.16,1,0.3,1) both',
        }}>

          {/* Título */}
          <Typography sx={{
            color: '#ffffff',
            fontWeight: 600,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            fontSize: 13,
            mb: 2,
            animation: 'fadeUp 0.5s ease 0.2s both',
            textShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}>
            User Login
          </Typography>

          {/* Carta */}
          <Box sx={{
            width: '100%',
            maxWidth: 420,
            bgcolor: 'rgba(15,55,65,0.45)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)',
            p: { xs: 3, sm: 4 },
            animation: 'fadeUp 0.6s ease 0.1s both',
          }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}
                sx={{ mb: 2.5, borderRadius: 0, bgcolor: 'rgba(211,47,47,0.12)', color: '#ff9090', border: '1px solid rgba(211,47,47,0.2)', fontSize: 12, '& .MuiAlert-icon': { color: '#ff9090' } }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <Box sx={{ display: 'flex', mb: 2 }}>
                <Box sx={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ffffff', borderRight: '1px solid rgba(42,127,143,0.2)', flexShrink: 0 }}>
                  <EmailOutlined sx={{ color: '#2a7f8f', fontSize: 17 }} />
                </Box>
                <TextField type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  fullWidth required autoComplete="email" autoFocus
                  placeholder="Email ID" disabled={loading}
                  sx={{ ...fieldSx, mb: 0, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], borderRadius: 0 } }} />
              </Box>

              {/* Password */}
              <Box sx={{ display: 'flex', mb: 3.5 }}>
                <Box sx={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ffffff', borderRight: '1px solid rgba(42,127,143,0.2)', flexShrink: 0 }}>
                  <LockOutlined sx={{ color: '#2a7f8f', fontSize: 17 }} />
                </Box>
                <TextField type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth required autoComplete="current-password"
                  placeholder="Password" disabled={loading}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((v) => !v)} size="small" disabled={loading} sx={{ color: '#8fa0b0', mr: -0.5 }}>
                            {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ ...fieldSx, mb: 0, '& .MuiOutlinedInput-root': { ...fieldSx['& .MuiOutlinedInput-root'], borderRadius: 0 } }} />
              </Box>

              {/* Botón LOGIN */}
              <Button type="submit" fullWidth disabled={loading || !email || !password}
                sx={{
                  py: 1.5, borderRadius: 0, fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.18em', bgcolor: '#2a7f8f', color: '#ffffff',
                  border: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: '#1e6b7a', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', transform: 'translateY(-1px)' },
                  '&:active': { transform: 'translateY(0)' },
                  '&:disabled': { bgcolor: 'rgba(42,127,143,0.35)', color: 'rgba(255,255,255,0.4)', transform: 'none' },
                }}>
                {loading ? <CircularProgress size={18} sx={{ color: 'rgba(255,255,255,0.6)' }} /> : 'LOGIN'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
