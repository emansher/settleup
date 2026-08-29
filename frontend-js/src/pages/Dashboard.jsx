import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Users, Receipt } from 'lucide-react';

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const res = await api.get('/groups');
      return res.data.groups;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/groups', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      reset();
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(createSchema),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return <div className="bg-red-50 text-red-700 p-4 rounded-lg">Failed to load groups. Please try again.</div>;
  }

  const groups = data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your groups</h1>
          <p className="text-gray-500 text-sm mt-1">Manage shared expenses with friends</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition"
        >
          <Plus size={18} /> New group
        </button>
      </div>

      {showCreate && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Create a new group</h2>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 max-w-md">
            {createMutation.isError && (
              <div className="text-red-600 text-sm">
                {createMutation.error?.response?.data?.error || 'Failed to create group'}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group name *</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="e.g. Apartment 4B"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60"
              >
                {createMutation.isPending ? 'Creating…' : 'Create group'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Users className="mx-auto text-gray-300" size={48} />
          <h3 className="mt-4 font-semibold text-gray-700">No groups yet</h3>
          <p className="text-gray-500 text-sm mt-1">Create your first group to start tracking expenses</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            Create a group
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{g.name}</h3>
                  {g.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{g.description}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium">{g.myRole}</span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users size={14} /> {g._count?.members ?? g.members?.length ?? 0} members</span>
                <span className="flex items-center gap-1"><Receipt size={14} /> {g._count?.expenses ?? 0} expenses</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
