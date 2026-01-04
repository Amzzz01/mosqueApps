// src/components/admin/QuickActions.tsx
import Link from 'next/link';
import { UserPlus, DollarSign, Megaphone, Users } from 'lucide-react';

const actions = [
  {
    href: '/admin/members/new',
    label: 'Tambah Ahli',
    icon: UserPlus,
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    href: '/admin/donations/new',
    label: 'Rekod Derma',
    icon: DollarSign,
    color: 'bg-green-600 hover:bg-green-700',
  },
  {
    href: '/admin/announcements/new',
    label: 'Buat Pengumuman',
    icon: Megaphone,
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    href: '/admin/members',
    label: 'Lihat Ahli',
    icon: Users,
    color: 'bg-emerald-600 hover:bg-emerald-700',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tindakan Pantas
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg transition-colors flex items-center space-x-3`}
            >
              <Icon className="h-6 w-6" />
              <span className="font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}