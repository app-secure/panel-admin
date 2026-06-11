import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const TEAL = 'linear-gradient(135deg, #1a5f6e 0%, #2a7f8f 50%, #1e6b7a 100%)';

export default function AccesoDenegadoPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: TEAL,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      px: 2,
    }}>
      <Box
        component="img"
        src="https://detectamet.es/pub/media/catalog/product/cache/e152bb7298c0a7f909800d427a78e562/s/i/sign-t0047-s05_no_access_a5_v2.jpg"
        alt="Acceso denegado"
        sx={{ width: 220, height: 'auto', borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
      />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, letterSpacing: '0.05em', mb: 1 }}>
          ACCESO DENEGADO
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
          Usted no tiene permisos para ingresar al Panel Admin.
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mt: 0.5 }}>
          Solo los administradores pueden acceder a este sistema.
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={handleLogout}
        sx={{
          mt: 1, bgcolor: 'white', color: '#1e6b7a', fontWeight: 700,
          px: 4, py: 1.2, borderRadius: 2,
          '&:hover': { bgcolor: '#e8f5f7' },
        }}
      >
        Volver al inicio de sesión
      </Button>
    </Box>
  );
}
