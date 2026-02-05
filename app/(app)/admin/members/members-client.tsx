'use client';

import { useState } from 'react';
import { Users, Search, Shield, Crown, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/members/level-badge';
import { changeUserRole } from './actions';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import Link from 'next/link';

type Member = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  points: number;
  level: number;
  createdAt: Date;
  lastSeenAt: Date | null;
  subscriptionStatus: string | null;
};

export function AdminMembersClient({ members: initialMembers }: { members: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [changingRole, setChangingRole] = useState<number | null>(null);

  const filtered = members.filter((m) => {
    const matchesSearch = !search || 
      (m.name?.toLowerCase().includes(search.toLowerCase()) ||
       m.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  async function handleRoleChange(userId: number, newRole: string) {
    setChangingRole(userId);
    try {
      await changeUserRole(userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert('როლის შეცვლა ვერ მოხერხდა');
    }
    setChangingRole(null);
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'admin':
        return <Crown className="h-3.5 w-3.5 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-3.5 w-3.5 text-blue-600" />;
      default:
        return <UserIcon className="h-3.5 w-3.5 text-gray-400" />;
    }
  }

  function getRoleBadge(role: string) {
    const colors: Record<string, string> = {
      admin: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      moderator: 'bg-blue-50 text-blue-700 border-blue-200',
      member: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    const labels: Record<string, string> = {
      admin: 'ადმინი',
      moderator: 'მოდერატორი',
      member: 'წევრი',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors[role] || colors.member}`}>
        {getRoleIcon(role)}
        {labels[role] || role}
      </span>
    );
  }

  function getSubscriptionBadge(status: string | null) {
    if (status === 'active') {
      return (
        <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
          ფასიანი
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-400">უფასო</span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-orange-600" />
        <h1 className="text-2xl font-bold text-gray-900">წევრების მართვა</h1>
        <span className="text-sm text-gray-500">({members.length})</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="მოძებნეთ სახელით ან ელფოსტით..."
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-orange-300"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300"
        >
          <option value="all">ყველა როლი</option>
          <option value="admin">ადმინი</option>
          <option value="moderator">მოდერატორი</option>
          <option value="member">წევრი</option>
        </select>
      </div>

      {/* Members table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">წევრი</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">როლი</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">გეგმა</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ქულები</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">გაწევრიანდა</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">მოქმედება</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <Link href={`/members/${member.id}`} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.name?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.name || 'უსახელო'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                <td className="px-4 py-3">{getSubscriptionBadge(member.subscriptionStatus)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <LevelBadge level={member.level} />
                    <span className="text-gray-600">{member.points}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(member.createdAt), {
                    addSuffix: true,
                    locale: ka,
                  })}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={changingRole === member.id}
                    className="rounded border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-orange-300 disabled:opacity-50"
                  >
                    <option value="member">წევრი</option>
                    <option value="moderator">მოდერატორი</option>
                    <option value="admin">ადმინი</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500">წევრები ვერ მოიძებნა</p>
        )}
      </div>
    </div>
  );
}
