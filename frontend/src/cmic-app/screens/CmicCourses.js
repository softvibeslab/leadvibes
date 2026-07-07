import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Card, Chip, CmicLoading, CmicEmpty, fmtCurrency, useMemberResource } from '../cmicAppKit';

const TABS = [
  { key: 'mine', label: 'Mi ruta' },
  { key: 'market', label: 'Marketplace' },
];

const STATUS_TONE = { completed: 'ok', in_progress: 'warn', enrolled: 'navy', available: 'default' };

export const CmicCourses = () => {
  const { api } = useAuth();
  const { data, loading, reload } = useMemberResource('/copim/member-portal/courses');
  const [tab, setTab] = useState('mine');
  const [working, setWorking] = useState(null);

  if (loading) return <CmicLoading />;
  if (!data) return null;

  const mine = Array.isArray(data.courses) ? data.courses : [];
  const market = Array.isArray(data.marketplace_courses) ? data.marketplace_courses : [];
  const summary = data.summary || {};
  const list = tab === 'mine' ? mine : market;

  const handleEnroll = async (id) => {
    setWorking(id);
    try {
      await api.post(`/copim/member-portal/courses/${id}/enroll`);
      toast.success('Te inscribiste al curso');
      await reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No se pudo completar la inscripción');
    } finally {
      setWorking(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Card pad="sm"><p className="cmic-caption">Completados</p><p style={{ fontSize: 22, fontWeight: 700 }}>{summary.completed_courses || 0}</p></Card>
        <Card pad="sm"><p className="cmic-caption">En curso</p><p style={{ fontSize: 22, fontWeight: 700 }}>{summary.in_progress_courses || 0}</p></Card>
        <Card pad="sm"><p className="cmic-caption">Promedio</p><p style={{ fontSize: 22, fontWeight: 700 }}>{summary.average_progress || 0}%</p></Card>
      </div>

      <div className="cmic-chiprow">
        {TABS.map((t) => (
          <button key={t.key} className={`cmic-filter ${tab === t.key ? 'cmic-filter--active' : ''}`.trim()} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((course) => (
            <Card key={course.id} pad="sm">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p className="cmic-caption" style={{ textTransform: 'uppercase' }}>{course.category || 'Curso ICIC'}</p>
                  <p style={{ fontWeight: 600, color: 'var(--cmic-navy-deep)' }}>{course.title}</p>
                </div>
                <Chip tone={STATUS_TONE[course.status] || 'default'}>{course.pricing_type === 'premium' ? 'Premium' : course.status || 'Gratis'}</Chip>
              </div>
              {course.summary ? <p className="cmic-body cmic-muted" style={{ marginTop: 6 }}>{course.summary}</p> : null}

              {tab === 'mine' ? (
                <div style={{ marginTop: 12 }}>
                  <div className="cmic-progress"><div className="cmic-progress__fill" style={{ width: `${course.progress || 0}%` }} /></div>
                  <p className="cmic-caption" style={{ marginTop: 6 }}>
                    {course.modules_completed || 0}/{course.modules_total || 0} lecciones · {course.next_lesson_title || 'Listo para continuar'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <p style={{ fontWeight: 600 }}>{course.pricing_type === 'premium' ? fmtCurrency(course.price_amount || 0) : 'Gratis'}</p>
                  {!course.is_enrolled && course.pricing_type !== 'premium' ? (
                    <button className="cmic-btn cmic-btn--primary cmic-btn--sm" disabled={working === course.id} onClick={() => handleEnroll(course.id)}>
                      {working === course.id ? 'Procesando…' : 'Inscribirme'}
                    </button>
                  ) : course.is_enrolled ? (
                    <Chip tone="ok">Inscrito</Chip>
                  ) : (
                    <Chip tone="navy">Premium</Chip>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <CmicEmpty icon="school" title={tab === 'mine' ? 'Aún no tienes cursos' : 'Sin cursos en el marketplace'} description="Explora el catálogo ICIC y activa tu primera ruta formativa." />
      )}
    </div>
  );
};
