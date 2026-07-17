import type { UserRole } from '../../domain/users';
import { AppIcon, type AppIconName } from '../ui/AppIcon';

export interface BottomNavigationItem {
  key: string;
  label: string;
  hash: string;
  icon: AppIconName;
}

const teacherItems: BottomNavigationItem[] = [
  { key: 'home', label: '首页', hash: '#/mvp/home', icon: 'home' },
  { key: 'tasks', label: '任务', hash: '#/mvp/teacher/tasks', icon: 'tasks' },
  { key: 'report', label: '上报', hash: '#/mvp/report', icon: 'report' },
  { key: 'profile', label: '我的', hash: '#/mvp/profile', icon: 'profile' },
];

const directorItems: BottomNavigationItem[] = [
  { key: 'home', label: '首页', hash: '#/mvp/home', icon: 'home' },
  { key: 'supervision', label: '督办', hash: '#/mvp/supervision', icon: 'supervision' },
  { key: 'profile', label: '我的', hash: '#/mvp/profile', icon: 'profile' },
];

export function getNavigationItems(role: UserRole) {
  return role === 'grade_director' ? directorItems : teacherItems;
}

export function BottomNavigation({
  role,
  activeKey,
  onNavigate,
}: {
  role: UserRole;
  activeKey: string;
  onNavigate: (hash: string) => void;
}) {
  const items = getNavigationItems(role);
  return (
    <nav className="mvp-bottom-nav" aria-label="主导航">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            className={active ? 'mvp-bottom-nav__item is-active' : 'mvp-bottom-nav__item'}
            aria-current={active ? 'page' : undefined}
            onClick={() => onNavigate(item.hash)}
          >
            <AppIcon name={item.icon} size={21} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
