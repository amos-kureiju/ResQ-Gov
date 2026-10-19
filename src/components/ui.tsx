import React, { useEffect, useState } from 'react';
import { X, Inbox, Clock, AlertTriangle } from 'lucide-react';
import type { AidRequest, Priority, RequestStatus } from '../types';
import { duration, PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, type Tone } from '../utils/format';
import { getSla } from '../rules/businessRules';

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; dot?: boolean }> = ({ tone = 'neutral', children, dot }) => (
  <span className={`badge badge-${tone}`}>
    {dot && <span className="badge-dot" />}
    {children}
  </span>
);

export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => (
  <Badge tone={STATUS_TONE[status]} dot>{STATUS_LABEL[status]}</Badge>
);

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => (
  <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>
);

/** Re-render setiap interval agar hitung mundur SLA tetap hidup */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return now;
}

export const SlaChip: React.FC<{ req: AidRequest; now: number }> = ({ req, now }) => {
  const sla = getSla(req, now);
  if (!sla.stage) {
    return sla.breachedHistorically ? <span className="sla sla-late">Terlambat (SLA)</span> : <span className="sla sla-done">Sesuai SLA</span>;
  }
  const warn = sla.remainingMs < 30 * 60_000;
  return (
    <span className={`sla ${sla.overdue ? 'sla-late' : warn ? 'sla-warn' : 'sla-ok'}`} title={`Tahap ${sla.stage}`}>
      {sla.overdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
      {sla.overdue ? `Lewat ${duration(sla.remainingMs)}` : `Sisa ${duration(sla.remainingMs)}`}
    </span>
  );
};

export const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone?: Tone; hint?: React.ReactNode; pulse?: boolean }> = ({
  icon, label, value, tone = 'primary', hint, pulse,
}) => (
  <div className={`stat-card tone-${tone}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <div className="stat-value">
        {value}
        {pulse && <span className="pulse-dot" />}
      </div>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  </div>
);

export const Panel: React.FC<{
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  id?: string;
}> = ({
  title, subtitle, actions, className = '', style, children, id,
}) => (
  <section className={`panel ${className}`} id={id} style={style}>
    {(title || actions) && (
      <header className="panel-head">
        <div>
          {title && <h2 className="panel-title">{title}</h2>}
          {subtitle && <p className="panel-sub">{subtitle}</p>}
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </header>
    )}
    {children}
  </section>
);

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({
  open, onClose, title, children, footer, wide,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; text?: string; icon?: React.ReactNode }> = ({ title, text, icon }) => (
  <div className="empty">
    <div className="empty-icon">{icon ?? <Inbox size={28} />}</div>
    <strong>{title}</strong>
    {text && <p>{text}</p>}
  </div>
);

export const Progress: React.FC<{ value: number; tone?: Tone }> = ({ value, tone }) => {
  const v = Math.max(0, Math.min(100, value));
  const t = tone ?? (v < 30 ? 'danger' : v < 60 ? 'warning' : 'success');
  return (
    <div className="progress">
      <div className={`progress-fill fill-${t}`} style={{ width: `${v}%` }} />
    </div>
  );
};

export const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode; error?: string }> = ({ label, hint, children, error }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    {children}
    {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
  </label>
);

export const RuleTag: React.FC<{ code: string }> = ({ code }) => (
  <a className="rule-tag" href="#/aturan" title="Lihat aturan sistem">{code}</a>
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="page-head">
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

export const Tabs: React.FC<{ tabs: { id: string; label: string; count?: number }[]; value: string; onChange: (id: string) => void }> = ({ tabs, value, onChange }) => (
  <div className="tabs" role="tablist">
    {tabs.map((t) => (
      <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
        {t.label}
        {t.count !== undefined && <span className="tab-count">{t.count}</span>}
      </button>
    ))}
  </div>
);
