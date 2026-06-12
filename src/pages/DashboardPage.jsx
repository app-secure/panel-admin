import { useMemo } from 'react';
import { Box, Typography, Stack, Paper, Divider, CircularProgress } from '@mui/material';
import {
  PeopleOutlined, InventoryOutlined, ShoppingCartOutlined,
  TrendingUpOutlined, AttachMoneyOutlined, ArrowForwardOutlined,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { getUsuarios } from '../api/usuarios';
import { getProductos } from '../api/productos';
import { getCompras } from '../api/compras';

const TEAL       = 'linear-gradient(135deg, #1e6b7a 0%, #2a7f8f 45%, #246e7c 100%)';
const TEAL_SOLID = '#2a7f8f';
const COLORS     = [TEAL_SOLID, '#2e7d32', '#f57c00', '#7b1fa2'];

const KEYFRAMES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const fmt = (n) => `$${Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function KpiCard({ label, value, sub, icon, color, bg, onClick, delay }) {
  return (
    <Paper elevation={0} onClick={onClick} sx={{
      flex: 1, p: 3, cursor: onClick ? 'pointer' : 'default',
      border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3,
      transition: 'all 0.2s ease',
      animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
      '&:hover': onClick ? { boxShadow: '0 8px 24px rgba(42,127,143,0.15)', transform: 'translateY(-3px)', borderColor: 'rgba(42,127,143,0.25)' } : {},
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ color: '#9aa5b1', fontSize: 10, letterSpacing: '0.12em', mb: 0.8 }}>{sub.toUpperCase()}</Typography>
          <Typography sx={{ color: '#1a2530', fontWeight: 800, fontSize: 26, lineHeight: 1.1 }}>{value}</Typography>
          <Typography sx={{ color: '#9aa5b1', fontSize: 12, mt: 0.5 }}>{label}</Typography>
        </Box>
        <Box sx={{ color, bgcolor: bg, p: 1.3, borderRadius: 1.5 }}>{icon}</Box>
      </Box>
      {onClick && (
        <>
          <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.06)' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#9aa5b1', fontSize: 10, letterSpacing: '0.08em' }}>IR AL MÓDULO</Typography>
            <ArrowForwardOutlined sx={{ color, fontSize: 14 }} />
          </Box>
        </>
      )}
    </Paper>
  );
}

function ChartCard({ title, children, delay }) {
  return (
    <Paper elevation={0} sx={{
      p: 3, border: '1px solid rgba(0,0,0,0.07)', borderRadius: 3,
      animation: `slideUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box sx={{ width: 3, height: 14, background: TEAL, borderRadius: 1 }} />
        <Typography sx={{ color: '#2d3748', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em' }}>
          {title.toUpperCase()}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

const TooltipMoney = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid rgba(42,127,143,0.2)', borderRadius: 2, p: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Typography variant="caption" fontWeight={700} color="#1a2f40">{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption" color="#6B7A8D">{fmt(p.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hora    = new Date().getHours();
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
  const nombre  = user?.email?.split('@')[0] ?? 'Admin';

  const { data: usuarios }  = useApi(getUsuarios);
  const { data: productos } = useApi(getProductos);
  const { data: compras }   = useApi(getCompras);

  // ── KPIs ────────────────────────────────────────────────────────
  const usuariosActivos  = useMemo(() => (usuarios ?? []).filter((u) => u.estado).length, [usuarios]);
  const totalProductos   = useMemo(() => (productos ?? []).length, [productos]);
  const totalCompras     = useMemo(() => (compras ?? []).length, [compras]);
  const ingresoTotal     = useMemo(() => (compras ?? []).reduce((s, c) => s + Number(c.totalCompra ?? 0), 0), [compras]);
  const ingresoConIva    = useMemo(() => ingresoTotal * 1.15, [ingresoTotal]);

  // ── Ingresos por mes (últimos 6 meses) ──────────────────────────
  const ingresosPorMes = useMemo(() => {
    const map = {};
    (compras ?? []).forEach((c) => {
      if (!c.createdAt) return;
      const d   = new Date(c.createdAt);
      const key = d.toLocaleString('es-EC', { month: 'short', year: '2-digit' });
      map[key]  = (map[key] ?? 0) + Number(c.totalCompra ?? 0);
    });
    return Object.entries(map).slice(-6).map(([mes, total]) => ({ mes, total: +total.toFixed(2) }));
  }, [compras]);

  // ── Compras por estado ───────────────────────────────────────────
  const comprasPorEstado = useMemo(() => {
    const map = {};
    (compras ?? []).forEach((c) => { const e = c.estado ?? 'DESCONOCIDO'; map[e] = (map[e] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [compras]);

  // ── Roles de usuarios ────────────────────────────────────────────
  const usuariosPorRol = useMemo(() => {
    const map = {};
    (usuarios ?? []).forEach((u) => { const r = u.rol ?? 'SIN ROL'; map[r] = (map[r] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [usuarios]);

  const loading = !usuarios && !productos && !compras;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* Banner */}
        <Paper elevation={0} sx={{
          p: 3, color: 'white', position: 'relative', overflow: 'hidden',
          background: TEAL, boxShadow: '0 4px 20px rgba(26,95,110,0.3)', borderRadius: 3,
          animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
          '&::before': { content: '""', position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' },
          '&::after':  { content: '""', position: 'absolute', left: -30, bottom: -50, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.08)', pointerEvents: 'none' },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <TrendingUpOutlined sx={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
                <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.5)' }}>PANEL ADMINISTRATIVO</Typography>
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 0.3 }}>{saludo}, {nombre}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.05em' }}>
                {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3.5 }}>
              {[['3', 'Módulos'], ['Online', 'Estado'], ['Activa', 'API']].map(([v, k]) => (
                <Box key={k} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 17, lineHeight: 1 }}>{v}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.12em', mt: 0.4 }}>{k.toUpperCase()}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: TEAL_SOLID }} /></Box>
        ) : (
          <>
            {/* KPI Cards */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <KpiCard label="Usuarios activos" sub="Cuentas del sistema" value={usuariosActivos ?? '—'}
                icon={<PeopleOutlined sx={{ fontSize: 22 }} />} color={TEAL_SOLID} bg="rgba(42,127,143,0.1)"
                onClick={() => navigate('/usuarios')} delay={0.08} />
              <KpiCard label="Productos registrados" sub="Catálogo activo" value={totalProductos ?? '—'}
                icon={<InventoryOutlined sx={{ fontSize: 22 }} />} color="#2e7d32" bg="rgba(46,125,50,0.1)"
                onClick={() => navigate('/productos')} delay={0.16} />
              <KpiCard label="Compras totales" sub="Transacciones" value={totalCompras ?? '—'}
                icon={<ShoppingCartOutlined sx={{ fontSize: 22 }} />} color="#f57c00" bg="rgba(245,124,0,0.1)"
                onClick={() => navigate('/compras')} delay={0.24} />
              <KpiCard label={`${fmt(ingresoConIva)} con IVA`} sub="Ingresos totales" value={fmt(ingresoTotal)}
                icon={<AttachMoneyOutlined sx={{ fontSize: 22 }} />} color="#7b1fa2" bg="rgba(123,31,162,0.1)"
                delay={0.32} />
            </Stack>

            {/* Gráficos fila 1 */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
              {/* Ingresos por mes */}
              <Box sx={{ flex: 2 }}>
                <ChartCard title="Ingresos por mes (sin IVA)" delay={0.36}>
                  {ingresosPorMes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin datos suficientes</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ingresosPorMes} margin={{ top: 4, right: 8, bottom: 0, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9aa5b1' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9aa5b1' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<TooltipMoney />} />
                        <Bar dataKey="total" fill={TEAL_SOLID} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </Box>

              {/* Compras por estado */}
              <Box sx={{ flex: 1 }}>
                <ChartCard title="Compras por estado" delay={0.4}>
                  {comprasPorEstado.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin datos</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={comprasPorEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {comprasPorEstado.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#6B7A8D' }}>{v}</span>} />
                        <Tooltip formatter={(v) => [`${v} compras`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </Box>
            </Stack>

            {/* Gráficos fila 2 */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
              {/* Línea de ingresos acumulados */}
              <Box sx={{ flex: 2 }}>
                <ChartCard title="Ingreso acumulado por mes" delay={0.44}>
                  {ingresosPorMes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin datos suficientes</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={ingresosPorMes.reduce((acc, d, i) => {
                        const prev = acc[i - 1]?.acumulado ?? 0;
                        return [...acc, { ...d, acumulado: +(prev + d.total).toFixed(2) }];
                      }, [])} margin={{ top: 4, right: 8, bottom: 0, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9aa5b1' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9aa5b1' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<TooltipMoney />} />
                        <Line type="monotone" dataKey="acumulado" stroke={TEAL_SOLID} strokeWidth={2.5} dot={{ fill: TEAL_SOLID, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </Box>

              {/* Usuarios por rol */}
              <Box sx={{ flex: 1 }}>
                <ChartCard title="Usuarios por rol" delay={0.48}>
                  {usuariosPorRol.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>Sin datos</Typography>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={usuariosPorRol} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                          {usuariosPorRol.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#6B7A8D' }}>{v}</span>} />
                        <Tooltip formatter={(v, n) => [`${v} usuarios`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </Box>
            </Stack>
          </>
        )}
      </Box>
    </>
  );
}
