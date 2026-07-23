import type { ObservationFormValues } from '../../domain/feedback';

export type FeedbackFieldErrors = Partial<
  Record<'observedAt' | 'facts', string>
>;

export function validateFeedback(
  values: ObservationFormValues,
  now: string,
): FeedbackFieldErrors {
  const errors: FeedbackFieldErrors = {};
  if (!values.observedAt) {
    errors.observedAt = '请选择观察时间';
  } else if (new Date(values.observedAt).getTime() > new Date(now).getTime()) {
    errors.observedAt = '观察时间不能晚于当前时间';
  }

  const factsLength = values.facts.trim().length;
  if (factsLength === 0) {
    errors.facts = '请填写事实观察内容';
  } else if (factsLength < 20 || factsLength > 500) {
    errors.facts = '事实观察需为 20–500 字';
  }
  return errors;
}

export function isFeedbackDirty(values: ObservationFormValues) {
  return Boolean(values.observedAt || values.facts.trim());
}

export function toLocalDateTimeValue(value: string) {
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}
