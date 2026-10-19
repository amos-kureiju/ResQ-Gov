import React, { useState } from 'react';
import { PackageCheck, PlusCircle } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { FINAL_STATUSES, RULES } from '../../rules/businessRules';
import { num } from '../../utils/format';
import { EmptyState, Field, PageHeader, Panel, RuleTag, Tabs } from '../../components/ui';
import { RequestDetail, RequestTable } from '../../components/RequestViews';
import type { AidRequest } from '../../types';

const ReceiptForm: React.FC<{ req: AidRequest; onDone: () => void }> = ({ req, onDone }) => {
  const { state, confirmReceipt } = useStore();
  const toast = useToast();
  const [received, setReceived] = useState<Record<string, number>>(() => Object.fromEntries(req.lines.map((l) => [l.itemId, l.qty])));
  const [note, setNote] = useState('');
  const short = req.lines.some((l) => (received[l.itemId] ?? 0) < l.qty);

  return (
    <div className="receipt-box">
      <h4 className="section-label"><PackageCheck size={16} /> Konfirmasi Penerimaan Fisik <RuleTag code="R-06" /></h4>
      <p className="cell-sub">Hitung barang secara fisik. Ubah angka bila jumlah yang diterima kurang dari yang dikirim.</p>
      <div className="form-grid-3">
        {req.lines.map((l) => {
          const it = state.items.find((i) => i.id === l.itemId)!;
          return (
            <Field key={l.itemId} label={`${it.name} (dikirim ${num(l.qty)} ${it.unit})`}>
              <input className="input" type="number" min={0} max={l.qty} value={received[l.itemId]} onChange={(e) => setReceived({ ...received, [l.itemId]: Math.floor(Number(e.target.value)) })} />
            </Field>
          );
        })}
      </div>
      <Field label={short ? 'Penjelasan selisih (wajib)' : 'Catatan (opsional)'} hint={short ? `Minimal ${RULES.REJECT_REASON_MIN} karakter — selisih akan dilaporkan ke Kepala Dinas.` : undefined}>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={short ? 'Contoh: 2 dus air mineral bocor/rusak saat diturunkan, disaksikan pengemudi.' : ''} />
      </Field>
      <button id="receipt-confirm" className={`btn ${short ? 'btn-danger' : 'btn-success'}`} onClick={() => toast(confirmReceipt(req.id, received, note)) && onDone()}>
        <PackageCheck size={16} /> {short ? 'Laporkan Penerimaan dengan Selisih' : 'Konfirmasi Diterima Lengkap'}
      </button>
    </div>
  );
};

const MyRequests: React.FC = () => {
  const { state, user } = useStore();
  const [tab, setTab] = useState('aktif');
  const [open, setOpen] = useState<AidRequest | null>(null);
  const mine = state.requests.filter((r) => r.postId === user?.postId);
  const groups: Record<string, AidRequest[]> = {
    aktif: mine.filter((r) => !FINAL_STATUSES.includes(r.status) && r.status !== 'terkirim'),
    konfirmasi: mine.filter((r) => r.status === 'terkirim'),
    selesai: mine.filter((r) => FINAL_STATUSES.includes(r.status)),
    semua: mine,
  };
  const list = groups[tab];
  const current = open && state.requests.find((r) => r.id === open.id);

  return (
    <>
      <PageHeader title="Permintaan Saya" subtitle="Pantau status, kode serah terima, dan konfirmasi penerimaan" actions={<a className="btn btn-primary" href="#/posko/ajukan"><PlusCircle size={16} /> Ajukan Baru</a>} />
      <Panel>
        <Tabs value={tab} onChange={setTab} tabs={[
          { id: 'aktif', label: 'Dalam Proses', count: groups.aktif.length },
          { id: 'konfirmasi', label: 'Perlu Konfirmasi', count: groups.konfirmasi.length },
          { id: 'selesai', label: 'Selesai', count: groups.selesai.length },
          { id: 'semua', label: 'Semua', count: groups.semua.length },
        ]} />
        {list.length ? (
          <RequestTable requests={list} onOpen={setOpen} showPost={false}
            action={(r) => r.status === 'terkirim'
              ? <button className="btn btn-primary btn-sm" onClick={() => setOpen(r)}>Konfirmasi</button>
              : <button className="btn btn-ghost btn-sm" onClick={() => setOpen(r)}>Detail</button>}
          />
        ) : <EmptyState title="Tidak ada permintaan di kategori ini" />}
      </Panel>
      <RequestDetail request={open} onClose={() => setOpen(null)} showHandoverCode>
        {current?.status === 'terkirim' && <ReceiptForm req={current} onDone={() => setOpen(null)} />}
      </RequestDetail>
    </>
  );
};

export default MyRequests;
