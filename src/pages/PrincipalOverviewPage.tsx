import type { CSSProperties } from 'react';
import { MainContentPlate } from '../components/layout/PageFrame';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import type { PrincipalOverview } from '../selectors/principalOverviewSelectors';
import '../features/factualFeedback/factual-feedback.css';
import './principal-overview.css';

const metricLabels = {
  activeWarningCount: '当前活动预警',
  interventionCount: '干预中',
  pendingRetestCount: '待复测',
  closedThisMonthCount: '本月已闭环',
} as const;

export function PrincipalOverviewPage({ overview }: { overview: PrincipalOverview }) {
  const { overall, collaboration, managementAttention } = overview;
  return (
    <main className="ff-app ff-pending-page principal-overview-page">
      <header className="ff-page-header"><h1>校级概览</h1></header>
      <MainContentPlate className="ff-pending-page__plate principal-overview-page__plate">
        <section className="principal-section" aria-labelledby="principal-overall-title">
          <div className="principal-section__heading"><h2 id="principal-overall-title">整体态势</h2><Badge designSystem="figma-v01" variant="neutral">全校聚合</Badge></div>
          <div className="principal-stat-grid">
            {(Object.keys(metricLabels) as Array<keyof typeof metricLabels>).map((key) => (
              <Card key={key} variant="figma-v01" className="principal-stat-card">
                <span>{metricLabels[key]}</span><strong>{overall[key]}</strong>
              </Card>
            ))}
          </div>
        </section>

        <section className="principal-section" aria-labelledby="principal-collaboration-title">
          <div className="principal-section__heading"><h2 id="principal-collaboration-title">班主任协作进度</h2></div>
          <Card variant="figma-v01" className="principal-progress-card">
            <div className="principal-progress-card__rate">
              <div className="principal-rate-ring" style={{ '--principal-rate': `${collaboration.completionRate}%` } as CSSProperties}>
                <strong>{collaboration.completionRate}%</strong><span>完成率</span>
              </div>
            </div>
            <dl className="principal-progress-card__counts">
              <div><dt>已完成</dt><dd>{collaboration.completedCount}</dd></div>
              <div><dt>待反馈</dt><dd>{collaboration.pendingFeedbackCount}</dd></div>
              <div><dt>已超时</dt><dd>{collaboration.overdueCount}</dd></div>
            </dl>
            <div className="principal-overdue-distribution">
              <strong>{collaboration.overdueCount} 项协作反馈已超时</strong>
              {collaboration.overdueByGrade.length ? (
                <ul>{collaboration.overdueByGrade.map((item) => <li key={item.gradeLabel}><span>{item.gradeLabel}</span><b>{item.count} 项</b></li>)}</ul>
              ) : <p>各年级暂无超时协作反馈。</p>}
            </div>
          </Card>
        </section>

        <section className="principal-section" aria-labelledby="principal-attention-title">
          <div className="principal-section__heading"><h2 id="principal-attention-title">管理关注</h2></div>
          <div className="principal-attention-list">
            <AttentionCard count={managementAttention.overdueFeedbackCount} title="项协作反馈已超时" description="需要关注班主任协作是否出现持续积压。" tone="error" />
            <AttentionCard count={managementAttention.longRunningInterventionCount} title="项干预事项持续时间较长" description="建议持续关注专业处置推进情况。" tone="warning" />
            <AttentionCard count={managementAttention.activeReferralCount} title="项转介事项正在处理中" description="当前存在尚未闭环的外部转介事项。" tone="neutral" />
          </div>
        </section>
      </MainContentPlate>
    </main>
  );
}

function AttentionCard({ count, title, description, tone }: { count: number; title: string; description: string; tone: 'error' | 'warning' | 'neutral' }) {
  return <Card variant="figma-v01" className="principal-attention-card"><div><strong>{count} {title}</strong><Badge designSystem="figma-v01" variant={tone}>{count ? '需关注' : '暂无'}</Badge></div><p>{description}</p></Card>;
}
