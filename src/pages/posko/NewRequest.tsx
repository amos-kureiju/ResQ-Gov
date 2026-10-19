import React, { useMemo, useState } from 'react';
import { Send, Siren, Flame, Leaf, Info } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { estimateValue, inFlightQty, maxAllowedQty, RULES } from '../../rules/businessRules';
import { CATEGORY_LABEL, num, rupiah } from '../../utils/format';
import { navigate } from '../../router';
import { EmptyState, Field, PageHeader, Panel, RuleTag } from '../../components/ui';
import type { Priority } from '../../types';

const PRIORITIES: { id: Priority; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'darurat', label: 'Darurat', desc: `Mengancam jiwa. Kirim ≤ ${RULES.SLA_HOURS.darurat.deliver} jam`, icon: <Siren size={18} /> },
  { id: 'tinggi', label: 'Tinggi', desc: `Habis < 24 jam. Kirim ≤ ${RULES.SLA_HOURS.tinggi.deliver} jam`, icon: <Flame size={18} /> },
  { id: 'normal', label: 'Normal', desc: `Pengisian rutin. Kirim ≤ ${RULES.SLA_HOURS.normal.deliver} jam`, icon: <Leaf size={18} /> },
];

const NewRequest: React.FC = () => {
  const { state, user, createRequest } = useStore();
  const toast = useToast();
  const post = state.posts.find((p) => p.id === user?.postId);
  const [priority, setPriority] = useState<Priority>('normal');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [justification, setJustification] = useState('');

  const lines = useMemo(() => Object.entries(qty).filter(([, q]) => q > 0).map(([itemId, q]) => ({ itemId, qty: q })), [qty]);
  const value = estimateValue(lines, state.items);

  if (!post) return <EmptyState title="Akun belum ditugaskan ke posko" />;
  const stale = (Date.now() - post.lastUpdate) / 3600_000 > RULES.HEADCOUNT_MAX_AGE_HOURS;

  const rows = state.items.map((it) => {
    const cap = maxAllowedQty(it, post);
    const flight = inFlightQty(state.requests, post.id, it.id);
    const remaining = Math.max(0, cap - flight);
    const q = qty[it.id] ?? 0;
    return { it, cap, flight, remaining, q, over: q > remaining };
  });
  const anyOver = rows.some((r) => r.over);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toast(createRequest({ priority, lines, justification }))) navigate('/posko/permintaan');
  };

  return (
    <>
      <PageHeader title="Ajukan Permintaan Bantuan" subtitle={`${post.name} • ${num(post.evacuees)} jiwa`} />
      {stale && (
        <div className="alert alert-danger">
          <Info size={18} />
          <div><strong>Data pengungsi kedaluwarsa.</strong><p>Perbarui data pengungsi sebelum mengajukan permintaan. <RuleTag code="R-10" /></p></div>
          <a className="btn btn-sm btn-primary" href="#/posko/pengungsi">Perbarui</a>
        </div>
      )}
      <form onSubmit={submit} className="stack">
        <Panel title="1. Tingkat Prioritas" subtitle={<>Menentukan batas waktu layanan <RuleTag code="R-07" /></>}>
          <div className="choice-grid">
            {PRIORITIES.map((p) => (
              <button type="button" key={p.id} className={`choice choice-${p.id} ${priority === p.id ? 'active' : ''}`} onClick={() => setPriority(p.id)}>
                <span className="choice-icon">{p.icon}</span>
                <strong>{p.label}</strong>
                <em>{p.desc}</em>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="2. Barang yang Dibutuhkan" subtitle={<>Kuota dihitung otomatis dari jumlah jiwa & permintaan yang masih berjalan <RuleTag code="R-03" /></>}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Barang</th><th>Kategori</th><th className="num">Standar</th><th className="num">Sisa Kuota</th><th className="num">Jumlah Diminta</th><th className="num">Subtotal</th></tr>
              </thead>
              <tbody>
                {rows.map(({ it, remaining, flight, q, over }) => (
                  <tr key={it.id} className={over ? 'row-error' : q > 0 ? 'row-selected' : ''}>
                    <td className="cell-strong">{it.name}</td>
                    <td><span className="cell-sub">{CATEGORY_LABEL[it.category]}</span></td>
                    <td className="num cell-sub">{it.norm} {it.unit}/jiwa{it.normBasis === 'hari' ? '/hari' : ''}</td>
                    <td className="num">
                      <strong>{num(remaining)}</strong> <span className="cell-sub">{it.unit}</span>
                      {flight > 0 && <div className="cell-sub">{num(flight)} dalam proses</div>}
                    </td>
                    <td className="num">
                      <input
                        className={`input input-qty ${over ? 'invalid' : ''}`}
                        type="number" min={0} max={remaining} value={q || ''} placeholder="0"
                        onChange={(e) => setQty({ ...qty, [it.id]: Math.max(0, Math.floor(Number(e.target.value))) })}
                        aria-label={`Jumlah ${it.name}`}
                      />
                      {over && <div className="field-error">Melebihi kuota</div>}
                    </td>
                    <td className="num">{q > 0 ? rupiah(q * it.unitPrice) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="3. Justifikasi" subtitle={<>Jelaskan kondisi lapangan secara spesifik <RuleTag code="R-08" /></>}>
          <Field label="Alasan & kondisi lapangan" hint={`${justification.trim().length}/${RULES.JUSTIFICATION_MIN} karakter minimal`}>
            <textarea id="request-justification" className="input" rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Contoh: Stok beras tersisa untuk 1 hari, 38 balita membutuhkan MP-ASI, dapur umum melayani 3x makan…" />
          </Field>
        </Panel>

        <div className="submit-bar">
          <div>
            <span className="cell-sub">Estimasi nilai</span>
            <strong className="big">{rupiah(value)}</strong>
            {value > RULES.APPROVAL_VALUE_THRESHOLD && <span className="badge badge-warning">Memerlukan persetujuan Kepala Dinas <RuleTag code="R-02" /></span>}
          </div>
          <button id="request-submit" className="btn btn-primary btn-lg" disabled={stale || anyOver || lines.length === 0 || justification.trim().length < RULES.JUSTIFICATION_MIN}>
            <Send size={16} /> Ajukan Permintaan
          </button>
        </div>
      </form>
    </>
  );
};

export default NewRequest;
