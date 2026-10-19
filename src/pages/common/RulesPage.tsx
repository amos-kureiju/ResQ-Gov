import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { RULE_DOCS } from '../../rules/businessRules';
import { ROLE_LABEL } from '../../utils/format';
import { PageHeader, Panel } from '../../components/ui';

const RulesPage: React.FC = () => {
  return (
    <>
      <PageHeader
        title="Tata Kelola & Aturan Bisnis Sistem (Governance Rules)"
        subtitle="Sistem ResQ-Gov beroperasi dengan aturan yang ditegakkan secara otomatis oleh kode program untuk mencegah manipulasi, korupsi, dan kelalaian birokrasi"
      />

      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <ShieldCheck size={24} />
        <div>
          <strong>Bukan Sekadar Tampilan Formalitas:</strong>
          <p>
            Seluruh aturan bernomor (R-01 hingga R-12) di bawah ini diimplementasikan langsung pada alur validasi
            sistem. Setiap tindakan yang melanggar aturan akan <strong>ditolak secara otomatis</strong> dan dicatat
            pada Buku Besar Audit Trail berantai hash (hash chain) dengan tanda anomali (flag).
          </p>
        </div>
      </div>

      <div className="stack">
        {RULE_DOCS.map((r) => (
          <Panel key={r.code} className="border-primary" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-primary mono" style={{ fontSize: '0.9rem', padding: '4px 8px' }}>
                  {r.code}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{r.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {r.roles.map((role) => (
                  <span key={role} className="badge badge-neutral">
                    {role === 'semua' ? 'Semua Peran' : ROLE_LABEL[role]}
                  </span>
                ))}
              </div>
            </div>

            <p style={{ margin: '8px 0 12px 0', color: 'var(--text-main)', lineHeight: 1.5 }}>
              {r.description}
            </p>

            <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={15} className="text-primary" />
              <span>
                <strong>Penegakan Sistem:</strong> {r.enforcement}
              </span>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
};

export default RulesPage;
