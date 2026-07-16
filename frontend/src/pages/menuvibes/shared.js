import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const FALLBACK_STAGES = [
  ['new', 'Nuevo', '#64748b'], ['researched', 'Investigado', '#0ea5e9'],
  ['contacted', 'Contactado', '#8b5cf6'], ['responded', 'Respondió', '#6366f1'],
  ['qualified', 'Calificado', '#14b8a6'], ['demo', 'Demo', '#06b6d4'],
  ['proposal', 'Propuesta', '#f59e0b'], ['negotiation', 'Negociación', '#f97316'],
  ['won', 'Ganado', '#22c55e'], ['lost', 'Perdido', '#ef4444'], ['nurture', 'Seguimiento', '#a855f7'],
].map(([key, label, color]) => ({ key, label, color, is_terminal: ['won', 'lost'].includes(key), requires_next_action: !['new', 'won', 'lost'].includes(key) }));

export const DEMO_STATUSES = [
  ['requested', 'Solicitada'], ['collecting', 'Recopilando'], ['building', 'En construcción'],
  ['ready', 'Lista para venta'], ['presented', 'Presentada'], ['expired', 'Vencida'],
].map(([value, label]) => ({ value, label }));

export const unwrapList = (data, key) => Array.isArray(data) ? data : (data?.[key] || data?.items || []);
export const unwrapStages = (data) => unwrapList(data, 'stages').length ? unwrapList(data, 'stages') : FALLBACK_STAGES;
export const formatDate = (value, includeTime = false) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
};
export const toLocalInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
export const apiError = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join('. ');
  return typeof detail === 'string' ? detail : fallback;
};
export const getId = (item) => item?.id || item?._id;

export const MenuVibesPage = ({ title, description, action, children }) => (
  <div className="min-h-full bg-muted/20 p-4 sm:p-6 lg:p-8">
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">MenuVibes CRM</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
        {action}
      </header>
      {children}
    </div>
  </div>
);

export const LoadingState = ({ label = 'Cargando información…' }) => (
  <div className="flex min-h-56 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>
);

export const ErrorState = ({ message, onRetry }) => (
  <Card className="border-destructive/30"><CardContent className="flex flex-col items-center gap-3 p-8 text-center"><p className="font-medium text-destructive">{message}</p>{onRetry && <Button variant="outline" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button>}</CardContent></Card>
);
