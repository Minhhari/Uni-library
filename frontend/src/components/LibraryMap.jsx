import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookAPI } from '../services/api';

// ─── Shelf capacity limits ─────────────────────────────────────────────────
const MAX_TITLES = 5;   // max distinct book titles per shelf
const MAX_QUANTITY = 50;  // max total physical copies per shelf

export const LIBRARY_ZONES = [
    { id: 'A', label: 'Khu A', sublabel: 'Khoa học', color: '#6366f1', bg: '#eef2ff', shelves: ['A1', 'A2', 'A3', 'A4'] },
    { id: 'B', label: 'Khu B', sublabel: 'Kỹ thuật', color: '#0ea5e9', bg: '#e0f2fe', shelves: ['B1', 'B2', 'B3', 'B4'] },
    { id: 'C', label: 'Khu C', sublabel: 'Văn học', color: '#ec4899', bg: '#fdf2f8', shelves: ['C1', 'C2', 'C3', 'C4'] },
    { id: 'D', label: 'Khu D', sublabel: 'Lịch sử', color: '#f59e0b', bg: '#fffbeb', shelves: ['D1', 'D2', 'D3', 'D4'] },
    { id: 'E', label: 'Khu E', sublabel: 'Kinh tế', color: '#10b981', bg: '#ecfdf5', shelves: ['E1', 'E2', 'E3', 'E4'] },
    { id: 'F', label: 'Khu F', sublabel: 'Ngoại ngữ', color: '#8b5cf6', bg: '#f5f3ff', shelves: ['F1', 'F2', 'F3', 'F4'] },
    { id: 'G', label: 'Khu G', sublabel: 'Tham khảo', color: '#64748b', bg: '#f8fafc', shelves: ['G1', 'G2', 'G3', 'G4'] },
];

export function parseLocation(locationStr) {
    if (!locationStr) return null;
    const clean = locationStr.trim().toUpperCase().replace(/KỆ|KE\s*/gi, '').trim();
    const match = clean.match(/^([A-G])(\d+)$/);
    if (!match) return null;
    const [, zone, num] = match;
    const shelfId = `${zone}${num}`;
    const zoneData = LIBRARY_ZONES.find(z => z.id === zone);
    if (!zoneData || !zoneData.shelves.includes(shelfId)) return null;
    return { zone, shelf: shelfId, zoneData };
}

// ─── Shelf Inspection Panel ────────────────────────────────────────────────
const ShelfPanel = ({ shelfId, zoneData, onClose }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        bookAPI.getBooks({ location: `Kệ ${shelfId}`, limit: 20 })
            .then(res => {
                if (res.data?.success) setBooks(res.data.data || []);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [shelfId]);

    return (
        <div style={{
            marginTop: 12,
            background: '#fff',
            border: `2px solid ${zoneData.color}22`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            animation: 'slideDown 0.25s ease',
        }}>
            <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* Panel header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: `linear-gradient(135deg, ${zoneData.bg}, #fff)`,
                borderBottom: `1.5px solid ${zoneData.color}18`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: zoneData.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>shelves</span>
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: 14, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            {zoneData.label} — Kệ {shelfId}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                            {zoneData.sublabel} · {loading ? '...' : `${books.length} đầu sách`}
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: '#f1f5f9', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#64748b',
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
            </div>

            {/* Book list */}
            <div style={{ padding: '10px 14px 14px', maxHeight: 320, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ height: 64, borderRadius: 12, background: '#f8fafc', animation: 'pulse 1.5s ease infinite' }} />
                        ))}
                    </div>
                ) : books.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36, display: 'block', marginBottom: 8, opacity: 0.4 }}>
                            inventory_2
                        </span>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Kệ đang trống</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {books.map(book => {
                            const available = book.available > 0 && book.status === 'available';
                            return (
                                <Link
                                    key={book._id}
                                    to={`/books/${book._id}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 10px', borderRadius: 12,
                                        border: '1.5px solid #f1f5f9',
                                        background: '#fafafa',
                                        transition: 'all 0.15s',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = zoneData.bg;
                                            e.currentTarget.style.borderColor = `${zoneData.color}44`;
                                            e.currentTarget.style.transform = 'translateX(3px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = '#fafafa';
                                            e.currentTarget.style.borderColor = '#f1f5f9';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        {/* Thumbnail */}
                                        <div style={{ width: 36, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                            {book.cover_image ? (
                                                <img src={book.cover_image} alt={book.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{
                                                    width: '100%', height: '100%',
                                                    background: `linear-gradient(135deg, ${zoneData.color}cc, ${zoneData.color})`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>menu_book</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: 12.5, fontWeight: 800, color: '#0f172a',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {book.title}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                                                {book.author}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                                <span style={{
                                                    fontSize: 9.5, fontWeight: 800, padding: '1.5px 7px',
                                                    borderRadius: 6, letterSpacing: '0.04em',
                                                    background: available ? '#ecfdf5' : '#fef2f2',
                                                    color: available ? '#059669' : '#dc2626',
                                                    border: `1px solid ${available ? '#6ee7b7' : '#fca5a5'}`,
                                                }}>
                                                    {available ? `${book.available} cuốn có sẵn` : 'Hết sách'}
                                                </span>
                                                <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600 }}>
                                                    {book.quantity} tổng
                                                </span>
                                            </div>
                                        </div>

                                        <span className="material-symbols-outlined"
                                            style={{ fontSize: 16, color: zoneData.color, flexShrink: 0 }}>
                                            chevron_right
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── LibraryMap ────────────────────────────────────────────────────────────
/**
 * Props:
 *   location  {string}   – e.g. "Kệ A1"  (viewer: highlights this shelf)
 *   onSelect  {function} – picker mode: (locationStr) => void
 *   compact   {boolean}  – smaller version for forms
 */
const LibraryMap = ({ location, onSelect, compact = false }) => {
    const parsed = useMemo(() => parseLocation(location), [location]);

    const [hoveredShelf, setHoveredShelf] = useState(null);
    const [selectedShelf, setSelectedShelf] = useState(parsed?.shelf || null); // picker
    const [inspectedShelf, setInspectedShelf] = useState(null);                  // viewer inspection

    const [shelfStats, setShelfStats] = useState({});
    const [statsLoading, setStatsLoading] = useState(true);

    const isPicker = typeof onSelect === 'function';

    // Load shelf stats once
    useEffect(() => {
        bookAPI.getShelfStats()
            .then(res => { if (res.data?.success) setShelfStats(res.data.data || {}); })
            .catch(() => { })
            .finally(() => setStatsLoading(false));
    }, []);

    // Helpers
    const activeShelf = isPicker ? selectedShelf : parsed?.shelf;
    const activeZone = isPicker
        ? LIBRARY_ZONES.find(z => z.shelves.includes(selectedShelf))
        : parsed?.zoneData;

    const getStats = useCallback(
        (shelfId) => shelfStats[`Kệ ${shelfId}`] || { bookCount: 0, totalQuantity: 0 },
        [shelfStats]
    );

    // Dual limit: full if titles exceeded OR physical copies exceeded
    const isFull = useCallback((shelfId) => {
        const s = getStats(shelfId);
        return s.bookCount >= MAX_TITLES || s.totalQuantity >= MAX_QUANTITY;
    }, [getStats]);

    const getFullReason = useCallback((shelfId) => {
        const s = getStats(shelfId);
        if (s.bookCount >= MAX_TITLES) return `Đầy đầu sách (${s.bookCount}/${MAX_TITLES})`;
        if (s.totalQuantity >= MAX_QUANTITY) return `Đầy số cuốn (${s.totalQuantity}/${MAX_QUANTITY})`;
        return null;
    }, [getStats]);

    const handleShelfClick = (shelfId, zone) => {
        if (isPicker) {
            if (isFull(shelfId)) return;       // block full shelves
            setSelectedShelf(shelfId);
            onSelect(`Kệ ${shelfId}`);
        } else {
            // View mode → toggle shelf inspection panel
            setInspectedShelf(prev => prev === shelfId ? null : shelfId);
        }
    };

    const inspectedZone = LIBRARY_ZONES.find(z => z.shelves.includes(inspectedShelf));

    return (
        <div className={`library-map select-none ${compact ? 'library-map--compact' : ''}`}>
            <style>{`
                .library-map{font-family:inherit}
                .lm-container{
                    background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);
                    border:1.5px solid #e2e8f0;border-radius:24px;padding:22px;position:relative;overflow:hidden;
                }
                .library-map--compact .lm-container{padding:14px;border-radius:18px}
                .lm-container::before{
                    content:'';position:absolute;inset:0;pointer-events:none;
                    background-image:linear-gradient(rgba(148,163,184,.07)1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.07)1px,transparent 1px);
                    background-size:32px 32px;
                }
                .lm-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
                .library-map--compact .lm-header{margin-bottom:10px}
                .lm-title{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.08em}
                .lm-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:999px;font-size:10.5px;font-weight:800;letter-spacing:.04em}
                .b-found{background:#ecfdf5;color:#059669;border:1.5px solid #6ee7b7}
                .b-none{background:#f8fafc;color:#94a3b8;border:1.5px solid #e2e8f0}
                .b-pick{background:#eef2ff;color:#4f46e5;border:1.5px solid #c7d2fe}
                .lm-entrance{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;background:white;border:2px dashed #94a3b8;border-radius:12px;margin-bottom:12px;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.1em}
                .library-map--compact .lm-entrance{padding:5px;margin-bottom:8px}
                .lm-zones{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
                .library-map--compact .lm-zones{gap:5px}
                .lm-zone{border-radius:13px;overflow:hidden;border:1.5px solid rgba(0,0,0,.06);transition:transform .2s,box-shadow .2s}
                .lm-zone--active{transform:scale(1.02)}
                .lm-zone-hd{padding:7px 10px 5px;display:flex;flex-direction:column;gap:1px}
                .library-map--compact .lm-zone-hd{padding:5px 8px 4px}
                .lm-zone-lbl{font-size:11px;font-weight:900;letter-spacing:.04em}
                .library-map--compact .lm-zone-lbl{font-size:10px}
                .lm-zone-sub{font-size:9px;font-weight:600;opacity:.65}
                .lm-shelves{display:flex;flex-direction:column;gap:4px;padding:6px 8px 8px;background:rgba(255,255,255,.88)}
                .library-map--compact .lm-shelves{gap:3px;padding:4px 6px 6px}
                .lm-shelf{
                    display:flex;flex-direction:column;justify-content:center;
                    padding:5px 7px;border-radius:8px;border:1.5px solid transparent;
                    font-size:10px;font-weight:700;color:#64748b;background:#f8fafc;
                    transition:all .18s;position:relative;overflow:hidden;cursor:pointer;
                }
                .library-map--compact .lm-shelf{padding:3px 6px;border-radius:6px;font-size:9px}
                .lm-shelf:hover{background:white;transform:translateX(2px);box-shadow:0 2px 8px rgba(0,0,0,.08)}
                .lm-shelf--active{color:white!important;border-color:transparent!important;box-shadow:0 4px 14px rgba(0,0,0,.18)}
                .lm-shelf--full{cursor:not-allowed!important}
                .lm-shelf--full:hover{transform:none!important;box-shadow:none!important}
                .lm-shelf--inspected{outline:2.5px solid currentColor;outline-offset:1px}
                @keyframes sh-pulse{0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.18)}50%{box-shadow:0 4px 22px rgba(0,0,0,.28)}}
                .lm-shelf--active{animation:sh-pulse 2s ease-in-out infinite}
                .lm-row{display:flex;align-items:center;gap:5px}
                .lm-icon{font-size:12px!important;flex-shrink:0}
                .library-map--compact .lm-icon{font-size:10px!important}
                .lm-cap{margin-left:auto;font-size:8.5px;font-weight:800;padding:1px 5px;border-radius:5px;letter-spacing:.02em}
                .lm-bar-wrap{height:3px;border-radius:99px;overflow:hidden;margin-top:3px}
                .library-map--compact .lm-bar-wrap{height:2px;margin-top:2px}
                .lm-bar{height:100%;border-radius:99px;transition:width .5s ease}
                .lm-legend{display:flex;align-items:center;gap:12px;margin-top:12px;padding-top:10px;border-top:1px solid #e2e8f0;flex-wrap:wrap}
                .library-map--compact .lm-legend{margin-top:8px;padding-top:7px;gap:8px}
                .lm-leg-item{display:flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em}
                .lm-leg-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
                .lm-study{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px dashed #86efac;border-radius:13px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px 6px;color:#16a34a}
            `}</style>

            <div className="lm-container">
                {/* Header */}
                <div className="lm-header">
                    <div className="lm-title">
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6366f1' }}>map</span>
                        Sơ đồ thư viện
                    </div>
                    {isPicker ? (
                        <div className={`lm-badge ${activeShelf ? 'b-found' : 'b-pick'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{activeShelf ? 'check_circle' : 'touch_app'}</span>
                            {activeShelf ? `Đã chọn: Kệ ${activeShelf}` : 'Click vào kệ để chọn'}
                        </div>
                    ) : (
                        <div className={`lm-badge ${activeShelf ? 'b-found' : 'b-none'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{activeShelf ? 'location_on' : 'location_off'}</span>
                            {activeShelf ? `Kệ ${activeShelf}` : 'Chưa xếp chỗ'}
                        </div>
                    )}
                </div>

                {/* Entrance */}
                <div className="lm-entrance">
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>meeting_room</span>
                    Lối vào / Ra
                    {!isPicker && !compact && (
                        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginLeft: 4 }}>
                            · Click vào kệ để xem danh sách sách
                        </span>
                    )}
                </div>

                {/* Zones */}
                <div className="lm-zones">
                    {LIBRARY_ZONES.map(zone => {
                        const isActiveZone = activeZone?.id === zone.id;
                        return (
                            <div key={zone.id}
                                className={`lm-zone ${isActiveZone ? 'lm-zone--active' : ''}`}
                                style={{
                                    background: zone.bg, color: zone.color,
                                    borderColor: isActiveZone ? zone.color : 'rgba(0,0,0,0.06)',
                                    boxShadow: isActiveZone ? `0 0 0 2px ${zone.color}` : 'none',
                                }}
                            >
                                <div className="lm-zone-hd">
                                    <div className="lm-zone-lbl">{zone.label}</div>
                                    {!compact && <div className="lm-zone-sub">{zone.sublabel}</div>}
                                </div>
                                <div className="lm-shelves">
                                    {zone.shelves.map(shelfId => {
                                        const isActive = shelfId === activeShelf;
                                        const isHovered = shelfId === hoveredShelf;
                                        const isInspected = shelfId === inspectedShelf;
                                        const stats = getStats(shelfId);
                                        const full = isFull(shelfId);
                                        const fullReason = getFullReason(shelfId);

                                        // Progress bar: use the more-constrained percentage
                                        const pctTitles = stats.bookCount / MAX_TITLES;
                                        const pctQty = stats.totalQuantity / MAX_QUANTITY;
                                        const pct = Math.min(100, Math.round(Math.max(pctTitles, pctQty) * 100));
                                        const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : zone.color;

                                        return (
                                            <div key={shelfId}
                                                className={[
                                                    'lm-shelf',
                                                    isActive ? 'lm-shelf--active' : '',
                                                    isPicker && full && !isActive ? 'lm-shelf--full' : '',
                                                    !isPicker && isInspected ? 'lm-shelf--inspected' : '',
                                                ].join(' ')}
                                                style={{
                                                    background: isActive ? zone.color
                                                        : isInspected ? zone.bg
                                                            : full && isPicker ? '#fee2e2'
                                                                : isHovered ? zone.bg
                                                                    : '#f8fafc',
                                                    borderColor: isActive ? 'transparent'
                                                        : full && isPicker ? '#fca5a5'
                                                            : isInspected ? zone.color
                                                                : isHovered ? zone.color
                                                                    : 'transparent',
                                                    color: isActive ? 'white'
                                                        : full && isPicker ? '#ef4444'
                                                            : isInspected ? zone.color
                                                                : isHovered ? zone.color
                                                                    : '#64748b',
                                                    cursor: isPicker && full ? 'not-allowed' : 'pointer',
                                                }}
                                                onClick={() => handleShelfClick(shelfId, zone)}
                                                onMouseEnter={() => setHoveredShelf(shelfId)}
                                                onMouseLeave={() => setHoveredShelf(null)}
                                                title={
                                                    fullReason && isPicker
                                                        ? `Kệ ${shelfId} — ${fullReason}`
                                                        : `Kệ ${shelfId} — ${stats.bookCount} đầu sách · ${stats.totalQuantity} cuốn`
                                                }
                                            >
                                                {/* Row 1: icon · label · badge */}
                                                <div className="lm-row">
                                                    <span className="material-symbols-outlined lm-icon"
                                                        style={{ color: isActive ? 'white' : full && isPicker ? '#ef4444' : zone.color }}>
                                                        {isActive ? 'menu_book' : full && isPicker ? 'block' : isInspected ? 'expand_more' : 'view_agenda'}
                                                    </span>
                                                    <span style={{ flex: 1 }}>Kệ {shelfId}</span>

                                                    {/* Dual-limit badge */}
                                                    {!statsLoading && (
                                                        <span className="lm-cap" style={{
                                                            background: isActive ? 'rgba(255,255,255,0.25)'
                                                                : full && isPicker ? '#fecaca'
                                                                    : 'rgba(0,0,0,0.06)',
                                                            color: isActive ? 'white'
                                                                : full && isPicker ? '#dc2626'
                                                                    : '#94a3b8',
                                                        }}>
                                                            {stats.bookCount}/{MAX_TITLES}đs · {stats.totalQuantity}/{MAX_QUANTITY}c
                                                        </span>
                                                    )}

                                                    {isActive && (
                                                        <span className="material-symbols-outlined"
                                                            style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginLeft: 2 }}>
                                                            {isPicker ? 'check' : 'my_location'}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Row 2: dual progress bar */}
                                                {!statsLoading && (
                                                    <div className="lm-bar-wrap"
                                                        style={{ background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.07)' }}>
                                                        <div className="lm-bar"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: isActive ? 'rgba(255,255,255,0.7)' : barColor,
                                                            }} />
                                                    </div>
                                                )}

                                                {/* "Đầy kệ" reason in picker */}
                                                {full && isPicker && !isActive && (
                                                    <div style={{ fontSize: 7.5, fontWeight: 900, color: '#ef4444', letterSpacing: '.07em', marginTop: 1, textTransform: 'uppercase' }}>
                                                        {fullReason}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Study/reading area */}
                    <div className="lm-study">
                        <span className="material-symbols-outlined" style={{ fontSize: compact ? 20 : 24, opacity: 0.6 }}>table_restaurant</span>
                        <span style={{ fontSize: compact ? 8 : 9, fontWeight: 800, opacity: 0.7, textAlign: 'center', letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1.3 }}>
                            Khu<br />đọc sách
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="lm-legend">
                    <div className="lm-leg-item"><div className="lm-leg-dot" style={{ background: '#6366f1' }} />Kệ sách</div>
                    <div className="lm-leg-item"><div className="lm-leg-dot" style={{ background: '#10b981' }} />{isPicker ? 'Đang chọn' : 'Vị trí sách'}</div>
                    {isPicker && <div className="lm-leg-item"><div className="lm-leg-dot" style={{ background: '#ef4444' }} />Đầy kệ</div>}
                    {!isPicker && <div className="lm-leg-item"><div className="lm-leg-dot" style={{ background: '#6366f133', border: '1.5px solid #6366f1' }} />Đang xem</div>}
                    <div className="lm-leg-item" style={{ marginLeft: 'auto' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#94a3b8' }}>info</span>
                        Tối đa {MAX_TITLES} đs · {MAX_QUANTITY} cuốn/kệ
                    </div>
                </div>
            </div>

            {/* ── Shelf Inspection Panel (view mode only) ── */}
            {!isPicker && inspectedShelf && inspectedZone && (
                <ShelfPanel
                    shelfId={inspectedShelf}
                    zoneData={inspectedZone}
                    onClose={() => setInspectedShelf(null)}
                />
            )}
        </div>
    );
};

export default LibraryMap;
