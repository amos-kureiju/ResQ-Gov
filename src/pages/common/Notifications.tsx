import React from 'react';
import { CheckCheck, ArrowRight, Clock } from 'lucide-react';
import { useStore } from '../../store/StoreContext';
import { visibleNotifications } from '../../components/Layout';
import { dateTime, timeAgo } from '../../utils/format';
import { navigate } from '../../router';
import { EmptyState, PageHeader, Panel } from '../../components/ui';

const Notifications: React.FC = () => {
  const { state, user, markRead } = useStore();
  if (!user) return null;

  const notifs = visibleNotifications(state, user);
  const unreadIds = notifs.filter((n) => !n.readBy.includes(user.id)).map((n) => n.id);

  const handleMarkAll = () => {
    markRead(unreadIds);
  };

  const handleClickNotif = (id: string, link?: string) => {
    markRead([id]);
    if (link) navigate(link);
  };

  return (
    <>
      <PageHeader
        title="Pusat Pemberitahuan & Peringatan Dini"
        subtitle="Notifikasi eskalasi SLA, instruksi dispatch, dan pengajuan persetujuan"
        actions={
          unreadIds.length > 0 && (
            <button className="btn btn-outline" onClick={handleMarkAll}>
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </button>
          )
        }
      />

      <Panel>
        {notifs.length === 0 ? (
          <EmptyState title="Tidak ada pemberitahuan" text="Semua instruksi dan pengingat akan muncul di sini." />
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {notifs.map((n) => {
              const isRead = n.readBy.includes(user.id);
              return (
                <div
                  key={n.id}
                  className={`notif-card lvl-${n.level} ${isRead ? 'read' : 'unread'}`}
                  onClick={() => handleClickNotif(n.id, n.link)}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid var(--card-border)',
                    background: isRead ? '#fff' : '#f0f9ff',
                    cursor: n.link ? 'pointer' : 'default',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: n.level === 'critical' ? 'var(--accent-red)' : n.level === 'warning' ? 'var(--accent-amber)' : 'var(--accent-blue)',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p style={{ margin: 0, fontWeight: isRead ? 500 : 700, color: 'var(--text-main)' }}>
                        {n.message}
                      </p>
                      <div className="cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Clock size={12} /> {timeAgo(n.at)} • {dateTime(n.at)}
                      </div>
                    </div>
                  </div>

                  {n.link && (
                    <span className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
                      Buka <ArrowRight size={14} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
};

export default Notifications;
