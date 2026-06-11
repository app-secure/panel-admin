import { useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogContent,
  TextField, Alert, CircularProgress, Tooltip, Skeleton, Divider,
  InputAdornment,
} from '@mui/material';
import { Add, EditOutlined, Refresh, InventoryOutlined, CloseOutlined, AttachMoneyOutlined, StorefrontOutlined, SearchOutlined, ClearOutlined, DeleteOutlined } from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import { getProductos, getProducto, createProducto, updateProducto, desactivarProducto } from '../api/productos';

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

export default function ProductosPage() {
  const { data: productos, loading, error, refresh } = useApi(getProductos);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ msg: '', type: 'success' });

  const [deletingId, setDeletingId] = useState(null);

  const handleDesactivar = async (p) => {
    setDeletingId(p.idProducto);
    try {
      await desactivarProducto(p.idProducto);
      setSnack({ msg: `Producto "${p.nombre}" desactivado correctamente.`, type: 'success' });
      refresh();
    } catch {
      setSnack({ msg: 'Error al desactivar el producto.', type: 'error' });
    } finally { setDeletingId(null); }
  };

  // Filtro por ID
  const [idFiltro, setIdFiltro] = useState('');
  const [productoFiltrado, setProductoFiltrado] = useState(null);
  const [filtroLoading, setFiltroLoading] = useState(false);
  const [filtroError, setFiltroError] = useState('');

  const buscarPorId = async () => {
    if (!idFiltro.trim()) { setProductoFiltrado(null); setFiltroError(''); return; }
    setFiltroLoading(true); setFiltroError('');
    try {
      const res = await getProducto(idFiltro.trim());
      setProductoFiltrado(res.data);
    } catch {
      setFiltroError(`No se encontró un producto con ID ${idFiltro}.`);
      setProductoFiltrado(null);
    } finally { setFiltroLoading(false); }
  };

  const limpiarFiltro = () => { setIdFiltro(''); setProductoFiltrado(null); setFiltroError(''); };

  const listaVisible = productoFiltrado ? [productoFiltrado] : (productos ?? []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSwitch = (e) => setForm((f) => ({ ...f, estado: e.target.checked }));
  const openNew = () => { setForm(EMPTY_CREATE); setFormError(''); setOpenCreate(true); };
  const openEditDialog = (p) => { setEditTarget(p); setForm(toForm(p)); setFormError(''); setOpenEdit(true); };

  const validateProducto = (form) => {
    if (!form.nombre.trim())                           return 'El nombre del producto es obligatorio.';
    if (form.nombre.trim().length < 2)                 return 'El nombre debe tener al menos 2 caracteres.';
    if (form.precio === '' || form.precio === null)     return 'El precio es obligatorio.';
    if (isNaN(Number(form.precio)) || Number(form.precio) < 0) return 'El precio debe ser un número mayor o igual a 0.';
    if (form.stock === '' || form.stock === null)       return 'El stock es obligatorio.';
    if (isNaN(Number(form.stock)) || Number(form.stock) < 0)   return 'El stock debe ser un número mayor o igual a 0.';
    if (!Number.isInteger(Number(form.stock)))          return 'El stock debe ser un número entero.';
    if (form.urlImagen && !/^https?:\/\/.+/.test(form.urlImagen.trim())) return 'La URL de imagen debe comenzar con http:// o https://';
    return null;
  };

  const handleCreate = async () => {
    const err = validateProducto(form);
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
    const err = validateProducto(form);
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
            <Button variant="contained" startIcon={<Add />} onClick={openNew}
              sx={{ bgcolor: 'white', color: TEAL_SOLID, fontWeight: 700, '&:hover': { bgcolor: '#e8f5f7', transform: 'translateY(-1px)' } }}>
              Nuevo
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {snack.msg && <Alert severity={snack.type} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack({ msg: '' })}>{snack.msg}</Alert>}

        {/* Filtro por ID */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(42,127,143,0.08)', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" fontWeight={700} color="#1a2f40" sx={{ minWidth: 100 }}>Buscar por ID:</Typography>
          <TextField
            size="small" placeholder="Ej: 5" value={idFiltro}
            onChange={(e) => setIdFiltro(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarPorId()}
            disabled={filtroLoading}
            sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 16, color: '#8fa0b0' }} /></InputAdornment> } }}
          />
          <Button variant="contained" onClick={buscarPorId} disabled={filtroLoading || !idFiltro.trim()}
            sx={{ background: TEAL, borderRadius: 2, fontWeight: 700, fontSize: 12, px: 2 }}>
            {filtroLoading ? <CircularProgress size={16} color="inherit" /> : 'Buscar'}
          </Button>
          {(productoFiltrado || filtroError) && (
            <Button variant="outlined" startIcon={<ClearOutlined />} onClick={limpiarFiltro}
              sx={{ borderRadius: 2, fontSize: 12, color: TEAL_SOLID, borderColor: TEAL_SOLID }}>
              Ver todos
            </Button>
          )}
          {filtroError && <Typography variant="caption" color="error">{filtroError}</Typography>}
          {productoFiltrado && <Typography variant="caption" color="#2e7d32" fontWeight={600}>Mostrando producto ID {productoFiltrado.idProducto}</Typography>}
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
                {loading ? <SkeletonRows /> : !listaVisible.length ? (
                  <TableRow><TableCell colSpan={5} sx={{ py: 8, textAlign: 'center' }}>
                    <InventoryOutlined sx={{ fontSize: 48, color: '#c5cdd6', mb: 1.5, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">No hay productos registrados</Typography>
                  </TableCell></TableRow>
                ) : listaVisible.map((p, idx) => (
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
                      <Chip label="Activo" size="small"
                        sx={{ bgcolor: 'rgba(46,125,50,0.1)', color: '#2e7d32', fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar producto">
                          <IconButton size="small" onClick={() => openEditDialog(p)}
                            sx={{ color: TEAL_SOLID, bgcolor: 'rgba(42,127,143,0.08)', '&:hover': { bgcolor: 'rgba(42,127,143,0.15)', transform: 'scale(1.1)' } }}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Desactivar producto">
                          <span>
                            <IconButton size="small" onClick={() => handleDesactivar(p)} disabled={deletingId === p.idProducto}
                              sx={{ color: '#d32f2f', bgcolor: 'rgba(211,47,47,0.08)', '&:hover': { bgcolor: 'rgba(211,47,47,0.15)', transform: 'scale(1.1)' } }}>
                              {deletingId === p.idProducto ? <CircularProgress size={16} /> : <DeleteOutlined fontSize="small" />}
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
        </Paper>

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
