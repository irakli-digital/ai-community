'use client';

import { useState } from 'react';
import { Users, Search, Shield, Crown, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/members/level-badge';
import { changeUserRole } from './actions';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
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
      alert('Failed to change role');
    }
    setChangingRole(null);
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Crown className="h-3.5 w-3.5 text-foreground" />;
      case 'moderator':
        return <Shield className="h-3.5 w-3.5 text-muted-foreground" />;
      default:
        return <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  }

  function getRoleBadge(role: string) {
    const colors: Record<string, string> = {
      owner: 'bg-primary text-primary-foreground border-primary',
      admin: 'bg-primary text-primary-foreground border-primary',
      moderator: 'bg-accent text-foreground border-border',
      member: 'bg-secondary text-muted-foreground border-border',
    };
    const labels: Record<string, string> = {
      owner: 'Owner',
      admin: 'Admin',
      moderator: 'Moderator',
      member: 'Member',
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
          Paid
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">Free</span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Manage Members</h1>
        <span className="text-sm text-muted-foreground">({members.length})</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm outline-none focus:border-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* Members table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Points</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-accent/50">
                <td className="px-4 py-3">
                  <Link href={`/members/${member.id}`} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.name?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {member.name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                <td className="px-4 py-3">{getSubscriptionBadge(member.subscriptionStatus)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <LevelBadge level={member.level} />
                    <span className="text-muted-foreground">{member.points}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(member.createdAt), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    disabled={changingRole === member.id}
                    className="rounded border border-border bg-card px-2 py-1 text-xs outline-none focus:border-ring disabled:opacity-50"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-muted-foreground">No members found</p>
        )}
      </div>
    </div>
  );
}
