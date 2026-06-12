import { useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton,
  Alert, CircularProgress, Tooltip, Skeleton, Avatar,
  TextField, Button, InputAdornment, Dialog, DialogContent,
  MenuItem, Select, FormControl, InputLabel, TablePagination,
} from '@mui/material';
import {
  Refresh, PeopleOutlined, SearchOutlined, ClearOutlined,
  EditOutlined, CloseOutlined, PersonOffOutlined, PersonAddOutlined,
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { getUsuarios, getUsuariosInactivos, getUsuarioPorCedula, updateUsuario, desactivarUsuario, activarUsuario } from '../api/usuarios';
import { useContingency } from '../auth/ContingencyContext';

const TEAL = 'linear-gradient(135deg, #1e6b7a 0%, #2a7f8f 45%, #246e7c 100%)';
const TEAL_SOLID = '#2a7f8f';

const KEYFRAMES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const HEADERS = ['Usuario', 'Cédula', 'Correo electrónico', 'Teléfono', 'Dirección', 'Rol', 'Estado', 'Acciones'];

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((__, j) => (
        <TableCell key={j}><Skeleton animation="wave" sx={{ borderRadius: 1 }} /></TableCell>
      ))}
    </TableRow>
  ));
}

function PageHeader({ title, subtitle, icon, count, onRefresh, loading, onNew }) {
  return (
    <Box sx={{
      background: TEAL,
      borderRadius: 3, p: 3, mb: 3,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 2,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(26,95,110,0.3)',
      animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
      '&::before': { content: '""', position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' },
      '&::after':  { content: '""', position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
        <Box sx={{
          width: 50, height: 50, borderRadius: 2.5,
          bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.3 }}>{subtitle}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {count !== undefined && (
          <Box sx={{ px: 2, py: 0.8, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{count} registros</Typography>
          </Box>
        )}
        <Tooltip title="Recargar datos"><span>
          <IconButton onClick={onRefresh} disabled={loading} sx={{ color: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <Refresh fontSize="small" />
          </IconButton>
        </span></Tooltip>
      </Box>
    </Box>
  );
}

const EMPTY_EDIT = { nombreCompleto: '', cedula: '', telefono: '', direccion: '', rol: 'USUARIO', estado: true };

const getTodosLosUsuariosCombined = async () => {
  const [activos, inactivos] = await Promise.all([
    getUsuarios(),
    getUsuariosInactivos()
  ]);
  return {
    data: [
      ...activos.data.map(u => ({ ...u, estado: true })),
      ...inactivos.data.map(u => ({ ...u, estado: false }))
    ]
  };
};

export default function UsuariosPage() {
  const { data: usuarios, loading, error, refresh } = useApi(getTodosLosUsuariosCombined);
  const { isContingency } = useContingency();
  const [snack, setSnack] = useState({ msg: '', type: 'success' });
  const [togglingId, setTogglingId] = useState(null);

  // Estados para búsqueda por nombre/cédula, filtro de estado y paginación
  const [cedulaFiltro, setCedulaFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'ACTIVOS' | 'INACTIVOS'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Estado para el modal de confirmación personalizado
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: null });

  const handleConfirmToggle = (u) => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    const isActivating = !u.estado;
    const title = isActivating ? 'Activar Usuario' : 'Desactivar Usuario';
    const message = isActivating
      ? `¿Estás seguro de que deseas volver a activar al usuario "${u.nombreCompleto}"?`
      : `¿Estás seguro de que deseas desactivar al usuario "${u.nombreCompleto}"?`;

    setConfirmDlg({
      open: true,
      title,
      message,
      onConfirm: () => executeToggleEstado(u)
    });
  };

  const executeToggleEstado = async (u) => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    setTogglingId(u.idUsuario);
    try {
      if (u.estado) {
        await desactivarUsuario(u.idUsuario);
        setSnack({ msg: 'Usuario desactivado correctamente.', type: 'success' });
      } else {
        await activarUsuario(u.idUsuario);
        setSnack({ msg: 'Usuario activado correctamente.', type: 'success' });
      }
      refresh();
    } catch {
      setSnack({ msg: 'Error al cambiar estado del usuario.', type: 'error' });
    } finally { setTogglingId(null); }
  };

  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const openEditDialog = (u) => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    setEditTarget(u);
    setEditForm({
      nombreCompleto: u.nombreCompleto ?? '',
      cedula: u.cedula ?? '',
      telefono: u.telefono ?? '',
      direccion: u.direccion ?? '',
      rol: u.rol ?? 'USUARIO',
      estado: u.estado ?? true,
    });
    setEditError('');
    setOpenEdit(true);
  };

  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateEdit = () => {
    const { nombreCompleto, cedula, telefono } = editForm;
    if (!nombreCompleto.trim())               return 'El nombre completo es obligatorio.';
    if (nombreCompleto.trim().length < 3)     return 'El nombre debe tener al menos 3 caracteres.';
    if (!cedula.trim())                       return 'La cédula es obligatoria.';
    if (!/^\d{10}$/.test(cedula.trim()))      return 'La cédula debe tener exactamente 10 dígitos numéricos.';
    if (telefono && !/^\d{10}$/.test(telefono.trim())) return 'El teléfono debe tener exactamente 10 dígitos.';
    return null;
  };

  const handleEdit = async () => {
    if (isContingency) {
      setEditError('NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA');
      return;
    }
    const err = validateEdit();
    if (err) { setEditError(err); return; }
    setSaving(true); setEditError('');
    try {
      await updateUsuario(editTarget.idUsuario, {
        nombreCompleto: editForm.nombreCompleto,
        cedula: editForm.cedula,
        telefono: editForm.telefono,
        direccion: editForm.direccion,
      });

      setOpenEdit(false);
      setSnack({ msg: 'Usuario actualizado correctamente.', type: 'success' });
      refresh();
    } catch (err) {
      setEditError(err?.response?.data?.message ?? 'Error al actualizar el usuario.');
    } finally { setSaving(false); }
  };

  const listaVisible = useMemo(() => {
    if (!usuarios) return [];
    return usuarios.filter((u) => {
      // Ocultar administradores en la tabla del frontend
      if (u.rol === 'ADMIN') return false;

      const term = cedulaFiltro.toLowerCase().trim();
      const matchesSearch = term === '' || 
        u.cedula.includes(term) || 
        u.nombreCompleto.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      let matchesState = true;
      if (filtroEstado === 'ACTIVOS') matchesState = u.estado === true;
      if (filtroEstado === 'INACTIVOS') matchesState = u.estado === false;

      return matchesSearch && matchesState;
    });
  }, [usuarios, cedulaFiltro, filtroEstado]);

  const paginatedList = useMemo(() => {
    return listaVisible.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listaVisible, page, rowsPerPage]);


  return (
    <>
      <style>{KEYFRAMES}</style>
      <Box>
        <PageHeader
          title="Usuarios"
          subtitle="Gestión de cuentas del sistema"
          icon={<PeopleOutlined />}
          count={usuarios?.length}
          onRefresh={refresh}
          loading={loading}
        />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {snack.msg && (
          <Alert severity={snack.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack({ msg: '' })}>
            {snack.msg}
          </Alert>
        )}

        {/* Panel de Búsqueda y Filtro */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(42,127,143,0.08)', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1, minWidth: 260 }}>
            <Typography variant="body2" fontWeight={700} color="#1a2f40">Buscar:</Typography>
            <TextField
              size="small" placeholder="Buscar por nombre o cédula..." value={cedulaFiltro}
              onChange={(e) => { setCedulaFiltro(e.target.value); setPage(0); }}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              slotProps={{ input: { 
                startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 16, color: '#8fa0b0' }} /></InputAdornment>,
                endAdornment: cedulaFiltro && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setCedulaFiltro(''); setPage(0); }}>
                      <ClearOutlined sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                )
              } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['TODOS', 'ACTIVOS', 'INACTIVOS'].map((mode) => (
              <Chip
                key={mode}
                label={mode}
                clickable
                onClick={() => { setFiltroEstado(mode); setPage(0); }}
                sx={{
                  fontWeight: 700,
                  bgcolor: filtroEstado === mode ? TEAL_SOLID : 'rgba(0,0,0,0.06)',
                  color: filtroEstado === mode ? 'white' : '#6B7A8D',
                  '&:hover': { bgcolor: filtroEstado === mode ? TEAL_SOLID : 'rgba(0,0,0,0.1)' }
                }}
              />
            ))}
          </Box>
        </Paper>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(42,127,143,0.1)', animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {HEADERS.map((h) => (
                    <TableCell key={h} sx={{ background: TEAL, color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, py: 2 }}>
                      {h.toUpperCase()}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows /> : !paginatedList.length ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 8, textAlign: 'center' }}>
                      <PeopleOutlined sx={{ fontSize: 48, color: '#c5cdd6', mb: 1.5, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" color="text.secondary">No hay usuarios registrados</Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedList.map((u, idx) => (
                  <TableRow key={u.idUsuario} sx={{
                    bgcolor: idx % 2 === 0 ? 'white' : 'rgba(42,127,143,0.02)',
                    '&:hover': { bgcolor: 'rgba(42,127,143,0.05)', transition: 'background 0.15s' },
                    '&:last-child td': { borderBottom: 0 },
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: TEAL_SOLID, fontSize: 13, fontWeight: 700 }}>
                          {u.nombreCompleto?.[0]?.toUpperCase() ?? u.email?.[0]?.toUpperCase() ?? 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#1a2f40">{u.nombreCompleto}</Typography>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#6B7A8D', fontSize: 11 }}>
                            {u.idUsuario?.substring(0, 18)}…
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="#1a2f40">{u.cedula}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="#6B7A8D">{u.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="#1a2f40">{u.telefono ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="#6B7A8D" sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.direccion ?? '—'}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={u.rol}
                        size="small"
                        sx={{
                          bgcolor: u.rol === 'ADMIN' ? 'rgba(42,127,143,0.12)' : 'rgba(107,119,141,0.1)',
                          color: u.rol === 'ADMIN' ? TEAL_SOLID : '#6B7A8D',
                          fontWeight: 700, fontSize: 11,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={u.estado ? 'Activo' : 'Inactivo'} size="small"
                        sx={{ bgcolor: u.estado ? 'rgba(46,125,50,0.1)' : 'rgba(107,119,141,0.1)', color: u.estado ? '#2e7d32' : '#6B7A8D', fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {u.estado && (
                          <Tooltip title="Editar usuario">
                            <IconButton size="small" onClick={() => openEditDialog(u)} disabled={isContingency}
                              sx={{ color: TEAL_SOLID, bgcolor: 'rgba(42,127,143,0.08)', '&:hover': { bgcolor: 'rgba(42,127,143,0.15)', transform: 'scale(1.1)' } }}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={u.estado ? 'Desactivar usuario' : 'Activar usuario'}>
                          <span>
                            <IconButton size="small" onClick={() => handleConfirmToggle(u)} disabled={togglingId === u.idUsuario || isContingency}
                              sx={{ color: u.estado ? '#d32f2f' : '#2e7d32', bgcolor: u.estado ? 'rgba(211,47,47,0.08)' : 'rgba(46,125,50,0.08)', '&:hover': { transform: 'scale(1.1)' } }}>
                              {togglingId === u.idUsuario ? <CircularProgress size={16} /> : u.estado ? <PersonOffOutlined fontSize="small" /> : <PersonAddOutlined fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={listaVisible.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
        </Paper>

        {/* Modal de confirmación */}
        <Dialog open={confirmDlg.open} onClose={() => setConfirmDlg({ ...confirmDlg, open: false })} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>{confirmDlg.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{confirmDlg.message}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button onClick={() => setConfirmDlg({ ...confirmDlg, open: false })} variant="outlined" sx={{ borderRadius: 2, borderColor: 'rgba(0,0,0,0.15)', color: '#2e2e2e' }}>Cancelar</Button>
              <Button onClick={() => { confirmDlg.onConfirm(); setConfirmDlg({ ...confirmDlg, open: false }); }} variant="contained" sx={{ borderRadius: 2, bgcolor: TEAL_SOLID, '&:hover': { opacity: 0.9 } }}>Confirmar</Button>
            </Box>
          </Box>
        </Dialog>

        {/* Dialog editar usuario */}
        <Dialog open={openEdit} onClose={() => !saving && setOpenEdit(false)} maxWidth="sm" fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
          <Box sx={{ background: TEAL, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>Editar usuario</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>{editTarget?.email}</Typography>
            </Box>
            <IconButton size="small" onClick={() => !saving && setOpenEdit(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <DialogContent sx={{ pt: 3 }}>
            {editError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{editError}</Alert>}

            <TextField label="Nombre completo" name="nombreCompleto" value={editForm.nombreCompleto}
              onChange={handleEditChange} fullWidth required sx={{ mb: 2 }} disabled={saving} />
            <TextField label="Cédula" name="cedula" value={editForm.cedula}
              onChange={handleEditChange} fullWidth required sx={{ mb: 2 }} disabled={saving} />
            <TextField label="Teléfono" name="telefono" value={editForm.telefono}
              onChange={handleEditChange} fullWidth sx={{ mb: 2 }} disabled={saving} />
            <TextField label="Dirección" name="direccion" value={editForm.direccion}
              onChange={handleEditChange} fullWidth sx={{ mb: 3 }} disabled={saving} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1.2, borderRadius: 2, border: '1px solid rgba(42,127,143,0.15)', bgcolor: 'rgba(42,127,143,0.04)', mb: 3 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} color="#1a2f40">Estado</Typography>
                <Typography variant="caption" color="#6B7A8D">Usa el botón de la tabla para activar/desactivar</Typography>
              </Box>
              <Chip
                label={editForm.estado ? 'Activo' : 'Inactivo'}
                size="small"
                sx={{ bgcolor: editForm.estado ? 'rgba(46,125,50,0.1)' : 'rgba(107,119,141,0.1)', color: editForm.estado ? '#2e7d32' : '#6B7A8D', fontWeight: 700 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button fullWidth onClick={() => !saving && setOpenEdit(false)} disabled={saving}
                sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)', color: '#2e2e2e' }}>
                Cancelar
              </Button>
              <Button fullWidth variant="contained" onClick={handleEdit} disabled={saving}
                sx={{ borderRadius: 2, background: TEAL, py: 1.3, '&:hover': { opacity: 0.9 } }}>
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar cambios'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

      </Box>
    </>
  );
}
