import React from 'react';
import { Database } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

export const getCopimInitials = (name = '') => (
  String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CP'
);

export const getCopimAvatarDataUri = (name = '') => {
  const initials = getCopimInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0d5ea8"/>
          <stop offset="1" stop-color="#14b8a6"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="60" fill="url(#g)"/>
      <circle cx="60" cy="46" r="24" fill="rgba(255,255,255,0.18)"/>
      <path d="M25 102C31 80 46 70 60 70C74 70 89 80 95 102" fill="rgba(255,255,255,0.18)"/>
      <text x="60" y="71" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const CopimMemberIdentity = ({
  name,
  subtitle,
  avatarUrl,
  size = 'md',
  className = '',
  textClassName = '',
  subtitleClassName = '',
}) => {
  const sizeClasses = {
    sm: 'h-9 w-9',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-20 w-20',
    '2xl': 'h-28 w-28',
  };

  return (
    <div className={joinClasses('flex items-center gap-3', className)}>
      <Avatar className={joinClasses(sizeClasses[size] || sizeClasses.md, 'ring-2 ring-background/80 shadow-sm')}>
        <AvatarImage src={avatarUrl || getCopimAvatarDataUri(name)} alt={name} />
        <AvatarFallback className="bg-primary/15 text-primary font-semibold">
          {getCopimInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className={joinClasses('min-w-0', textClassName)}>
        <p className="truncate font-medium">{name}</p>
        {subtitle ? (
          <p className={joinClasses('truncate text-xs text-muted-foreground', subtitleClassName)}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};

export const formatCopimCurrency = (value) => (
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
);

export const formatCopimPercent = (value) => `${Math.round(Number(value || 0))}%`;

export const formatCopimDate = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatCopimDateTime = (value) => {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toDateTimeLocalValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

export const CopimPageHeader = ({ eyebrow = 'COPIM x ROVI', title, description, actions, stats = [] }) => (
  <div className="space-y-6">
    <div className="rounded-[28px] border border-border/70 bg-card/95 p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {stats.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/70 bg-muted/20 shadow-none">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">{stat.value}</p>
                {stat.helper ? (
                  <p className="mt-2 text-sm text-muted-foreground">{stat.helper}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);

export const CopimEmptyState = ({
  icon: Icon = Database,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-[28px] border border-dashed border-border/70 bg-card/80 px-6 py-12 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button className="mt-5 rounded-full" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
