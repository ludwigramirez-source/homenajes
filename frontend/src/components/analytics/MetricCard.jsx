import React from 'react';
import Icon from '../AppIcon';

// Tarjeta de KPI: etiqueta, valor grande y un icono sutil en teal.
const MetricCard = ({ label, value, icon, hint, accent = '#1a7472' }) => (
  <div className="bg-card border border-border rounded-lg p-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-3xl font-heading font-semibold text-foreground mt-2 leading-none">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
    {icon && (
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(26,116,114,0.10)' }}>
        <Icon name={icon} size={20} color={accent} />
      </div>
    )}
  </div>
);

export default MetricCard;
