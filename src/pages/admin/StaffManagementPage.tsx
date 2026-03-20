import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../services/api';
import { Search, UserPlus, Shield, Check, X, Loader2, Users } from 'lucide-react';
import type { User, Role } from '../../types';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DateDisplay from '../../components/common/DateDisplay';
import toast from 'react-hot-toast';

const ALL_ROLES: Role[] = ['Admin','OperationsManager','CustomerService','Sales','Driver','Mover','WarehouseWorker','Packer','QualityAssurance','ITSupport','Marketing','Client'];

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-100 text-red-700',
  OperationsManager: 'bg-purple-100 text-purple-700',
  CustomerService: 'bg-blue-100 text-blue-700',
  Sales: 'bg-green-100 text-green-700',
  Driver: 'bg-amber-100 text-amber-700',
  Mover: 'bg-orange-100 text-orange-700',
  Client: 'bg-slate-100 text-slate-600',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROLE_COLORS[role] || 'bg-slate-100 text-slate-600'}`}>
      {role}
    </span>
  );
}

export default function StaffManagementPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, page],
    queryFn: () => userApi.getAll({ role: roleFilter || undefined, page, limit: 20 }),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) => userApi.updateRole(userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Role updated'); },
    onError: () => toast.error('Failed to update role'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => userApi.setActive(userId, isActive),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User status updated'); },
    onError: () => toast.error('Failed to update user'),
  });

  const users: User[] = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const filtered = search.trim()
    ? users.filter((u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500 text-sm">Manage users, roles, and access</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1); }}>
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {['User','Email','Role','Joined','Status','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-400">No users found</td></tr>
                ) : filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <span className="font-medium text-slate-900">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <RoleBadge role={user.role} />
                        <select
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          value={user.role}
                          onChange={(e) => updateRole.mutate({ userId: user._id, role: e.target.value as Role })}
                        >
                          {ALL_ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs"><DateDisplay date={user.createdAt} format="PP" /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive.mutate({ userId: user._id, isActive: !(user.isActive !== false) })}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${user.isActive !== false ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {user.isActive !== false ? <X size={12} /> : <Check size={12} />}
                        {user.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
