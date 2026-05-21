import React from 'react';
import Icon from '../../../components/AppIcon';

const InsightsPanel = ({ insights, className = '' }) => {
  const getInsightIcon = (type) => {
    const icons = {
      success: 'CheckCircle2',
      warning: 'AlertTriangle',
      info: 'Info',
      trend: 'TrendingUp'
    };
    return icons?.[type] || 'Info';
  };

  const getInsightColor = (type) => {
    const colors = {
      success: { bg: 'bg-success/10', text: 'text-success', icon: 'var(--color-success)' },
      warning: { bg: 'bg-warning/10', text: 'text-warning', icon: 'var(--color-warning)' },
      info: { bg: 'bg-accent/10', text: 'text-accent', icon: 'var(--color-accent)' },
      trend: { bg: 'bg-primary/10', text: 'text-primary', icon: 'var(--color-primary)' }
    };
    return colors?.[type] || colors?.info;
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 md:p-6 shadow-elevation-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon name="Sparkles" size={20} color="var(--color-accent)" />
        </div>
        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
          Insights Automatizados
        </h3>
      </div>
      <div className="space-y-3">
        {insights?.map((insight, index) => {
          const colors = getInsightColor(insight?.type);
          return (
            <div
              key={index}
              className={`${colors?.bg} rounded-lg p-3 md:p-4 transition-smooth hover:shadow-elevation-sm`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon name={getInsightIcon(insight?.type)} size={18} color={colors?.icon} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-heading font-medium text-sm ${colors?.text} mb-1`}>
                    {insight?.title}
                  </h4>
                  <p className="caption text-xs text-foreground leading-relaxed">
                    {insight?.description}
                  </p>
                  {insight?.action && (
                    <button className={`mt-2 caption text-xs font-medium ${colors?.text} 
                      hover:underline flex items-center gap-1`}>
                      {insight?.action}
                      <Icon name="ArrowRight" size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="caption text-xs text-muted-foreground">
            Última actualización: Hace 5 minutos
          </span>
          <button className="caption text-xs font-medium text-accent hover:underline flex items-center gap-1">
            Ver todos los insights
            <Icon name="ExternalLink" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;