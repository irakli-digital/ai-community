import { t } from '@/lib/i18n/ka';
import Link from 'next/link';
import { FolderOpen, BookOpen, Users, Settings } from 'lucide-react';

const adminLinks = [
  {
    href: '/admin/categories',
    icon: FolderOpen,
    title: 'კატეგორიები',
    desc: 'პოსტების კატეგორიების მართვა',
  },
  {
    href: '/admin/courses',
    icon: BookOpen,
    title: 'კურსები',
    desc: 'კურსების, სექციებისა და გაკვეთილების მართვა',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-orange-300 hover:bg-orange-50/50"
          >
            <link.icon className="mt-0.5 h-5 w-5 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">{link.title}</p>
              <p className="text-sm text-gray-500">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
