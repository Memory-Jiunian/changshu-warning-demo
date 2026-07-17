import { AppIcon } from '../ui/AppIcon';

export function PrivacyNotice({ children }: { children: string }) {
  return (
    <div className="mvp-privacy-notice">
      <AppIcon name="shield" size={18} />
      <p>{children}</p>
    </div>
  );
}
