const LOCAL_DEMO_PREFIXES = [
  'changshu:abnormal-report-draft:v1:',
  'changshu-demo:observation-draft:v1:',
  'changshu-demo:feedback-request-draft:v1:',
];

const SESSION_DEMO_NAVIGATION_PREFIXES = [
  'changshu-demo:teacher-task-scroll:',
  'changshu-demo:teacher-task-last-filter',
  'changshu-demo:teacher-task-last-view',
];

function removeMatchingKeys(storage: Storage, prefixes: readonly string[]) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key));
  keys.forEach((key) => {
    if (prefixes.some((prefix) => key.startsWith(prefix))) storage.removeItem(key);
  });
}

export function clearDemoDraftsAndNavigation(
  localStorage: Storage,
  sessionStorage: Storage,
) {
  removeMatchingKeys(localStorage, LOCAL_DEMO_PREFIXES);
  removeMatchingKeys(sessionStorage, SESSION_DEMO_NAVIGATION_PREFIXES);
}
