import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './ui.css';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface SheetProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  onClose: () => void;
}

export function Sheet({
  open,
  title,
  description,
  children,
  footer,
  dismissible = true,
  onClose,
}: SheetProps) {
  const generatedId = useId();
  const titleId = `ui-sheet-title-${generatedId}`;
  const descriptionId = `ui-sheet-description-${generatedId}`;
  const panelRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById('app');
    const previousInert = appRoot?.inert ?? false;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    if (appRoot) appRoot.inert = true;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.right = '0';
    document.body.style.width = '100%';

    const focusPanel = window.requestAnimationFrame(() => panelRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (dismissibleRef.current) {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || activeElement === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!panelRef.current.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusPanel);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (appRoot) appRoot.inert = previousInert;
      document.documentElement.style.overflow = previousHtmlOverflow;
      Object.assign(document.body.style, previousBodyStyles);
      window.scrollTo(scrollX, scrollY);

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      } else {
        document
          .querySelector<HTMLElement>('#app button:not([disabled]), #app [href], #app [tabindex="0"]')
          ?.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  const overlayRoot = document.getElementById('overlay-root');
  if (!overlayRoot) return null;

  return createPortal(
    <div className="ui-sheet">
      <div
        className="ui-sheet__overlay"
        aria-hidden="true"
        onClick={() => {
          if (dismissible) onClose();
        }}
      />
      <section
        ref={panelRef}
        className="ui-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className="ui-sheet__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button
            className="ui-sheet__close"
            type="button"
            aria-label="关闭"
            disabled={!dismissible}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="ui-sheet__body">{children}</div>
        {footer ? <footer className="ui-sheet__footer">{footer}</footer> : null}
      </section>
    </div>,
    overlayRoot,
  );
}
