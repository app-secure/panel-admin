import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Divider, useTheme, useMediaQuery, Menu, MenuItem,
  Button, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Alert,
} from '@mui/material';
import {
  DashboardOutlined, PeopleOutlined, InventoryOutlined,
  ShoppingCartOutlined, LogoutOutlined, Menu as MenuIcon,
  KeyboardArrowDown, Dashboard,
} from '@mui/icons-material';
import { useAuth } from '../auth/AuthContext';
import { useContingency } from '../auth/ContingencyContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, to: '/dashboard' },
  { label: 'Usuarios', icon: <PeopleOutlined fontSize="small" />, to: '/usuarios' },
  { label: 'Productos', icon: <InventoryOutlined fontSize="small" />, to: '/productos' },
  { label: 'Compras', icon: <ShoppingCartOutlined fontSize="small" />, to: '/compras' },
];

const TOPBAR_BG = 'linear-gradient(135deg, #1a5f6e 0%, #2a7f8f 50%, #1e6b7a 100%)';
const TOPBAR_BORDER = 'rgba(255,255,255,0.08)';

export default function Layout() {
  const { user, logout } = useAuth();
  const { isContingency, activeDatabase } = useContingency();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? 'A';
  const emailName = user?.email?.split('@')[0] ?? 'Admin';

  const mobileDrawer = (
    <Box sx={{ width: 200, bgcolor: '#f7f7f7', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ color: '#555', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>AP</Typography>
        </Box>
        <Typography sx={{ color: '#444', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>ADMINPANEL</Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)' }} />
      <List sx={{ pt: 1 }}>
        {NAV_ITEMS.map(({ label, icon, to }) => (
          <ListItem key={to} disablePadding>
            <ListItemButton
              component={NavLink}
              to={to}
              onClick={() => setMobileOpen(false)}
              sx={{
                py: 1, px: 2,
                color: '#666',
                '& .MuiListItemIcon-root': { color: '#999', minWidth: 32 },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)', color: '#333' },
                '&.active': {
                  bgcolor: 'rgba(0,0,0,0.07)',
                  color: '#222',
                  borderLeft: '3px solid #888',
                  pl: '13px',
                  '& .MuiListItemIcon-root': { color: '#555' },
                },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { fontSize: 13, fontWeight: 500 } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#eef2f2' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: TOPBAR_BG,
          borderBottom: `1px solid ${TOPBAR_BORDER}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        }}
      >
        <Toolbar sx={{ minHeight: '54px !important', px: { xs: 2, md: 3 }, position: 'relative' }}>
          {/* Logo — left */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: 1,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>AP</Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', lineHeight: 1 }}>ADMINPANEL</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, letterSpacing: '0.1em', mt: 0.3 }}>SISTEMA DE GESTIÓN</Typography>
            </Box>
          </Box>

          {/* Nav links — centered absolutely */}
          {!isMobile && (
            <Box sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}>
              {NAV_ITEMS.map(({ label, icon, to }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  startIcon={icon}
                  sx={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 1,
                    textTransform: 'none',
                    minWidth: 0,
                    transition: 'all 0.15s',
                    '& .MuiButton-startIcon': { color: 'rgba(255,255,255,0.5)', mr: 0.6 },
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.95)',
                      '& .MuiButton-startIcon': { color: 'rgba(255,255,255,0.85)' },
                    },
                    '&.active': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontWeight: 700,
                      '& .MuiButton-startIcon': { color: '#fff' },
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          {/* User menu — right */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.8,
              cursor: 'pointer', borderRadius: 1, px: 1.2, py: 0.6,
              transition: 'all 0.15s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Avatar sx={{
              width: 26, height: 26,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: 10, fontWeight: 700,
              color: '#fff', borderRadius: 1,
            }}>
              {initials}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.92)', fontSize: 12, lineHeight: 1.2 }}>{emailName}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.08em' }}>ADMINISTRADOR</Typography>
            </Box>
            <KeyboardArrowDown sx={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }} />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{ paper: { sx: { mt: 1, borderRadius: 1, minWidth: 175, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', bgcolor: '#f5f7f7' } } }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontWeight: 600, color: '#333', fontSize: 12 }}>{emailName}</Typography>
              <Typography sx={{ color: '#aaa', fontSize: 11 }}>{user?.email}</Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(0,0,0,0.08)' }} />
            <MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: '#c0392b', py: 1.1, fontSize: 12, '&:hover': { bgcolor: 'rgba(192,57,43,0.06)' } }}>
              <LogoutOutlined fontSize="small" />
              <Typography fontWeight={600} fontSize={12}>Cerrar sesión</Typography>
            </MenuItem>
          </Menu>

          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton onClick={() => setMobileOpen((v) => !v)} sx={{ ml: 0.5, color: 'rgba(255,255,255,0.75)' }}>
              <MenuIcon fontSize="small" />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { border: 'none', boxShadow: '2px 0 12px rgba(0,0,0,0.1)' } }}
        >
          {mobileDrawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '54px',
          p: { xs: 2, md: 2.5 },
          bgcolor: '#eef2f2',
          minHeight: 'calc(100vh - 54px)',
        }}
      >
        {isContingency && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2.5, 
              borderRadius: 2.5, 
              border: '1px solid rgba(237, 108, 2, 0.2)',
              bgcolor: 'rgba(237, 108, 2, 0.08)',
              color: '#bd5e00',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(237, 108, 2, 0.08)',
              '& .MuiAlert-icon': { color: '#bd5e00' }
            }}
          >
            El sistema se encuentra en modo de contingencia preventiva (Base de datos activa: {activeDatabase}). Solo se permite la lectura de datos; las operaciones de creación, edición y desactivación están bloqueadas.
          </Alert>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
