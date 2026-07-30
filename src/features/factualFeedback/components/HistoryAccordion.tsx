import { useState } from 'react';
import type { ObservationRecord } from '../../../domain/feedback';
import { FeedbackRecord } from './FeedbackRecord';

export function HistoryAccordion({ records }: { records: ObservationRecord[] }) {
  const [open, setOpen] = useState(true);
  if (records.length === 0) return null;
  return (
    <section className="ff-history">
      <button
        type="button"
        className="ff-history__toggle"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ff-history__title">历史反馈（{records.length}条）</span>
        <span
          className={`ff-history__chevron${open ? ' ff-history__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="ff-history__records">
          {records.map((record) => (
            <FeedbackRecord key={record.id} record={record} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
