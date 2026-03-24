import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const ICONS = {
    maxLoanDays: 'calendar_month',
    finePerDay: 'payments',
    maxBooksPerUser: 'library_books',
    maxReservationsPerUser: 'bookmark_add',
    reservationExpiryDays: 'event_busy',
};

const COLOR_MAP = {
    maxLoanDays: { grad: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    finePerDay: { grad: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    maxBooksPerUser: { grad: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    maxReservationsPerUser: { grad: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    reservationExpiryDays: { grad: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100' },
};

const AdminSystemSettingsPage = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [editValues, setEditValues] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await adminAPI.getSettings();
                const list = data.settings || [];
                setSettings(list);
                const init = {};
                list.forEach((s) => { init[s.key] = s.value; });
                setEditValues(init);
            } catch {
                setError('Failed to load system settings.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleSave = async (key) => {
        setSaving(key);
        setError('');
        try {
            await adminAPI.updateSetting(key, editValues[key]);
            setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: editValues[key] } : s));
            const lbl = settings.find((s) => s.key === key)?.label;
            setSuccessMsg(`"${lbl}" updated successfully.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save.');
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
                    <span className="material-symbols-outlined text-white text-2xl">tune</span>
                </div>
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">System Settings</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Configure global parameters for the library system</p>
                </div>
            </div>

            {/* Alerts */}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span>{successMsg}
                </div>
            )}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>{error}
                </div>
            )}

            {/* Settings grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">progress_activity</span>
                    <span>Loading settings…</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {settings.map((s) => {
                        const theme = COLOR_MAP[s.key] || { grad: 'from-slate-400 to-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' };
                        const changed = String(editValues[s.key]) !== String(s.value);
                        return (
                            <div key={s.key} className={`${theme.bg} border ${theme.border} rounded-3xl p-6 flex flex-col gap-4`}>
                                {/* Icon + Label */}
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.grad} flex items-center justify-center shadow-md flex-shrink-0`}>
                                        <span className="material-symbols-outlined text-white text-xl">{ICONS[s.key] || 'settings'}</span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1">
                                        <p className="font-bold text-on-surface">{s.label}</p>
                                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{s.description}</p>
                                    </div>
                                </div>

                                {/* Input row */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={editValues[s.key] ?? ''}
                                        onChange={(e) => setEditValues((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
                                        className="flex-1 px-4 py-3 bg-white rounded-xl border border-outline-variant/20 focus:border-primary/40 focus:outline-none text-sm font-bold text-on-surface shadow-sm transition-all"
                                        min={0}
                                    />
                                    {s.unit && (
                                        <span className="text-xs font-bold text-on-surface-variant bg-white px-3 py-3 rounded-xl border border-outline-variant/20 whitespace-nowrap shadow-sm">
                                            {s.unit}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleSave(s.key)}
                                        disabled={saving === s.key || !changed}
                                        title={changed ? 'Save' : 'No changes'}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-sm ${changed
                                                ? 'bg-primary text-white hover:bg-primary/90'
                                                : 'bg-white text-on-surface-variant border border-outline-variant/20'
                                            }`}
                                    >
                                        {saving === s.key
                                            ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                            : <span className="material-symbols-outlined text-lg">save</span>
                                        }
                                    </button>
                                </div>

                                {/* Unsaved indicator */}
                                {changed && (
                                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Unsaved — was <b>{s.value}</b>
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Warning note */}
            <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">warning</span>
                <div>
                    <p className="text-sm font-bold text-amber-700">Important</p>
                    <p className="text-sm text-amber-600 mt-0.5">
                        Changes take effect immediately for new transactions. Existing borrow records will not be retroactively affected.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemSettingsPage;
