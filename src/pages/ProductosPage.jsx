import { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogContent,
  TextField, Alert, CircularProgress, Tooltip, Skeleton, Divider,
  InputAdornment, TablePagination,
} from '@mui/material';
import { Add, EditOutlined, Refresh, InventoryOutlined, CloseOutlined, AttachMoneyOutlined, StorefrontOutlined, SearchOutlined, ClearOutlined, DeleteOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { getProductos, getProductosInactivos, createProducto, updateProducto, desactivarProducto, activarProducto } from '../api/productos';
import { useContingency } from '../auth/ContingencyContext';

const TEAL = 'linear-gradient(135deg, #1e6b7a 0%, #2a7f8f 45%, #246e7c 100%)';
const TEAL_SOLID = '#2a7f8f';

const KEYFRAMES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const EMPTY_CREATE = { nombre: '', precio: '', stock: '', urlImagen: '' };
const toForm = (p) => ({ nombre: p.nombre ?? '', precio: p.precio ?? '', stock: p.stock ?? '', urlImagen: p.urlImagen ?? '', estado: true });
const HEADERS = ['Producto', 'Precio', 'Stock', 'Estado', 'Acciones'];

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => (<TableCell key={j}><Skeleton animation="wave" sx={{ borderRadius: 1 }} /></TableCell>))}</TableRow>
  ));
}

function DialogHeader({ title, subtitle, onClose }) {
  return (
    <Box sx={{ background: TEAL, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>{subtitle}</Typography>}
      </Box>
      <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}>
        <CloseOutlined />
      </IconButton>
    </Box>
  );
}

function ProductForm({ form, onChange, saving, showEstado }) {
  return (
    <>
      <TextField label="Nombre del producto" name="nombre" value={form.nombre} onChange={onChange} fullWidth required sx={{ mb: 2 }} disabled={saving} />
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField label="Precio ($)" name="precio" type="number" value={form.precio} onChange={onChange} fullWidth required disabled={saving}
          slotProps={{ input: { startAdornment: <AttachMoneyOutlined sx={{ color: '#6B7A8D', mr: 0.5, fontSize: 18 }} />, inputProps: { min: 0, step: 0.01 } } }} />
        <TextField label="Stock" name="stock" type="number" value={form.stock} onChange={onChange} fullWidth required disabled={saving}
          slotProps={{ input: { inputProps: { min: 0, step: 1 } } }} />
      </Box>
      <TextField label="URL de imagen" name="urlImagen" value={form.urlImagen} onChange={onChange} fullWidth disabled={saving} placeholder="https://..." sx={{ mb: showEstado ? 2 : 0 }} />
      {showEstado && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, border: '1px solid rgba(42,127,143,0.15)', bgcolor: 'rgba(42,127,143,0.04)' }}>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#1a2f40">Estado del producto</Typography>
            <Typography variant="caption" color="#6B7A8D">Usa el botón de la tabla para desactivar</Typography>
          </Box>
          <Chip
            label={form.estado ? 'Activo' : 'Inactivo'}
            size="small"
            sx={{ bgcolor: form.estado ? 'rgba(46,125,50,0.1)' : 'rgba(107,119,141,0.1)', color: form.estado ? '#2e7d32' : '#6B7A8D', fontWeight: 700 }}
          />
        </Box>
      )}
    </>
  );
}

const getTodosLosProductosCombined = async () => {
  const [activos, inactivos] = await Promise.all([
    getProductos(),
    getProductosInactivos()
  ]);
  return {
    data: [
      ...activos.data.map(p => ({ ...p, estado: true })),
      ...inactivos.data.map(p => ({ ...p, estado: false }))
    ]
  };
};

export default function ProductosPage() {
  const { data: productos, loading, error, refresh } = useApi(getTodosLosProductosCombined);
  const { isContingency } = useContingency();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ msg: '', type: 'success' });

  const [togglingId, setTogglingId] = useState(null);

  // Estados para búsqueda por nombre, filtro de estado y paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'ACTIVOS' | 'INACTIVOS'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Estado para el modal de confirmación personalizado
  const [confirmDlg, setConfirmDlg] = useState({ open: false, title: '', message: '', onConfirm: null });

  const handleConfirmToggle = (p) => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    const isActivating = !p.estado;
    const title = isActivating ? 'Activar Producto' : 'Desactivar Producto';
    const message = isActivating
      ? `¿Estás seguro de que deseas volver a activar el producto "${p.nombre}"?`
      : `¿Estás seguro de que deseas desactivar el producto "${p.nombre}"?`;

    setConfirmDlg({
      open: true,
      title,
      message,
      onConfirm: () => executeToggleEstado(p)
    });
  };

  const executeToggleEstado = async (p) => {
    setTogglingId(p.idProducto);
    try {
      if (p.estado) {
        await desactivarProducto(p.idProducto);
        setSnack({ msg: `Producto "${p.nombre}" desactivado correctamente.`, type: 'success' });
      } else {
        await activarProducto(p.idProducto);
        setSnack({ msg: `Producto "${p.nombre}" activado correctamente.`, type: 'success' });
      }
      refresh();
    } catch {
      setSnack({ msg: `Error al cambiar el estado del producto.`, type: 'error' });
    } finally { setTogglingId(null); }
  };

  const listaVisible = useMemo(() => {
    if (!productos) return [];
    return productos.filter((p) => {
      const matchesSearch = p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesState = true;
      if (filtroEstado === 'ACTIVOS') matchesState = p.estado === true;
      if (filtroEstado === 'INACTIVOS') matchesState = p.estado === false;
      return matchesSearch && matchesState;
    });
  }, [productos, searchQuery, filtroEstado]);

  const paginatedList = useMemo(() => {
    return listaVisible.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [listaVisible, page, rowsPerPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'nombre') {
      // Remove invalid characters: \ < > ; + @ . * ' | ¡ ? = : { } $ # ! & [ ] and control chars \n, \r, \t
      finalValue = finalValue.replace(/[\\+@.*'|¡?=:;{}$#!&[\]<>\n\r\t]/g, '');
      // Remove double hyphens --
      while (finalValue.includes('--')) {
        finalValue = finalValue.replace('--', '');
      }
    }
    setForm((f) => ({ ...f, [name]: finalValue }));
  };
  const handleSwitch = (e) => setForm((f) => ({ ...f, estado: e.target.checked }));
  const openNew = () => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    setForm(EMPTY_CREATE); setFormError(''); setOpenCreate(true);
  };
  const openEditDialog = (p) => {
    if (isContingency) {
      setSnack({ msg: 'NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA', type: 'error' });
      return;
    }
    setEditTarget(p); setForm(toForm(p)); setFormError(''); setOpenEdit(true);
  };

  const validateProducto = (form, isCreating = false) => {
    if (!form.nombre.trim())                           return 'El nombre del producto es obligatorio.';
    if (form.nombre.trim().length < 2)                 return 'El nombre debe tener al menos 2 caracteres.';
    if (/([\\+@.*'|¡?=:;{}$#!&[\]<>])|--|[\n\r\t]/.test(form.nombre)) {
      return 'El nombre del producto no puede contener caracteres especiales (+, @, ., *, \', |, ¡, ?, =, :, ;, {, }, $, #, !, &, [, ], \\, <, >, --) ni saltos de línea/tabulaciones.';
    }
    if (form.precio === '' || form.precio === null)     return 'El precio es obligatorio.';
    if (isNaN(Number(form.precio)) || Number(form.precio) < 0) return 'El precio debe ser un número mayor o igual a 0.';
    if (form.stock === '' || form.stock === null)       return 'El stock es obligatorio.';
    
    const stockVal = Number(form.stock);
    if (isNaN(stockVal))                                return 'El stock debe ser un número.';
    if (isCreating) {
      if (stockVal <= 0)                                return 'El stock debe ser un número mayor a 0.';
    } else {
      if (stockVal < 0)                                 return 'El stock debe ser un número mayor o igual a 0.';
    }
    if (!Number.isInteger(stockVal))                    return 'El stock debe ser un número entero.';
    if (form.urlImagen && !/^https?:\/\/.+/.test(form.urlImagen.trim())) return 'La URL de imagen debe comenzar con http:// o https://';
    return null;
  };

  const handleCreate = async () => {
    if (isContingency) {
      setFormError('NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA');
      return;
    }
    const err = validateProducto(form, true);
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError('');
    try {
      await createProducto({ nombre: form.nombre, precio: form.precio ? parseFloat(form.precio) : undefined, stock: form.stock ? parseInt(form.stock) : undefined, urlImagen: form.urlImagen || undefined });
      setOpenCreate(false);
      setSnack({ msg: 'Producto creado correctamente.', type: 'success' });
      refresh();
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Error al crear el producto.');
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (isContingency) {
      setFormError('NO SE PUEDE REALIZAR ESTA ACCIÓN PORQUE EL SISTEMA ESTÁ EN CONTINGENCIA');
      return;
    }
    const err = validateProducto(form, false);
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError('');
    try {
      await updateProducto(editTarget.idProducto, { nombre: form.nombre, precio: form.precio ? parseFloat(form.precio) : undefined, stock: form.stock !== '' ? parseInt(form.stock) : undefined, urlImagen: form.urlImagen || undefined });
      setOpenEdit(false);
      setSnack({ msg: 'Producto actualizado.', type: 'success' });
      refresh();
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Error al actualizar el producto.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <Box>
        {/* Header */}
        <Box sx={{
          background: TEAL, borderRadius: 3, p: 3, mb: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(26,95,110,0.3)',
          animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
          '&::before': { content: '""', position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' },
          '&::after':  { content: '""', position: 'absolute', left: -30, bottom: -50, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,0,0,0.08)' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box sx={{ width: 50, height: 50, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <StorefrontOutlined />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>Productos</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>Gestión del catálogo de productos</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {productos?.length !== undefined && (
              <Box sx={{ px: 2, py: 0.8, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{productos.length} productos</Typography>
              </Box>
            )}
            <Tooltip title="Recargar"><span>
              <IconButton onClick={refresh} disabled={loading} sx={{ color: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Refresh fontSize="small" />
              </IconButton>
            </span></Tooltip>
            <Button variant="contained" startIcon={<Add />} onClick={openNew} disabled={isContingency}
              sx={{ bgcolor: 'white', color: TEAL_SOLID, fontWeight: 700, '&:hover': { bgcolor: '#e8f5f7', transform: 'translateY(-1px)' } }}>
              Nuevo
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {snack.msg && <Alert severity={snack.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack({ msg: '' })}>{snack.msg}</Alert>}

        {/* Panel de Búsqueda y Filtro */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(42,127,143,0.08)', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexGrow: 1, minWidth: 260 }}>
            <Typography variant="body2" fontWeight={700} color="#1a2f40">Buscar:</Typography>
            <TextField
              size="small" placeholder="Buscar por nombre..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              slotProps={{ input: { 
                startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 16, color: '#8fa0b0' }} /></InputAdornment>,
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }}>
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
                    <TableCell key={h} sx={{ background: TEAL, color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 12, letterSpacing: 0.5, py: 2 }}>{h.toUpperCase()}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <SkeletonRows /> : !paginatedList.length ? (
                  <TableRow><TableCell colSpan={5} sx={{ py: 8, textAlign: 'center' }}>
                    <InventoryOutlined sx={{ fontSize: 48, color: '#c5cdd6', mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">No hay productos registrados</Typography>
                  </TableCell></TableRow>
                ) : paginatedList.map((p, idx) => (
                  <TableRow key={p.idProducto} sx={{ bgcolor: idx % 2 === 0 ? 'white' : 'rgba(42,127,143,0.02)', '&:hover': { bgcolor: 'rgba(42,127,143,0.05)' }, '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {p.urlImagen ? (
                          <Box component="img" src={p.urlImagen} alt={p.nombre}
                            sx={{ width: 36, height: 36, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(42,127,143,0.15)' }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(42,127,143,0.1)', display: p.urlImagen ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <InventoryOutlined sx={{ color: TEAL_SOLID, fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="#1a2f40">{p.nombre}</Typography>
                          <Typography variant="caption" color="#6B7A8D">ID: {p.idProducto}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700} color="#1a2f40">{p.precio != null ? `$${Number(p.precio).toFixed(2)}` : '—'}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5, borderRadius: 1.5, bgcolor: (p.stock ?? 0) > 0 ? 'rgba(46,125,50,0.08)' : 'rgba(211,47,47,0.08)' }}>
                        <Typography variant="body2" fontWeight={600} color={(p.stock ?? 0) > 0 ? '#2e7d32' : '#d32f2f'}>{p.stock ?? 0}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.estado ? 'Activo' : 'Inactivo'} 
                        size="small"
                        sx={{ 
                          bgcolor: p.estado ? 'rgba(46,125,50,0.1)' : 'rgba(107,119,141,0.1)', 
                          color: p.estado ? '#2e7d32' : '#6B7A8D', 
                          fontWeight: 700, 
                          fontSize: 11 
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {p.estado && (
                          <Tooltip title="Editar producto">
                            <IconButton size="small" onClick={() => openEditDialog(p)} disabled={isContingency}
                              sx={{ color: TEAL_SOLID, bgcolor: 'rgba(42,127,143,0.08)', '&:hover': { bgcolor: 'rgba(42,127,143,0.15)', transform: 'scale(1.1)' } }}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={p.estado ? 'Desactivar producto' : 'Activar producto'}>
                          <span>
                            <IconButton size="small" onClick={() => handleConfirmToggle(p)} disabled={togglingId === p.idProducto || isContingency}
                              sx={{ 
                                color: p.estado ? '#d32f2f' : '#2e7d32', 
                                bgcolor: p.estado ? 'rgba(211,47,47,0.08)' : 'rgba(46,125,50,0.08)', 
                                '&:hover': { transform: 'scale(1.1)' } 
                              }}>
                              {togglingId === p.idProducto ? <CircularProgress size={16} /> : p.estado ? <DeleteOutlined fontSize="small" /> : <CheckCircleOutlined fontSize="small" />}
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

        {/* Dialog crear */}
        <Dialog open={openCreate} onClose={() => !saving && setOpenCreate(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
          <DialogHeader title="Nuevo producto" subtitle="Agrega un producto al catálogo" onClose={() => !saving && setOpenCreate(false)} />
          <DialogContent sx={{ pt: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
            <ProductForm form={form} onChange={handleChange} saving={saving} showEstado={false} />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button fullWidth onClick={() => !saving && setOpenCreate(false)} disabled={saving} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)', color: '#2e2e2e' }}>Cancelar</Button>
              <Button fullWidth variant="contained" onClick={handleCreate} disabled={saving || !form.nombre || form.precio === '' || form.stock === ''} sx={{ borderRadius: 2, background: TEAL, py: 1.3, '&:hover': { opacity: 0.9 } }}>
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Crear producto'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Dialog editar */}
        <Dialog open={openEdit} onClose={() => !saving && setOpenEdit(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
          <DialogHeader title="Editar producto" subtitle={editTarget?.nombre} onClose={() => !saving && setOpenEdit(false)} />
          <DialogContent sx={{ pt: 3 }}>
            {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
            <ProductForm form={form} onChange={handleChange} saving={saving} showEstado />
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button fullWidth onClick={() => !saving && setOpenEdit(false)} disabled={saving} sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.15)', color: '#2e2e2e' }}>Cancelar</Button>
              <Button fullWidth variant="contained" onClick={handleEdit} disabled={saving || !form.nombre || form.precio === '' || form.stock === ''} sx={{ borderRadius: 2, background: TEAL, py: 1.3, '&:hover': { opacity: 0.9 } }}>
                {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar cambios'}
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
}
