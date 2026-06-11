import { useMemo, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Alert, Tooltip, Skeleton,
  TextField, InputAdornment, Button, Dialog, DialogContent, Divider,
  CircularProgress,
} from '@mui/material';
import {
  Refresh, ShoppingCartOutlined, ReceiptLongOutlined, SearchOutlined,
  CloseOutlined, VisibilityOutlined, CodeOutlined,
  DownloadOutlined, ClearOutlined,
} from '@mui/icons-material';
import { useApi } from '../hooks/useApi';
import {
  getCompras, getCompra,
  getFacturacionXml, getFacturacionDescargar, getFacturacionConsultar,
} from '../api/compras';

const TEAL       = 'linear-gradient(135deg, #1e6b7a 0%, #2a7f8f 45%, #246e7c 100%)';
const TEAL_SOLID = '#2a7f8f';

const KEYFRAMES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const HEADERS = ['# Factura', 'ID Usuario', 'Total', 'Estado', 'Fecha', 'Acciones'];

const ESTADO_STYLES = {
  ABIERTA:   { bg: 'rgba(42,127,143,0.12)', color: TEAL_SOLID   },
  CERRADA:   { bg: 'rgba(46,125,50,0.1)',   color: '#2e7d32'     },
  CANCELADA: { bg: 'rgba(211,47,47,0.1)',   color: '#d32f2f'     },
};

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
};

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((__, j) => (
        <TableCell key={j}><Skeleton animation="wave" sx={{ borderRadius: 1 }} /></TableCell>
      ))}
    </TableRow>
  ));
}

export default function ComprasPage() {
  const { data: compras, loading, error, refresh } = useApi(getCompras);

  // ── Filtro simple por # factura ─────────────────────────────────
  const [filtro, setFiltro] = useState('');
  const listaVisible = useMemo(() => {
    if (!compras) return [];
    if (!filtro.trim()) return compras;
    return compras.filter((c) => String(c.numeroFactura).includes(filtro.trim()));
  }, [compras, filtro]);

  // ── Modal detalle ────────────────────────────────────────────────
  const [openDetalle, setOpenDetalle]       = useState(false);
  const [detalle, setDetalle]               = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError]     = useState('');
  const [autorizada, setAutorizada]         = useState(null); // true | false | null

  const verDetalle = async (c) => {
    setDetalleLoading(true);
    setDetalle(null);
    setDetalleError('');
    setAutorizada(null);
    setOpenDetalle(true);
    setFacturaError('');
    try {
      const { data } = await getCompra(c.numeroFactura);
      setDetalle(data);
      // Carga el estado de autorización en paralelo (silencioso si falla)
      getFacturacionConsultar(c.numeroFactura)
        .then(({ data: comp }) => setAutorizada(comp?.autorizada ?? null))
        .catch(() => {});
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Error al cargar el detalle';
      setDetalleError(msg);
    } finally { setDetalleLoading(false); }
  };

  // ── Modal de previsualización XML ───────────────────────────────
  const [openPreview, setOpenPreview]       = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [facturaLoading, setFacturaLoading] = useState('');
  const [facturaError, setFacturaError]     = useState('');

  const abrirPreview = async () => {
    setFacturaLoading('xml'); setFacturaError('');
    try {
      const { data } = await getFacturacionXml(detalle.numeroFactura);
      setPreviewContent(data);
      setOpenPreview(true);
    } catch { setFacturaError('Error al obtener el XML.'); }
    finally { setFacturaLoading(''); }
  };

  const descargarBlob = (content, tipo) => {
    const isBlob   = content instanceof Blob;
    const mimeType = tipo === 'xml' ? 'application/xml' : 'text/html';
    const blob     = isBlob ? content : new Blob([content], { type: mimeType });
    const url      = URL.createObjectURL(blob);
    const link     = document.createElement('a');
    link.href      = url;
    link.download  = `factura-${detalle.numeroFactura}.${tipo}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDescargarXml = async () => {
    setFacturaLoading('dlxml'); setFacturaError('');
    try {
      const { data } = await getFacturacionDescargar(detalle.numeroFactura);
      descargarBlob(data, 'xml');
    } catch { setFacturaError('Error al descargar el XML.'); }
    finally { setFacturaLoading(''); }
  };

  const cerrarDetalle = () => {
    setOpenDetalle(false);
    setDetalle(null);
    setDetalleError('');
    setFacturaError('');
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
              <ShoppingCartOutlined />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>Compras</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>Historial de transacciones del sistema</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', position: 'relative', zIndex: 1 }}>
            {compras?.length > 0 && (
              <Box sx={{ px: 2, py: 0.8, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                  {listaVisible.length}{filtro ? ' filtradas' : ' compras'}
                </Typography>
              </Box>
            )}
            <Tooltip title="Recargar datos"><span>
              <IconButton onClick={refresh} disabled={loading} sx={{ color: 'rgba(255,255,255,0.75)', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <Refresh fontSize="small" />
              </IconButton>
            </span></Tooltip>
          </Box>
        </Box>

        {/* Filtro por # factura */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(42,127,143,0.08)', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}>
          <Typography variant="body2" fontWeight={700} color="#1a2f40" sx={{ minWidth: 140 }}>
            Buscar por # factura:
          </Typography>
          <TextField
            size="small" placeholder="Ej: 7" value={filtro} type="number"
            onChange={(e) => setFiltro(e.target.value)}
            sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 16, color: '#8fa0b0' }} /></InputAdornment> } }}
          />
          {filtro && (
            <Button size="small" startIcon={<ClearOutlined />} onClick={() => setFiltro('')}
              sx={{ borderRadius: 2, fontSize: 12, color: TEAL_SOLID, borderColor: TEAL_SOLID, border: '1px solid' }}>
              Ver todas
            </Button>
          )}
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* Tabla */}
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
                {loading ? <SkeletonRows /> : !listaVisible.length ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center' }}>
                      <ReceiptLongOutlined sx={{ fontSize: 48, color: '#c5cdd6', mb: 1.5, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" color="text.secondary">
                        {filtro ? `No existe la factura #${filtro}` : 'No hay compras registradas'}
                      </Typography>
                      {filtro && <Button size="small" onClick={() => setFiltro('')} sx={{ mt: 1, color: TEAL_SOLID }}>Ver todas</Button>}
                    </TableCell>
                  </TableRow>
                ) : listaVisible.map((c, idx) => {
                  const estadoStyle = ESTADO_STYLES[c.estado] ?? { bg: 'rgba(107,119,141,0.1)', color: '#6B7A8D' };
                  return (
                    <TableRow key={c.numeroFactura} sx={{
                      bgcolor: idx % 2 === 0 ? 'white' : 'rgba(42,127,143,0.02)',
                      '&:hover': { bgcolor: 'rgba(42,127,143,0.05)' },
                      '&:last-child td': { borderBottom: 0 },
                    }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'rgba(42,127,143,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReceiptLongOutlined sx={{ fontSize: 14, color: TEAL_SOLID }} />
                          </Box>
                          <Typography variant="body2" fontWeight={700} color="#1a2f40">#{c.numeroFactura}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#6B7A8D', bgcolor: 'rgba(0,0,0,0.04)', px: 1, py: 0.4, borderRadius: 1, display: 'inline-block' }}>
                          {(c.idUsuario ?? '—').substring(0, 16)}{(c.idUsuario ?? '').length > 16 ? '…' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="#1a2f40">
                          {c.totalCompra != null ? `$${Number(c.totalCompra).toFixed(2)}` : '—'}
                        </Typography>
                        <Typography variant="caption" color="#6B7A8D" sx={{ fontSize: 10 }}>
                          Sin IVA
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.estado ?? '—'} size="small"
                          sx={{ bgcolor: estadoStyle.bg, color: estadoStyle.color, fontWeight: 700, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="#6B7A8D">{formatDate(c.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Ver detalle y factura">
                          <IconButton size="small" onClick={() => verDetalle(c)}
                            sx={{ color: TEAL_SOLID, bgcolor: 'rgba(42,127,143,0.08)', '&:hover': { bgcolor: 'rgba(42,127,143,0.18)', transform: 'scale(1.1)' } }}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── Modal detalle + facturación ──────────────────────────── */}
        <Dialog open={openDetalle} onClose={cerrarDetalle} maxWidth="md" fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>

          {/* Header */}
          <Box sx={{ background: TEAL, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                Factura #{detalle?.numeroFactura}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {formatDate(detalle?.createdAt)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={cerrarDetalle} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <CloseOutlined />
            </IconButton>
          </Box>

          <DialogContent sx={{ pt: 3 }}>
            {detalleLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: TEAL_SOLID }} />
              </Box>
            ) : detalleError ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{detalleError}</Alert>
            ) : detalle && (
              <>
                {/* Info general */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="#6B7A8D" fontWeight={600}>ID Usuario</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.04)', px: 1, py: 0.4, borderRadius: 1 }}>
                      {detalle.idUsuario}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="#6B7A8D" fontWeight={600}>Estado</Typography>
                    <Chip label={detalle.estado ?? '—'} size="small"
                      sx={{ bgcolor: (ESTADO_STYLES[detalle.estado] ?? { bg: 'rgba(107,119,141,0.1)' }).bg, color: (ESTADO_STYLES[detalle.estado] ?? { color: '#6B7A8D' }).color, fontWeight: 700, fontSize: 11 }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="#6B7A8D" fontWeight={600}>Autorizada</Typography>
                    {autorizada === null
                      ? <Typography variant="caption" color="#6B7A8D">—</Typography>
                      : <Chip label={autorizada ? 'Sí' : 'No'} size="small"
                          sx={{ bgcolor: autorizada ? 'rgba(46,125,50,0.1)' : 'rgba(211,47,47,0.1)', color: autorizada ? '#2e7d32' : '#d32f2f', fontWeight: 700, fontSize: 11 }} />
                    }
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Productos */}
                <Typography variant="body2" fontWeight={700} color="#1a2f40" sx={{ mb: 1.5 }}>Productos</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  {(detalle.detalles ?? []).map((d, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5, borderRadius: 2, bgcolor: i % 2 === 0 ? 'rgba(42,127,143,0.04)' : 'white', border: '1px solid rgba(42,127,143,0.1)' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#1a2f40">{d.nombreProducto ?? `Producto #${d.idProducto}`}</Typography>
                        <Typography variant="caption" color="#6B7A8D">Cantidad: {d.cantidad}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={700} color={TEAL_SOLID}>${Number(d.precioUnitario).toFixed(2)} c/u</Typography>
                        <Typography variant="caption" color="#1a2f40" fontWeight={600}>Subtotal: ${(d.cantidad * d.precioUnitario).toFixed(2)}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Total */}
                <Box sx={{ px: 1, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" fontWeight={700} color="#1a2f40">Subtotal</Typography>
                      <Typography variant="caption" color="#6B7A8D">Sin IVA</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={800} color={TEAL_SOLID}>
                      ${Number(detalle.totalCompra ?? 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1, px: 1.5, py: 1, borderRadius: 2, bgcolor: 'rgba(46,125,50,0.06)', border: '1px dashed rgba(46,125,50,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="#2e7d32" fontWeight={600}>
                      💡 Precio final con IVA (12%) incluido en la factura generada
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="#2e7d32">
                      ${(Number(detalle.totalCompra ?? 0) * 1.12).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Botones facturación */}
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6B7A8D', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
                  GENERAR FACTURA
                </Typography>
                {facturaError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{facturaError}</Alert>}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={facturaLoading === 'xml' ? <CircularProgress size={14} /> : <CodeOutlined />}
                    onClick={abrirPreview} disabled={!!facturaLoading}
                    sx={{ borderRadius: 2, borderColor: TEAL_SOLID, color: TEAL_SOLID, fontWeight: 700, fontSize: 12, '&:hover': { bgcolor: 'rgba(42,127,143,0.06)' } }}>
                    Ver XML
                  </Button>
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Modal previsualización XML ───────────────────────────── */}
        <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth
          slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
          <Box sx={{ background: TEAL, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CodeOutlined sx={{ color: 'white' }} />
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Factura #{detalle?.numeroFactura} — XML
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Documento XML de la factura</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button variant="contained" size="small" startIcon={<DownloadOutlined />}
                onClick={() => descargarBlob(previewContent, 'xml')}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', fontWeight: 700, fontSize: 11, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                Descargar XML
              </Button>
              <IconButton size="small" onClick={() => setOpenPreview(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                <CloseOutlined />
              </IconButton>
            </Box>
          </Box>
          <DialogContent sx={{ p: 0 }}>
            <Box sx={{ p: 2.5, bgcolor: '#1a2535', minHeight: 500, overflow: 'auto' }}>
              <Typography component="pre" sx={{ color: '#a8d8b9', fontFamily: '"Fira Code", monospace', fontSize: 13, m: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.7 }}>
                {previewContent}
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>

      </Box>
    </>
  );
}
