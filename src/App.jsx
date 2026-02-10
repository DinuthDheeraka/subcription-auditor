import { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import AdUnit from './AdUnit';
import {
  trackAddSubscription,
  trackRemoveSubscription,
  trackViewChange,
  trackProjectionChange,
  trackAuditSummary,
} from './analytics';

/* ── Data ──────────────────────────────────────────── */

const CATEGORIES = {
  Entertainment: { color: '#e63946', icon: '🎬' },
  Music: { color: '#e76f51', icon: '🎵' },
  SaaS: { color: '#2a9d8f', icon: '💻' },
  Gaming: { color: '#9b5de5', icon: '🎮' },
  Fitness: { color: '#00bbf9', icon: '💪' },
  News: { color: '#f4a261', icon: '📰' },
  Cloud: { color: '#577590', icon: '☁️' },
  AI: { color: '#43aa8b', icon: '🤖' },
  Food: { color: '#f9844a', icon: '🍔' },
  Other: { color: '#6c757d', icon: '📦' },
};

const PRESETS = [
  { name: 'Netflix', price: 17.99, category: 'Entertainment', alt: 'Tubi (Free with ads) or Amazon Prime Video ($8.99/mo)' },
  { name: 'Spotify', price: 11.99, category: 'Music', alt: 'YouTube Music ($10.99/mo) or free Spotify tier' },
  { name: 'ChatGPT Plus', price: 20.0, category: 'AI', alt: 'Claude Free tier or Gemini ($19.99/mo with Google One)' },
  { name: 'Claude Pro', price: 20.0, category: 'AI', alt: 'Free tier available with generous limits' },
  { name: 'YouTube Premium', price: 13.99, category: 'Entertainment', alt: 'Use uBlock Origin (free) or Brave browser' },
  { name: 'Disney+', price: 13.99, category: 'Entertainment', alt: 'Rotate subscriptions monthly — binge then cancel' },
  { name: 'Hulu', price: 9.99, category: 'Entertainment', alt: 'Bundle with Disney+ to save $5/mo' },
  { name: 'HBO Max', price: 16.99, category: 'Entertainment', alt: 'Rotate with other streaming — watch exclusives, cancel' },
  { name: 'Apple Music', price: 10.99, category: 'Music', alt: 'Switch to Spotify free tier or YouTube Music' },
  { name: 'Amazon Prime', price: 14.99, category: 'Entertainment', alt: 'Evaluate if free shipping savings justify cost' },
  { name: 'Adobe CC', price: 59.99, category: 'SaaS', alt: 'Affinity Suite (one-time $69.99) or Figma (free tier)' },
  { name: 'Microsoft 365', price: 9.99, category: 'SaaS', alt: 'Google Workspace (free) or LibreOffice (free)' },
  { name: 'Notion', price: 10.0, category: 'SaaS', alt: 'Obsidian (free) or Logseq (free)' },
  { name: 'iCloud+', price: 2.99, category: 'Cloud', alt: 'Google Drive 15GB (free) or Proton Drive' },
  { name: 'Google One', price: 2.99, category: 'Cloud', alt: 'iCloud+ or local NAS backup' },
  { name: 'Dropbox', price: 11.99, category: 'Cloud', alt: 'Google Drive (free 15GB) or Sync.com ($8/mo)' },
  { name: 'Xbox Game Pass', price: 17.99, category: 'Gaming', alt: 'Wait for sales on Steam or Epic freebies' },
  { name: 'PS Plus', price: 17.99, category: 'Gaming', alt: 'Buy used discs or wait for free monthly games' },
  { name: 'Gym Membership', price: 49.99, category: 'Fitness', alt: 'Home workout apps (free) or outdoor running' },
  { name: 'Headspace', price: 12.99, category: 'Fitness', alt: 'Insight Timer (free) or YouTube guided meditation' },
  { name: 'NYT Digital', price: 4.25, category: 'News', alt: 'AP News (free) or local library digital access' },
  { name: 'DoorDash DashPass', price: 9.99, category: 'Food', alt: 'Cook at home — average savings of $200+/mo' },
  { name: 'Uber One', price: 9.99, category: 'Food', alt: 'Compare per-order prices without membership' },
  { name: 'LinkedIn Premium', price: 29.99, category: 'SaaS', alt: 'Optimize free profile — most recruiters search free tier' },
  { name: 'Slack Pro', price: 8.75, category: 'SaaS', alt: 'Discord (free) or Slack free tier (90 day history)' },
  { name: 'GitHub Copilot', price: 10.0, category: 'AI', alt: 'Codeium (free) or Claude Code' },
  { name: 'Midjourney', price: 10.0, category: 'AI', alt: "DALL-E free credits or Stable Diffusion (free, local)" },
  { name: 'Grammarly', price: 12.0, category: 'SaaS', alt: 'LanguageTool (free) or Claude for writing' },
  { name: 'VPN (NordVPN)', price: 12.99, category: 'SaaS', alt: 'Proton VPN (free tier) or Mullvad ($5/mo)' },
  { name: 'Audible', price: 14.95, category: 'Entertainment', alt: 'Libby app (free with library card)' },
];

const ANNUAL_RETURN = 0.07;
const PRICE_HIKE_RATE = 0.08; // subs increase ~8%/yr historically

function futureValue(monthlyPayment, years) {
  const r = ANNUAL_RETURN / 12;
  const n = years * 12;
  return monthlyPayment * ((Math.pow(1 + r, n) - 1) / r);
}

function formatMoney(n) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n.toFixed(2)}`;
}

/* ── Tiny Components ───────────────────────────────── */

function CountUpValue({ value, format = v => `$${v.toFixed(2)}`, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const startTime = performance.now();
    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
    let frame;
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (value - start) * easeOutQuart(progress);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        prevRef.current = value;
      }
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return format(display);
}

function BloodDrip({ delay = 0, left }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: `${left}%`,
      width: 3, height: 60, borderRadius: '0 0 3px 3px', opacity: 0.3,
      background: 'linear-gradient(to bottom, #c1121f, transparent)',
      animation: `drip 3s ease-in ${delay}s infinite`,
    }} />
  );
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const value = data.value;
  const isMonthly = data.dataKey === 'price';
  return (
    <div style={{
      background: 'rgba(10,10,14,0.95)', border: '1px solid rgba(197,48,48,0.4)',
      borderRadius: 10, padding: '12px 16px', fontFamily: "'DM Sans', sans-serif",
      color: '#f1e4e4', fontSize: 13, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{data.name || data.payload?.name}</p>
      <p style={{ margin: '4px 0 0', color: '#c53030', fontWeight: 600 }}>
        {formatMoney(value)}{isMonthly ? '/mo' : ''}
      </p>
      {isMonthly && (
        <>
          <p style={{ margin: '2px 0 0', color: '#8a7a7a', fontSize: 11 }}>${(value * 12).toFixed(0)}/yr</p>
          <p style={{ margin: '2px 0 0', color: '#e63946', fontSize: 11 }}>${futureValue(value, 10).toFixed(0)} in 10yr</p>
        </>
      )}
    </div>
  );
};

function SubscriptionCard({ sub, onRemove, index }) {
  const cat = CATEGORIES[sub.category] || CATEGORIES.Other;
  const yearly = sub.price * 12;
  const tenYear = futureValue(sub.price, 10);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(20,20,28,0.9), rgba(30,15,20,0.9))',
      border: '1px solid rgba(197,48,48,0.2)', borderRadius: 12,
      padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
      animation: `fadeSlideIn 0.4s ease ${index * 0.05}s both`,
      position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(197,48,48,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(197,48,48,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, background: `${cat.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0, border: `1px solid ${cat.color}30`,
      }}>{cat.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, color: '#f1e4e4', fontSize: 14 }}>{sub.name}</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: `${cat.color}20`, color: cat.color, fontWeight: 500, letterSpacing: 0.3,
          }}>{sub.category}</span>
        </div>
        <div style={{ fontSize: 12, color: '#8a7a7a' }}>
          <span style={{ color: '#c53030', fontWeight: 600 }}>${sub.price.toFixed(2)}</span>/mo
          <span style={{ margin: '0 6px', opacity: 0.3 }}>•</span>${yearly.toFixed(0)}/yr
          <span style={{ margin: '0 6px', opacity: 0.3 }}>•</span>
          <span style={{ color: '#e63946' }}>${tenYear.toFixed(0)}</span> in 10yr
        </div>
        {sub.alt && (
          <div style={{
            fontSize: 11, color: '#2a9d8f', marginTop: 6, padding: '6px 10px', borderRadius: 6,
            background: 'rgba(42,157,143,0.08)', border: '1px solid rgba(42,157,143,0.15)', lineHeight: 1.4,
          }}>💡 {sub.alt}</div>
        )}
      </div>

      <button onClick={onRemove} style={{
        background: 'rgba(197,48,48,0.1)', border: '1px solid rgba(197,48,48,0.2)',
        color: '#c53030', borderRadius: 8, width: 32, height: 32,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0, transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,48,48,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,48,48,0.1)'}
      >×</button>
    </div>
  );
}

/* ── Main App ──────────────────────────────────────── */

export default function App() {
  const [subs, setSubs] = useState([]);
  const [showPresets, setShowPresets] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCategory, setCustomCategory] = useState('Other');
  const [searchPreset, setSearchPreset] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [projectionYears, setProjectionYears] = useState(10);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerFade, setTickerFade] = useState(true);
  const [userSalary, setUserSalary] = useState(60000);

  /* ── Core Derived Values ── */
  const totalMonthly = useMemo(() => subs.reduce((s, sub) => s + sub.price, 0), [subs]);
  const totalYearly = totalMonthly * 12;
  const totalOpportunityCost = useMemo(() => futureValue(totalMonthly, projectionYears), [totalMonthly, projectionYears]);
  const totalPaid = totalMonthly * 12 * projectionYears;
  const totalLost = totalOpportunityCost - totalPaid;

  /* ── Extended Calculations ── */
  const dailyCost = useMemo(() => totalMonthly / 30, [totalMonthly]);
  const weeklyCost = useMemo(() => (totalMonthly * 12) / 52, [totalMonthly]);
  const coffeeEquivalent = useMemo(() => Math.floor(totalMonthly / 5), [totalMonthly]);
  const avgPerSub = useMemo(() => subs.length > 0 ? totalMonthly / subs.length : 0, [totalMonthly, subs.length]);
  const mostExpensive = useMemo(() => subs.length > 0 ? [...subs].sort((a, b) => b.price - a.price)[0] : null, [subs]);
  const cheapest = useMemo(() => subs.length > 0 ? [...subs].sort((a, b) => a.price - b.price)[0] : null, [subs]);
  const top3Expensive = useMemo(() => [...subs].sort((a, b) => b.price - a.price).slice(0, 3), [subs]);
  const top3Savings = useMemo(() => {
    const monthly = top3Expensive.reduce((sum, s) => sum + s.price, 0);
    return { monthly, yearly: monthly * 12, tenYrOpp: futureValue(monthly, 10) };
  }, [top3Expensive]);

  /* ── Reality Check Calculations ── */
  const hourlyRate = useMemo(() => userSalary / 2080, [userSalary]); // 2080 work hours/year
  const workHoursPerMonth = useMemo(() => totalMonthly > 0 ? totalMonthly / hourlyRate : 0, [totalMonthly, hourlyRate]);
  const incomePercent = useMemo(() => userSalary > 0 ? (totalYearly / userSalary) * 100 : 0, [totalYearly, userSalary]);
  const freedomNumber = useMemo(() => totalYearly > 0 ? totalYearly / ANNUAL_RETURN : 0, [totalYearly]);
  const priceIn3yr = useMemo(() => totalMonthly * Math.pow(1 + PRICE_HIKE_RATE, 3), [totalMonthly]);
  const priceIn5yr = useMemo(() => totalMonthly * Math.pow(1 + PRICE_HIKE_RATE, 5), [totalMonthly]);
  const lifetimeCost40yr = useMemo(() => futureValue(totalMonthly, 40), [totalMonthly]);
  const groceryWeeksPerYear = useMemo(() => Math.floor(totalYearly / 150), [totalYearly]); // ~$150/week
  const flightsPerYear = useMemo(() => Math.floor(totalYearly / 350), [totalYearly]); // avg domestic
  const categoryCount = useMemo(() => {
    const map = {};
    subs.forEach(s => { map[s.category] = (map[s.category] || 0) + 1; });
    return map;
  }, [subs]);

  const categoryData = useMemo(() => {
    const map = {};
    subs.forEach(s => { map[s.category] = (map[s.category] || 0) + s.price * 12; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: +value.toFixed(2), color: CATEGORIES[name]?.color || '#6c757d' }))
      .sort((a, b) => b.value - a.value);
  }, [subs]);

  const projectionData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= projectionYears; y++) {
      data.push({ year: y, paid: +(totalMonthly * 12 * y).toFixed(0), opportunity: +futureValue(totalMonthly, y).toFixed(0) });
    }
    return data;
  }, [totalMonthly, projectionYears]);

  const tickerItems = useMemo(() => {
    if (subs.length === 0) return [];
    return [
      { label: 'Monthly Drain', value: `$${totalMonthly.toFixed(2)}` },
      { label: 'Active Subs', value: `${subs.length}` },
      { label: 'Daily Cost', value: `$${dailyCost.toFixed(2)}` },
      { label: 'Most Expensive', value: mostExpensive ? `${mostExpensive.name} ($${mostExpensive.price})` : '—' },
      { label: 'Work Hours/Mo', value: `${workHoursPerMonth.toFixed(1)}h` },
      { label: 'Income Used', value: `${incomePercent.toFixed(1)}%` },
    ];
  }, [subs, totalMonthly, dailyCost, mostExpensive, workHoursPerMonth, incomePercent]);

  /* ── Effects ── */
  useEffect(() => { trackViewChange(activeView); }, [activeView]);

  useEffect(() => {
    if (activeView === 'dashboard' && subs.length > 0) {
      trackAuditSummary(totalMonthly.toFixed(2), totalYearly.toFixed(0), subs.length);
    }
  }, [activeView, subs.length]);

  useEffect(() => {
    if (subs.length === 0) return;
    const interval = setInterval(() => {
      setTickerFade(false);
      setTimeout(() => {
        setTickerIndex(prev => (prev + 1) % tickerItems.length);
        setTickerFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [subs.length, tickerItems.length]);

  /* ── Handlers ── */
  const addPreset = (preset) => {
    setSubs(prev => [...prev, { ...preset, id: Date.now() + Math.random() }]);
    trackAddSubscription(preset.name, preset.price, preset.category, true);
  };

  const addCustom = () => {
    if (!customName.trim() || !customPrice) return;
    const price = parseFloat(customPrice);
    setSubs(prev => [...prev, { name: customName.trim(), price, category: customCategory, id: Date.now(), alt: null }]);
    trackAddSubscription(customName.trim(), price, customCategory, false);
    setCustomName('');
    setCustomPrice('');
  };

  const removeSub = (id) => {
    const sub = subs.find(s => s.id === id);
    if (sub) trackRemoveSubscription(sub.name);
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  const handleProjectionYears = (y) => {
    setProjectionYears(y);
    trackProjectionChange(y);
  };

  const filteredPresets = PRESETS.filter(
    p => p.name.toLowerCase().includes(searchPreset.toLowerCase()) && !subs.find(s => s.name === p.name)
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'manage', label: 'Subscriptions', icon: '📋' },
    { id: 'projection', label: 'Projection', icon: '📈' },
  ];

  /* ── Shared Styles ── */
  const card = {
    background: 'linear-gradient(135deg, rgba(20,20,28,0.85), rgba(30,15,20,0.85))',
    border: '1px solid rgba(197,48,48,0.12)', borderRadius: 14, padding: '22px 24px',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
  };
  const sectionLabel = {
    fontSize: 12, color: '#6a5a5a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16,
  };
  const inputStyle = {
    padding: '10px 14px', background: 'rgba(10,10,14,0.6)', border: '1px solid rgba(197,48,48,0.15)',
    borderRadius: 8, color: '#f1e4e4', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
  };
  const btnPrimary = {
    background: 'linear-gradient(135deg, #c53030, #9b2c2c)', border: 'none', color: '#fff',
    padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'transform 0.2s',
  };
  const miniStatStyle = {
    padding: '10px 14px', borderRadius: 8, background: 'rgba(10,10,14,0.4)',
    border: '1px solid rgba(197,48,48,0.08)', flex: '1 1 120px', minWidth: 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0e', position: 'relative', overflow: 'hidden' }}>

      {/* Blood drips */}
      {[5, 15, 28, 42, 55, 68, 78, 88, 95].map((l, i) => <BloodDrip key={i} left={l} delay={i * 0.7} />)}

      {/* Floating blood particles */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`particle-${i}`} style={{
          position: 'fixed',
          width: 4 + (i % 3) * 2,
          height: 4 + (i % 3) * 2,
          borderRadius: '50%',
          background: '#c53030',
          opacity: 0.06 + (i % 3) * 0.02,
          left: `${10 + i * 11}%`,
          top: `${20 + (i * 17) % 60}%`,
          animation: `floatParticle ${6 + i * 1.5}s ease-in-out ${i * 0.8}s infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      ))}

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '-30%', right: '-20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(197,48,48,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(42,157,143,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Header ── */}
      <header style={{ padding: '28px 32px 20px', borderBottom: '1px solid rgba(197,48,48,0.12)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{
              fontSize: 32, display: 'inline-block',
              animation: 'gentlePulse 2.5s ease-in-out infinite',
            }}>🧛</span>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, margin: 0,
              background: 'linear-gradient(90deg, #f1e4e4, #c53030, #e63946, #f1e4e4)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5,
              animation: 'shimmer 4s linear infinite',
            }}>Subscription Auditor</h1>
          </div>
          <p style={{ color: '#6a5a5a', fontSize: 13, margin: 0, letterSpacing: 0.3 }}>
            Your subscriptions are bleeding you dry. Let's see the damage.
          </p>

          {/* Stats Ticker */}
          {subs.length > 0 && tickerItems.length > 0 && (
            <div style={{
              marginTop: 14, padding: '8px 16px',
              background: 'rgba(197,48,48,0.06)', border: '1px solid rgba(197,48,48,0.1)',
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
              overflow: 'hidden',
            }}>
              <span style={{ fontSize: 10, color: '#5a4a4a', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', flexShrink: 0 }}>LIVE</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c53030', flexShrink: 0, animation: 'pulseGlow 2s ease infinite' }} />
              <div style={{
                fontSize: 13, color: '#f1e4e4', fontWeight: 500,
                opacity: tickerFade ? 1 : 0,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ color: '#6a5a5a', marginRight: 6 }}>{tickerItems[tickerIndex]?.label}:</span>
                <span style={{ color: '#c53030', fontWeight: 600 }}>{tickerItems[tickerIndex]?.value}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── TOP AD — Leaderboard ── */}
      <div style={{ maxWidth: 1100, margin: '16px auto 0', padding: '0 32px' }}>
        <AdUnit slot="6207711192" format="horizontal" style={{ minHeight: 90 }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 32px',
        display: 'flex', gap: 4,
        borderBottom: '1px solid rgba(197,48,48,0.08)',
      }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveView(item.id)} style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeView === item.id ? '2px solid #c53030' : '2px solid transparent',
            color: activeView === item.id ? '#f1e4e4' : '#6a5a5a',
            padding: '12px 18px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif", transition: 'all 0.3s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
            onMouseEnter={e => { if (activeView !== item.id) e.currentTarget.style.color = '#8a7a7a'; }}
            onMouseLeave={e => { if (activeView !== item.id) e.currentTarget.style.color = '#6a5a5a'; }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      {/* ── 3-Column Layout: Left Ad | Content | Right Ad ── */}
      <div className="content-grid">

        {/* Left Side Ad */}
        <aside className="side-ad">
          <AdUnit slot="6207711192" format="vertical" style={{ minHeight: 600 }} />
        </aside>

        {/* Main Content */}
        <main style={{ padding: '24px 0 60px', minWidth: 0 }}>

          {/* ╔══════════════════════════════════════════╗
             ║           DASHBOARD VIEW                 ║
             ╚══════════════════════════════════════════╝ */}
          {activeView === 'dashboard' && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease' }}>
              {subs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeSlideIn 0.5s ease' }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>🧛</div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, marginBottom: 12, color: '#f1e4e4' }}>
                    No subscriptions yet
                  </h2>
                  <p style={{ color: '#6a5a5a', fontSize: 14, maxWidth: 400, margin: '0 auto 28px' }}>
                    Head over to the <strong style={{ color: '#c53030' }}>Subscriptions</strong> tab to add your monthly drains and see where your money is really going.
                  </p>
                  <button onClick={() => setActiveView('manage')} style={{ ...btnPrimary, padding: '12px 28px', fontSize: 14 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >+ Add Subscriptions</button>
                </div>
              ) : (
                <>
                  {/* Primary Stat Cards — 4 big */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
                    {[
                      { label: 'Monthly Drain', value: totalMonthly, format: v => `$${v.toFixed(2)}`, color: '#c53030' },
                      { label: 'Yearly Drain', value: totalYearly, format: v => `$${v.toFixed(0)}`, color: '#e63946' },
                      { label: `${projectionYears}yr Opportunity Cost`, value: totalOpportunityCost, format: v => formatMoney(v), color: '#9b2c2c', glow: true },
                      { label: 'Investment Lost', value: totalLost, format: v => formatMoney(v), color: '#e76f51' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        ...card, padding: '18px 20px',
                        animation: `fadeSlideIn 0.5s ease ${i * 0.08}s both${stat.glow ? ', pulseGlow 3s ease infinite' : ''}`,
                        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${stat.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)'; }}
                      >
                        <div style={{ fontSize: 10, color: '#6a5a5a', fontWeight: 500, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>{stat.label}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: stat.color }}>
                          <CountUpValue value={stat.value} format={stat.format} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Secondary Stat Cards — 4 smaller */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Daily Drain', value: dailyCost, format: v => `$${v.toFixed(2)}`, color: '#f4a261' },
                      { label: 'Weekly Drain', value: weeklyCost, format: v => `$${v.toFixed(2)}`, color: '#577590' },
                      { label: 'Coffees/Month', value: coffeeEquivalent, format: v => `${Math.floor(v)} cups`, color: '#43aa8b' },
                      { label: 'Avg Per Sub', value: avgPerSub, format: v => `$${v.toFixed(2)}`, color: '#9b5de5' },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        ...card, padding: '14px 16px',
                        animation: `fadeSlideIn 0.4s ease ${0.3 + i * 0.06}s both`,
                        transition: 'transform 0.2s', cursor: 'default',
                      }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ fontSize: 9, color: '#6a5a5a', fontWeight: 500, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: stat.color }}>
                          <CountUpValue value={stat.value} format={stat.format} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Reality Check Panel ── */}
                  <div style={{
                    ...card, marginBottom: 24,
                    background: 'linear-gradient(135deg, rgba(18,18,28,0.9), rgba(25,18,22,0.9))',
                    border: '1px solid rgba(197,48,48,0.15)',
                    animation: 'fadeSlideIn 0.5s ease 0.2s both',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🔍</span>
                        <div style={{ ...sectionLabel, marginBottom: 0, color: '#f4a261' }}>Reality Check</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#5a4a4a' }}>Annual salary:</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: 10, fontSize: 12, color: '#6a5a5a', pointerEvents: 'none' }}>$</span>
                          <input
                            type="number" value={userSalary}
                            onChange={e => setUserSalary(Math.max(0, Number(e.target.value)))}
                            style={{ ...inputStyle, width: 110, paddingLeft: 22, fontSize: 12, textAlign: 'right' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 1: Work & Income */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                      <div style={miniStatStyle}>
                        <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Work Hours/Month</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#f4a261', fontFamily: "'Playfair Display', serif" }}>
                          {workHoursPerMonth.toFixed(1)}h
                        </div>
                        <div style={{ fontSize: 10, color: '#4a3a3a', marginTop: 2 }}>to pay for subscriptions</div>
                      </div>
                      <div style={miniStatStyle}>
                        <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Income Used</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: incomePercent > 10 ? '#e63946' : '#f4a261', fontFamily: "'Playfair Display', serif" }}>
                          {incomePercent.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: 10, color: '#4a3a3a', marginTop: 2 }}>of your annual salary</div>
                      </div>
                      <div style={miniStatStyle}>
                        <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Freedom Number</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#2a9d8f', fontFamily: "'Playfair Display', serif" }}>
                          {formatMoney(freedomNumber)}
                        </div>
                        <div style={{ fontSize: 10, color: '#4a3a3a', marginTop: 2 }}>invested to cover subs forever</div>
                      </div>
                      <div style={miniStatStyle}>
                        <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Lifetime Cost (40yr)</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#e63946', fontFamily: "'Playfair Display', serif" }}>
                          {formatMoney(lifetimeCost40yr)}
                        </div>
                        <div style={{ fontSize: 10, color: '#4a3a3a', marginTop: 2 }}>with 7% opportunity cost</div>
                      </div>
                    </div>

                    {/* Row 2: Price Hike Forecast */}
                    <div style={{
                      padding: '14px 18px', borderRadius: 10,
                      background: 'rgba(197,48,48,0.05)', border: '1px solid rgba(197,48,48,0.1)',
                      marginBottom: 14,
                    }}>
                      <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
                        Price Hike Forecast — subs increase ~8%/year
                      </div>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#6a5a5a' }}>Today: </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1e4e4' }}>${totalMonthly.toFixed(2)}/mo</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: '#6a5a5a' }}>In 3 years: </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#e76f51' }}>${priceIn3yr.toFixed(2)}/mo</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: '#6a5a5a' }}>In 5 years: </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#e63946' }}>${priceIn5yr.toFixed(2)}/mo</span>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Spending Equivalents */}
                    <div style={{
                      padding: '14px 18px', borderRadius: 10,
                      background: 'rgba(42,157,143,0.04)', border: '1px solid rgba(42,157,143,0.1)',
                    }}>
                      <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
                        What You Could Buy Instead (yearly)
                      </div>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>✈️</span>
                          <span style={{ fontSize: 13, color: '#f1e4e4' }}><strong>{flightsPerYear}</strong> <span style={{ color: '#6a5a5a' }}>flights</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>🛒</span>
                          <span style={{ fontSize: 13, color: '#f1e4e4' }}><strong>{groceryWeeksPerYear}</strong> <span style={{ color: '#6a5a5a' }}>weeks of groceries</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 16 }}>☕</span>
                          <span style={{ fontSize: 13, color: '#f1e4e4' }}><strong>{coffeeEquivalent * 12}</strong> <span style={{ color: '#6a5a5a' }}>coffees/year</span></span>
                        </div>
                        {mostExpensive && cheapest && subs.length > 1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 16 }}>📊</span>
                            <span style={{ fontSize: 13, color: '#f1e4e4' }}>
                              <span style={{ color: '#6a5a5a' }}>Costliest is</span> <strong>{(mostExpensive.price / cheapest.price).toFixed(1)}x</strong> <span style={{ color: '#6a5a5a' }}>cheapest</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Savings Insight Card */}
                  {top3Expensive.length > 0 && (
                    <div style={{
                      ...card, marginBottom: 24,
                      background: 'linear-gradient(135deg, rgba(15,25,20,0.9), rgba(20,30,25,0.9))',
                      border: '1px solid rgba(42,157,143,0.2)',
                      animation: 'fadeSlideIn 0.6s ease 0.3s both, pulseGlow 4s ease infinite',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 0 30px rgba(42,157,143,0.05)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 22 }}>💡</span>
                        <div style={{ ...sectionLabel, marginBottom: 0, color: '#2a9d8f' }}>Savings Potential — Top 3 Drains</div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                        {top3Expensive.map((sub, i) => {
                          const cat = CATEGORIES[sub.category] || CATEGORIES.Other;
                          return (
                            <div key={sub.id} style={{
                              flex: '1 1 150px', padding: '12px 16px', borderRadius: 10,
                              background: 'rgba(42,157,143,0.06)', border: '1px solid rgba(42,157,143,0.12)',
                              animation: `fadeSlideIn 0.4s ease ${0.4 + i * 0.1}s both`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 14 }}>{cat.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#f1e4e4' }}>{sub.name}</span>
                              </div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: '#c53030', fontFamily: "'Playfair Display', serif" }}>
                                ${sub.price.toFixed(2)}<span style={{ fontSize: 11, fontWeight: 400, color: '#5a4a4a' }}>/mo</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{
                        padding: '14px 18px', borderRadius: 10,
                        background: 'rgba(42,157,143,0.08)', border: '1px solid rgba(42,157,143,0.15)',
                        display: 'flex', gap: 24, flexWrap: 'wrap',
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: '#5a6a5a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Monthly Savings</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#2a9d8f', fontFamily: "'Playfair Display', serif" }}>${top3Savings.monthly.toFixed(2)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#5a6a5a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Yearly Savings</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#2a9d8f', fontFamily: "'Playfair Display', serif" }}>${top3Savings.yearly.toFixed(0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: '#5a6a5a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>10yr Recovery (7%)</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#43aa8b', fontFamily: "'Playfair Display', serif" }}>{formatMoney(top3Savings.tenYrOpp)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Charts Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {/* Pie + Category Progress Bars */}
                    <div style={{ ...card, animation: 'fadeSlideIn 0.5s ease 0.2s both' }}>
                      <div style={sectionLabel}>Spending by Category (Yearly)</div>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                            animationBegin={200} animationDuration={800} animationEasing="ease-out"
                          >
                            {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ marginTop: 16 }}>
                        {categoryData.map((c, i) => {
                          const pct = totalYearly > 0 ? (c.value / totalYearly) * 100 : 0;
                          return (
                            <div key={c.name} style={{
                              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                              animation: `fadeSlideIn 0.4s ease ${i * 0.08}s both`,
                            }}>
                              <span style={{ fontSize: 11, color: '#8a7a7a', width: 80, textAlign: 'right', flexShrink: 0 }}>
                                {c.name}
                                {categoryCount[c.name] && <span style={{ color: '#4a3a3a', marginLeft: 3 }}>({categoryCount[c.name]})</span>}
                              </span>
                              <div style={{ flex: 1, height: 6, background: 'rgba(197,48,48,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  width: `${pct}%`, height: '100%', background: c.color, borderRadius: 3,
                                  transition: 'width 0.8s ease',
                                }} />
                              </div>
                              <span style={{ fontSize: 10, color: '#6a5a5a', width: 75, flexShrink: 0 }}>{pct.toFixed(0)}% · ${c.value.toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Bar — Custom Rendered */}
                    <div style={{ ...card, animation: 'fadeSlideIn 0.5s ease 0.3s both' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                        <div style={sectionLabel}>Top Drains (Monthly)</div>
                        <div style={{ fontSize: 10, color: '#4a3a3a', fontWeight: 500 }}>
                          {subs.length > 8 ? `Showing top 8 of ${subs.length}` : `${Math.min(subs.length, 8)} subscriptions`}
                        </div>
                      </div>
                      {(() => {
                        const topDrains = [...subs].sort((a, b) => b.price - a.price).slice(0, 8);
                        const maxPrice = topDrains[0]?.price || 1;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {topDrains.map((sub, i) => {
                              const cat = CATEGORIES[sub.category] || CATEGORIES.Other;
                              const pct = totalMonthly > 0 ? ((sub.price / totalMonthly) * 100) : 0;
                              const barPct = (sub.price / maxPrice) * 100;
                              const isTop = i === 0;
                              return (
                                <div key={sub.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                                  borderRadius: 10,
                                  background: isTop ? 'rgba(197,48,48,0.06)' : 'transparent',
                                  border: isTop ? '1px solid rgba(197,48,48,0.12)' : '1px solid transparent',
                                  animation: `fadeSlideIn 0.5s ease ${0.3 + i * 0.07}s both`,
                                  transition: 'background 0.3s, border-color 0.3s, transform 0.2s',
                                  cursor: 'default',
                                }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(197,48,48,0.08)'; e.currentTarget.style.borderColor = 'rgba(197,48,48,0.15)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = isTop ? 'rgba(197,48,48,0.06)' : 'transparent'; e.currentTarget.style.borderColor = isTop ? 'rgba(197,48,48,0.12)' : 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                  {/* Rank badge */}
                                  <div style={{
                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700,
                                    background: isTop ? 'rgba(197,48,48,0.2)' : i < 3 ? 'rgba(197,48,48,0.1)' : 'rgba(255,255,255,0.03)',
                                    color: isTop ? '#e63946' : i < 3 ? '#c53030' : '#5a4a4a',
                                    border: `1px solid ${isTop ? 'rgba(230,57,70,0.3)' : 'rgba(197,48,48,0.08)'}`,
                                  }}>
                                    {isTop ? '👑' : `#${i + 1}`}
                                  </div>

                                  {/* Icon + Name */}
                                  <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                                    <span style={{ fontSize: 13, flexShrink: 0 }}>{cat.icon}</span>
                                    <span style={{
                                      fontSize: 11, fontWeight: isTop ? 600 : 500,
                                      color: isTop ? '#f1e4e4' : '#8a7a7a',
                                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>{sub.name}</span>
                                  </div>

                                  {/* Animated bar */}
                                  <div style={{ flex: 1, minWidth: 0, height: 20, position: 'relative' }}>
                                    <div style={{
                                      position: 'absolute', inset: 0,
                                      background: 'rgba(255,255,255,0.02)',
                                      borderRadius: 6,
                                    }} />
                                    <div style={{
                                      height: '100%', borderRadius: 6,
                                      background: `linear-gradient(90deg, ${cat.color}CC, ${cat.color})`,
                                      boxShadow: isTop ? `0 0 12px ${cat.color}40, 0 0 4px ${cat.color}20` : `0 0 6px ${cat.color}15`,
                                      width: `${barPct}%`,
                                      animation: `slideInBar 0.8s ease ${0.5 + i * 0.1}s both`,
                                      '--bar-width': `${barPct}%`,
                                      position: 'relative',
                                      transition: 'box-shadow 0.3s',
                                    }}>
                                      {/* Shimmer overlay on top bar */}
                                      {isTop && (
                                        <div style={{
                                          position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden',
                                        }}>
                                          <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                                            backgroundSize: '200% 100%',
                                            animation: 'shimmer 2.5s linear infinite',
                                          }} />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price + Percentage */}
                                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 72 }}>
                                    <div style={{
                                      fontSize: 12, fontWeight: 700, color: isTop ? '#e63946' : '#c53030',
                                      fontFamily: "'Playfair Display', serif",
                                    }}>${sub.price.toFixed(2)}</div>
                                    <div style={{ fontSize: 9, color: '#5a4a4a', fontWeight: 500, marginTop: 1 }}>{pct.toFixed(1)}% of total</div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Bottom summary bar */}
                            <div style={{
                              marginTop: 8, padding: '10px 14px', borderRadius: 8,
                              background: 'rgba(197,48,48,0.04)', border: '1px solid rgba(197,48,48,0.08)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              animation: `fadeSlideIn 0.5s ease ${0.3 + topDrains.length * 0.07 + 0.1}s both`,
                            }}>
                              <span style={{ fontSize: 10, color: '#5a4a4a', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                {topDrains.length > 0 && mostExpensive ? `${mostExpensive.name} drains ${((mostExpensive.price / totalMonthly) * 100).toFixed(0)}% of your budget` : 'No data'}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#c53030' }}>
                                ${topDrains.reduce((s, sub) => s + sub.price, 0).toFixed(2)}/mo
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* MID-CONTENT AD */}
                  <div style={{ marginBottom: 20 }}>
                    <AdUnit slot="6207711192" format="auto" />
                  </div>

                  {/* Vampire Area Chart */}
                  <div style={{ ...card, animation: 'fadeSlideIn 0.5s ease 0.4s both' }}>
                    <div style={sectionLabel}>The Vampire Effect — Opportunity Cost Over {projectionYears} Years</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={projectionData} margin={{ left: 10, right: 10 }}>
                        <defs>
                          <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c53030" stopOpacity={0.3} /><stop offset="100%" stopColor="#c53030" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e63946" stopOpacity={0.4} /><stop offset="100%" stopColor="#e63946" stopOpacity={0} /></linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fill: '#5a4a4a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#5a4a4a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="paid" name="Total Paid" stroke="#6a5a5a" fill="url(#gP)" strokeWidth={2}
                          animationBegin={200} animationDuration={1000} animationEasing="ease-out"
                        />
                        <Area type="monotone" dataKey="opportunity" name="Opportunity Cost" stroke="#c53030" fill="url(#gO)" strokeWidth={2}
                          animationBegin={400} animationDuration={1000} animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                      <span style={{ fontSize: 11, color: '#6a5a5a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: '#6a5a5a', borderRadius: 2, display: 'inline-block' }} /> Total Paid
                      </span>
                      <span style={{ fontSize: 11, color: '#c53030', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: '#c53030', borderRadius: 2, display: 'inline-block' }} /> With 7% Returns
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ╔══════════════════════════════════════════╗
             ║           MANAGE VIEW                    ║
             ╚══════════════════════════════════════════╝ */}
          {activeView === 'manage' && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease' }}>
              {/* Quick Add */}
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ ...sectionLabel, marginBottom: 0 }}>⚡ Quick Add — Popular Subscriptions</div>
                  <button onClick={() => setShowPresets(!showPresets)} style={{
                    background: 'rgba(197,48,48,0.1)', border: '1px solid rgba(197,48,48,0.2)',
                    color: '#c53030', padding: '6px 14px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                  }}>{showPresets ? 'Hide' : 'Show All'}</button>
                </div>
                <input type="text" placeholder="Search presets... (Netflix, Spotify, ChatGPT...)"
                  value={searchPreset} onChange={e => { setSearchPreset(e.target.value); if (!showPresets) setShowPresets(true); }}
                  style={{ ...inputStyle, width: '100%', marginBottom: showPresets ? 12 : 0 }}
                />
                {showPresets && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 250, overflowY: 'auto', padding: '4px 0', animation: 'slideDown 0.3s ease' }}>
                    {filteredPresets.map(p => (
                      <button key={p.name} onClick={() => addPreset(p)} style={{
                        background: 'rgba(10,10,14,0.6)', border: `1px solid ${CATEGORIES[p.category]?.color || '#6c757d'}30`,
                        color: '#f1e4e4', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = CATEGORIES[p.category]?.color || '#6c757d'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = `${CATEGORIES[p.category]?.color || '#6c757d'}30`; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <span>{CATEGORIES[p.category]?.icon}</span>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        <span style={{ color: '#c53030', fontWeight: 600 }}>${p.price}</span>
                      </button>
                    ))}
                    {filteredPresets.length === 0 && <div style={{ color: '#5a4a4a', fontSize: 13, padding: 8 }}>No matching presets found.</div>}
                  </div>
                )}
              </div>

              {/* Custom Add — compact */}
              <div style={{ ...card, marginBottom: 20, padding: '16px 20px' }}>
                <div style={{ ...sectionLabel, marginBottom: 10, fontSize: 11 }}>✏️ Custom Subscription</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input placeholder="Name" value={customName} onChange={e => setCustomName(e.target.value)} style={{ ...inputStyle, flex: '1 1 160px' }} />
                  <input placeholder="$/month" type="number" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} style={{ ...inputStyle, flex: '0 1 100px' }} />
                  <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={{ ...inputStyle, flex: '0 1 140px', background: 'rgba(10,10,14,0.8)' }}>
                    {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{CATEGORIES[c].icon} {c}</option>)}
                  </select>
                  <button onClick={addCustom} style={btnPrimary}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >+ Add</button>
                </div>
              </div>

              {/* ── Subscription List ── */}
              {subs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', animation: 'fadeSlideIn 0.5s ease' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🦇</div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#f1e4e4', marginBottom: 8 }}>
                    No subscriptions tracked yet
                  </h3>
                  <p style={{ color: '#5a4a4a', fontSize: 13, maxWidth: 380, margin: '0 auto 24px' }}>
                    Start by searching above or quick-add a popular service below.
                  </p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {PRESETS.slice(0, 5).map(p => (
                      <button key={p.name} onClick={() => addPreset(p)} style={{
                        background: 'rgba(197,48,48,0.08)', border: '1px solid rgba(197,48,48,0.18)',
                        color: '#f1e4e4', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,48,48,0.18)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,48,48,0.08)'}
                      >
                        {CATEGORIES[p.category]?.icon} {p.name} · ${p.price}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* List Header with Summary */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14, padding: '0 4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f1e4e4' }}>Your Subscriptions</span>
                      <span style={{
                        fontSize: 11, padding: '2px 10px', borderRadius: 20,
                        background: 'rgba(197,48,48,0.12)', color: '#c53030', fontWeight: 600,
                      }}>{subs.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: '#6a5a5a' }}>Total: <span style={{ color: '#c53030', fontWeight: 600 }}>${totalMonthly.toFixed(2)}/mo</span></span>
                      <span style={{ color: '#6a5a5a' }}><span style={{ color: '#e63946', fontWeight: 600 }}>${totalYearly.toFixed(0)}/yr</span></span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {subs.map((sub, i) => <SubscriptionCard key={sub.id} sub={sub} onRemove={() => removeSub(sub.id)} index={i} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ╔══════════════════════════════════════════╗
             ║          PROJECTION VIEW                 ║
             ╚══════════════════════════════════════════╝ */}
          {activeView === 'projection' && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease' }}>
              {subs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#5a4a4a' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
                  <p>Add subscriptions first to see projections.</p>
                </div>
              ) : (
                <>
                  <div style={{ ...card, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={sectionLabel}>Projection Timeline</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {[5, 10, 20, 30].map(y => (
                          <button key={y} onClick={() => handleProjectionYears(y)} style={{
                            background: projectionYears === y ? 'rgba(197,48,48,0.2)' : 'rgba(10,10,14,0.4)',
                            border: `1px solid ${projectionYears === y ? 'rgba(197,48,48,0.4)' : 'rgba(197,48,48,0.1)'}`,
                            color: projectionYears === y ? '#f1e4e4' : '#5a4a4a',
                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                          }}>{y}yr</button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={projectionData} margin={{ left: 10, right: 10 }}>
                        <defs>
                          <linearGradient id="gP2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6a5a5a" stopOpacity={0.3} /><stop offset="100%" stopColor="#6a5a5a" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gO2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c53030" stopOpacity={0.4} /><stop offset="100%" stopColor="#c53030" stopOpacity={0} /></linearGradient>
                        </defs>
                        <XAxis dataKey="year" tick={{ fill: '#5a4a4a', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#5a4a4a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => formatMoney(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="paid" name="Total Paid" stroke="#6a5a5a" fill="url(#gP2)" strokeWidth={2}
                          animationBegin={200} animationDuration={1000} animationEasing="ease-out"
                        />
                        <Area type="monotone" dataKey="opportunity" name="With 7% Returns" stroke="#c53030" fill="url(#gO2)" strokeWidth={2.5}
                          animationBegin={400} animationDuration={1000} animationEasing="ease-out"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 12 }}>
                      <span style={{ fontSize: 11, color: '#6a5a5a', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: '#6a5a5a', borderRadius: 2, display: 'inline-block' }} /> Total Paid
                      </span>
                      <span style={{ fontSize: 11, color: '#c53030', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 12, height: 3, background: '#c53030', borderRadius: 2, display: 'inline-block' }} /> Opportunity Cost (7% compounding)
                      </span>
                    </div>
                  </div>

                  {/* AD between chart and table */}
                  <div style={{ marginBottom: 20 }}>
                    <AdUnit slot="6207711192" format="auto" />
                  </div>

                  {/* Table */}
                  <div style={card}>
                    <div style={sectionLabel}>Individual Subscription Impact — {projectionYears} Years</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(197,48,48,0.15)' }}>
                            {['Subscription', 'Monthly', 'Yearly', `${projectionYears}yr Paid`, `${projectionYears}yr Opportunity`, 'Lost Returns'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6a5a5a', fontWeight: 600, fontSize: 11, letterSpacing: 0.5 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...subs].sort((a, b) => b.price - a.price).map(sub => {
                            const paid = sub.price * 12 * projectionYears;
                            const opp = futureValue(sub.price, projectionYears);
                            return (
                              <tr key={sub.id} style={{ borderBottom: '1px solid rgba(197,48,48,0.06)' }}>
                                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{CATEGORIES[sub.category]?.icon} {sub.name}</td>
                                <td style={{ padding: '10px 12px', color: '#8a7a7a' }}>${sub.price.toFixed(2)}</td>
                                <td style={{ padding: '10px 12px', color: '#8a7a7a' }}>${(sub.price * 12).toFixed(0)}</td>
                                <td style={{ padding: '10px 12px', color: '#c53030' }}>${paid.toFixed(0)}</td>
                                <td style={{ padding: '10px 12px', color: '#e63946', fontWeight: 600 }}>${opp.toFixed(0)}</td>
                                <td style={{ padding: '10px 12px', color: '#e76f51' }}>${(opp - paid).toFixed(0)}</td>
                              </tr>
                            );
                          })}
                          <tr style={{ borderTop: '2px solid rgba(197,48,48,0.25)' }}>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#f1e4e4' }}>Total</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#c53030' }}>${totalMonthly.toFixed(2)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#c53030' }}>${totalYearly.toFixed(0)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#c53030' }}>${totalPaid.toFixed(0)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#e63946' }}>${totalOpportunityCost.toFixed(0)}</td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#e76f51' }}>${totalLost.toFixed(0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Right Side Ad */}
        <aside className="side-ad">
          <AdUnit slot="6207711192" format="vertical" style={{ minHeight: 600 }} />
        </aside>
      </div>

      {/* ── BOTTOM AD — Footer ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px 20px' }}>
        <AdUnit slot="6207711192" format="horizontal" style={{ minHeight: 90 }} />
      </div>

      <footer style={{
        textAlign: 'center', padding: '24px 32px',
        borderTop: '1px solid rgba(197,48,48,0.08)', color: '#3a2a2a', fontSize: 11,
      }}>
        <span style={{ opacity: 0.6 }}>🧛</span>
        <span style={{ margin: '0 8px' }}>Subscription Auditor</span>
        <span style={{ opacity: 0.4 }}>—</span>
        <span style={{ margin: '0 8px', color: '#4a3a3a' }}>Your money deserves better. No data leaves your browser.</span>
      </footer>
    </div>
  );
}
