import React, { useState } from 'react';
import { PackagePlus, AlertTriangle, ArrowDownRight, ArrowUpRight, PlusCircle } from 'lucide-react';
import { useStore, availableQty } from '../../store/StoreContext';
import { useToast } from '../../components/Toast';
import { CATEGORY_LABEL, dateTime, num, rupiah } from '../../utils/format';
import { EmptyState, Field, Modal, PageHeader, Panel, Progress, RuleTag } from '../../components/ui';
import type { ItemCategory } from '../../types';

const Warehouse: React.FC = () => {
  const { state, stockIn, addItem } = useStore();
  const toast = useToast();

  const [selectedItem, setSelectedItem] = useState(state.items[0]?.id || '');
  const [qty, setQty] = useState<number>(0);
  const [ref, setRef] = useState('');
  const [note, setNote] = useState('');

  // Form tambah master barang
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('paket');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('pangan');
  const [newItemStock, setNewItemStock] = useState(100);
  const [newItemMinStock, setNewItemMinStock] = useState(50);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(25000);
  const [newItemNorm, setNewItemNorm] = useState(0.5);
  const [newItemNormBasis, setNewItemNormBasis] = useState<'hari' | 'jiwa'>('hari');

  const handleStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (toast(stockIn(selectedItem, qty, ref, note))) {
      setQty(0);
      setRef('');
      setNote('');
    }
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addItem({
      name: newItemName,
      unit: newItemUnit,
      category: newItemCategory,
      stock: newItemStock,
      minStock: newItemMinStock,
      unitPrice: newItemUnitPrice,
      norm: newItemNorm,
      normBasis: newItemNormBasis,
    });
    if (toast(res)) {
      setShowAddItem(false);
      setNewItemName('');
    }
  };

  const movements = state.movements.slice(0, 15);

  return (
    <>
      <PageHeader
        title="Manajemen Gudang & Logistik Masuk"
        subtitle="Pencatatan persediaan fisik, batas minimum, dan mutasi barang berdasarkan dokumen resmi BAST (R-04, R-08)"
        actions={
          <button className="btn btn-primary" onClick={() => setShowAddItem(true)}>
            <PlusCircle size={16} /> Tambah Master Barang
          </button>
        }
      />

      <div className="grid-main">
        <Panel title="Input Penerimaan Bantuan (Stok Masuk)" subtitle="Wajib mencantumkan nomor BAST/Surat Jalan resmi">
          <form onSubmit={handleStockIn} className="form">
            <Field label="Pilih Barang">
              <select
                className="input"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
              >
                {state.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({CATEGORY_LABEL[i.category]}) — Stok: {num(i.stock)} {i.unit}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Jumlah Masuk">
              <input
                className="input"
                type="number"
                min={1}
                value={qty || ''}
                onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="Jumlah unit"
              />
            </Field>

            <Field label="Nomor Dokumen BAST / Surat Jalan" hint="Mencegah pencatatan ganda & dasar pertanggungjawaban audit (R-08)">
              <input
                className="input"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="mis. BAST/BNPB/X/2026/089"
              />
            </Field>

            <Field label="Catatan Asal Bantuan / Pengadaan">
              <textarea
                className="input"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="mis. Bantuan hibah tahap II BNPB / APBD Perubahan"
              />
            </Field>

            <button className="btn btn-primary" disabled={qty <= 0 || ref.trim().length < 5}>
              <PackagePlus size={16} /> Catat Stok Masuk
            </button>
          </form>
        </Panel>

        <Panel title="Riwayat Mutasi Stok Terbaru" subtitle="Audit jejak barang keluar & masuk">
          {movements.length === 0 ? (
            <EmptyState title="Belum ada riwayat mutasi" />
          ) : (
            <div className="table-wrap">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Tipe</th>
                    <th>Barang</th>
                    <th>Jumlah</th>
                    <th>No. Referensi</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const it = state.items.find((i) => i.id === m.itemId);
                    const isMasuk = m.type === 'masuk';
                    return (
                      <tr key={m.id}>
                        <td>
                          <span className={`badge badge-${isMasuk ? 'success' : 'primary'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {isMasuk ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            {isMasuk ? 'Masuk' : 'Keluar'}
                          </span>
                        </td>
                        <td>
                          <strong>{it?.name}</strong>
                          <div className="cell-sub">{m.note}</div>
                        </td>
                        <td className="num">
                          <strong>{isMasuk ? `+${num(m.qty)}` : `-${num(m.qty)}`}</strong> {it?.unit}
                        </td>
                        <td>
                          <span className="mono cell-sub">{m.ref}</span>
                        </td>
                        <td className="cell-sub">
                          {dateTime(m.at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Daftar Master Stok Gudang Utama"
        subtitle="Dipantau terhadap batas persediaan minimum"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAddItem(true)}>
            <PlusCircle size={14} /> Tambah Barang
          </button>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Barang</th>
                <th>Kategori</th>
                <th>Stok Fisik</th>
                <th>Tersedia (Bebas Alokasi)</th>
                <th>Batas Minimum</th>
                <th>Estimasi Nilai Total</th>
                <th>Kondisi Cadangan</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((it) => {
                const avail = availableQty(state, it.id);
                const isUnderMin = it.stock <= it.minStock;
                const ratio = Math.min(100, Math.round((avail / (it.minStock * 2)) * 100));

                return (
                  <tr key={it.id} className={isUnderMin ? 'row-error' : ''}>
                    <td>
                      <div className="cell-strong">{it.name}</div>
                      <div className="cell-sub">Standar: {it.norm} {it.unit}/jiwa{it.normBasis === 'hari' ? '/hari' : ''}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{CATEGORY_LABEL[it.category]}</span>
                    </td>
                    <td className="num">
                      <strong>{num(it.stock)}</strong> {it.unit}
                    </td>
                    <td className="num">
                      <strong className={avail < it.minStock ? 'text-danger' : 'text-success'}>
                        {num(avail)}
                      </strong> {it.unit}
                    </td>
                    <td className="num cell-sub">
                      {num(it.minStock)} {it.unit}
                    </td>
                    <td className="num">
                      {rupiah(it.stock * it.unitPrice)}
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <Progress value={ratio} tone={isUnderMin ? 'danger' : avail < it.minStock * 1.5 ? 'warning' : 'success'} />
                      <div className="cell-sub" style={{ marginTop: 4 }}>
                        {isUnderMin ? (
                          <span className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} /> Di Bawah Minimum <RuleTag code="R-04" />
                          </span>
                        ) : 'Cadangan Aman'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal Tambah Master Barang */}
      <Modal open={showAddItem} onClose={() => setShowAddItem(false)} title="Tambah Master Barang Logistik Baru">
        <form onSubmit={handleAddItemSubmit} className="form">
          <Field label="Nama Barang">
            <input
              className="input"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="mis. Biskuit Kalori Tinggi (Biskuit Darurat)"
              required
            />
          </Field>
          <div className="form-grid-2">
            <Field label="Kategori">
              <select
                className="input"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
              >
                <option value="pangan">Pangan</option>
                <option value="medis">Medis</option>
                <option value="hunian">Hunian</option>
                <option value="sanitasi">Sanitasi</option>
              </select>
            </Field>
            <Field label="Satuan Unit">
              <input
                className="input"
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                placeholder="mis. dus / kaleng / kg"
                required
              />
            </Field>
          </div>
          <div className="form-grid-3">
            <Field label="Stok Awal Fisik">
              <input
                className="input"
                type="number"
                min={0}
                value={newItemStock}
                onChange={(e) => setNewItemStock(Math.max(0, Number(e.target.value)))}
                required
              />
            </Field>
            <Field label="Batas Minimum Cadangan">
              <input
                className="input"
                type="number"
                min={1}
                value={newItemMinStock}
                onChange={(e) => setNewItemMinStock(Math.max(1, Number(e.target.value)))}
                required
              />
            </Field>
            <Field label="Harga Satuan (Rp)">
              <input
                className="input"
                type="number"
                min={100}
                step={500}
                value={newItemUnitPrice}
                onChange={(e) => setNewItemUnitPrice(Math.max(0, Number(e.target.value)))}
                required
              />
            </Field>
          </div>
          <div className="form-grid-2">
            <Field label="Standar Kuota per Jiwa" hint="Angka kuota dasar kebutuhan per orang">
              <input
                className="input"
                type="number"
                step="0.01"
                min={0.01}
                value={newItemNorm}
                onChange={(e) => setNewItemNorm(Math.max(0.01, Number(e.target.value)))}
                required
              />
            </Field>
            <Field label="Basis Kuota">
              <select
                className="input"
                value={newItemNormBasis}
                onChange={(e) => setNewItemNormBasis(e.target.value as 'hari' | 'jiwa')}
              >
                <option value="hari">Per Jiwa / Hari (Konsumsi harian)</option>
                <option value="jiwa">Per Jiwa (Sekali pakai / Perlengkapan)</option>
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddItem(false)}>
              Batal
            </button>
            <button className="btn btn-primary" disabled={newItemName.trim().length < 3}>
              Simpan Master Barang
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Warehouse;
