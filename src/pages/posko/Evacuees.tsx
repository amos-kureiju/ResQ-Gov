import React, { useState } from 'react';
import { Save, History, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { RULES } from '../../rules/businessRules';
import { dateTime, num } from '../../utils/format';
import { EmptyState, Field, PageHeader, Panel, RuleTag, Badge } from '../../components/ui';
import type { VulnerableGroups } from '../../types';

const Evacuees: React.FC = () => {
  const { state, user, updatePost } = useStore();
  const toast = useToast();
  const post = state.posts.find((p) => p.id === user?.postId);
  const [evacuees, setEvacuees] = useState(post?.evacuees ?? 0);
  const [vul, setVul] = useState<VulnerableGroups>(post?.vulnerable ?? { balita: 0, lansia: 0, disabilitas: 0, ibuHamil: 0 });
  const [reason, setReason] = useState('');

  if (!post) return <EmptyState title="Akun belum ditugaskan ke posko" />;

  const pct = post.evacuees ? Math.abs(evacuees - post.evacuees) / post.evacuees * 100 : 0;
  const willFlag = pct > RULES.HEADCOUNT_CHANGE_FLAG_PCT || evacuees > post.capacity;
  const vulTotal = vul.balita + vul.lansia + vul.disabilitas + vul.ibuHamil;
  const history = state.audit.filter((a) => a.action === 'DATA_PENGUNGSI_DIPERBARUI' && a.target === post.id).reverse();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toast(updatePost({ evacuees, vulnerable: vul, reason }))) setReason('');
  };

  const setV = (k: keyof VulnerableGroups) => (e: React.ChangeEvent<HTMLInputElement>) => setVul({ ...vul, [k]: Math.max(0, Math.floor(Number(e.target.value))) });

  return (
    <>
      <PageHeader title="Data Pengungsi" subtitle={`${post.name} • Kapasitas ${num(post.capacity)} jiwa`} />
      <div className="grid-main">
        <Panel title="Perbarui Data" subtitle={<>Data ini menjadi dasar batas kuota permintaan <RuleTag code="R-03" /> <RuleTag code="R-10" /></>}>
          <form onSubmit={submit} className="form">
            <Field label="Jumlah total pengungsi (jiwa)" hint={`Data saat ini: ${num(post.evacuees)} jiwa`}>
              <input id="evacuees-total" className="input" type="number" min={0} value={evacuees} onChange={(e) => setEvacuees(Math.max(0, Math.floor(Number(e.target.value))))} />
            </Field>
            <div className="form-grid-4">
              <Field label="Balita"><input className="input" type="number" min={0} value={vul.balita} onChange={setV('balita')} /></Field>
              <Field label="Lansia"><input className="input" type="number" min={0} value={vul.lansia} onChange={setV('lansia')} /></Field>
              <Field label="Disabilitas"><input className="input" type="number" min={0} value={vul.disabilitas} onChange={setV('disabilitas')} /></Field>
              <Field label="Ibu Hamil"><input className="input" type="number" min={0} value={vul.ibuHamil} onChange={setV('ibuHamil')} /></Field>
            </div>
            {vulTotal > evacuees && <div className="alert alert-danger compact">Total kelompok rentan ({num(vulTotal)}) melebihi jumlah pengungsi ({num(evacuees)}).</div>}
            <Field label="Keterangan perubahan (wajib)" hint={`${reason.trim().length}/10 karakter minimal (R-10). Contoh: 35 pengungsi baru dari Desa Sukaresmi pukul 14.00; 12 kembali ke rumah.`}>
              <textarea id="evacuees-reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            {willFlag && (
              <div className="alert alert-warning compact">
                <AlertTriangle size={16} />
                <span>Perubahan {pct.toFixed(0)}%{evacuees > post.capacity ? ' dan melebihi kapasitas' : ''} — data akan <strong>ditandai</strong> dan diperiksa Koordinator.</span>
              </div>
            )}
            <button id="evacuees-save" className="btn btn-primary" disabled={vulTotal > evacuees || reason.trim().length < 10}><Save size={16} /> Simpan Data</button>
          </form>
        </Panel>

        <Panel title={<><History size={16} /> Riwayat Perubahan</>} subtitle="Tercatat permanen di audit log">
          {history.length === 0 ? <EmptyState title="Belum ada perubahan tercatat" /> : (
            <ul className="log-list">
              {history.map((h) => (
                <li key={h.seq}>
                  <div className="log-head"><strong>{h.actorName}</strong>{h.flagged && <Badge tone="warning">Ditandai</Badge>}</div>
                  <p>{h.detail}</p>
                  <span className="cell-sub">{dateTime(h.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
};

export default Evacuees;
