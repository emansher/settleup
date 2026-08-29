import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description required'),
  amount: z.coerce.number().positive('Amount must be positive'),
});

const memberSchema = z.object({
  email: z.string().email('Valid email required'),
});

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const res = await api.get(`/groups/${id}`);
      return res.data.group;
    },
    enabled: !!id,
  });

  const { data: balancesData } = useQuery({
    queryKey: ['balances', id],
    queryFn: async () => {
      const res = await api.get(`/expenses/group/${id}/balances`);
      return res.data.balances;
    },
    enabled: !!id,
  });

  const createExpense = useMutation({
    mutationFn: (payload) => api.post('/expenses', { ...payload, groupId: id, splitEqually: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['balances', id] });
      setShowExpenseForm(false);
      expenseReset();
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (expenseId) => api.delete(`/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['balances', id] });
    },
  });

  const addMember = useMutation({
    mutationFn: (payload) => api.post(`/groups/${id}/members`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setShowMemberForm(false);
      memberReset();
    },
  });

  const { register: expenseReg, handleSubmit: handleExpense, reset: expenseReset, formState: { errors: expenseErrors } } = useForm({
    resolver: zodResolver(expenseSchema),
  });

  const { register: memberReg, handleSubmit: handleMember, reset: memberReset, formState: { errors: memberErrors } } = useForm({
    resolver: zodResolver(memberSchema),
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Failed to load group. <Link to="/dashboard" className="underline">Back to dashboard</Link>
      </div>
    );
  }

  const isOwner = data.myRole === 'OWNER';
  const expenses = data.expenses || [];
  const members = data.members || [];

  return (
    <div>
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={16} /> Back to groups
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          {data.description && <p className="text-gray-500 text-sm mt-1">{data.description}</p>}
          <p className="text-xs text-gray-400 mt-1">Your role: {data.myRole}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button onClick={() => setShowMemberForm(true)} className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              <UserPlus size={16} /> Add member
            </button>
          )}
          <button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-1 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700">
            <Plus size={16} /> Add expense
          </button>
        </div>
      </div>

      {showMemberForm && (
        <div className="mb-6 bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Add member by email</h3>
          <form onSubmit={handleMember((d) => addMember.mutate(d))} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <input {...memberReg('email')} placeholder="friend@example.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
              {memberErrors.email && <p className="text-red-600 text-xs mt-1">{memberErrors.email.message}</p>}
              {addMember.isError && <p className="text-red-600 text-xs mt-1">{addMember.error?.response?.data?.error || 'Failed'}</p>}
            </div>
            <button type="submit" disabled={addMember.isPending} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60">
              {addMember.isPending ? 'Adding…' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowMemberForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
          </form>
        </div>
      )}

      {showExpenseForm && (
        <div className="mb-6 bg-white border rounded-xl p-5">
          <h3 className="font-semibold mb-3">Log a new expense</h3>
          <form onSubmit={handleExpense((d) => createExpense.mutate(d))} className="space-y-3 max-w-md">
            {createExpense.isError && <p className="text-red-600 text-sm">{createExpense.error?.response?.data?.error || 'Failed'}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input {...expenseReg('description')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. Dinner at Olive Garden" />
              {expenseErrors.description && <p className="text-red-600 text-xs mt-1">{expenseErrors.description.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($)</label>
              <input {...expenseReg('amount')} type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0.00" />
              {expenseErrors.amount && <p className="text-red-600 text-xs mt-1">{expenseErrors.amount.message}</p>}
            </div>
            <p className="text-xs text-gray-500">Will be split equally among all members. You are marked as the payer.</p>
            <div className="flex gap-2">
              <button type="submit" disabled={createExpense.isPending} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-60">
                {createExpense.isPending ? 'Saving…' : 'Save expense'}
              </button>
              <button type="button" onClick={() => setShowExpenseForm(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Balances</h2>
          {!balancesData || balancesData.length === 0 ? (
            <p className="text-sm text-gray-500">No expenses yet</p>
          ) : (
            <ul className="space-y-3">
              {balancesData.map((b) => (
                <li key={b.userId} className="flex justify-between items-center text-sm">
                  <span className={b.userId === user?.id ? 'font-semibold' : ''}>
                    {b.name} {b.userId === user?.id && '(you)'}
                  </span>
                  <span className={b.balance > 0.01 ? 'text-green-600 font-medium' : b.balance < -0.01 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                    {b.balance > 0.01 ? `+$${b.balance.toFixed(2)}` : b.balance < -0.01 ? `-$${Math.abs(b.balance).toFixed(2)}` : 'settled'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-400 mt-4">Positive = others owe them · Negative = they owe others</p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Members ({members.length})</h2>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex justify-between text-sm">
                <span>{m.user.name}</span>
                <span className="text-xs text-gray-400">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-xl p-5 lg:col-span-3">
          <h2 className="font-semibold text-gray-900 mb-4">Expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No expenses yet. Add the first one!</div>
          ) : (
            <ul className="divide-y">
              {expenses.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{e.description}</p>
                    <p className="text-xs text-gray-500">Paid by {e.paidBy.name} · {new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-gray-900">${e.amount.toFixed(2)}</span>
                    {(e.paidById === user?.id || isOwner) && (
                      <button
                        onClick={() => { if (confirm('Delete this expense?')) deleteExpense.mutate(e.id); }}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
