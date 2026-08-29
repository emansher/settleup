import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createExpenseSchema = z.object({
  groupId: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().optional(),
  splitEqually: z.boolean().default(true),
  splits: z.array(z.object({ userId: z.string(), amount: z.number().positive() })).optional(),
});

const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().optional(),
});

async function isMember(userId, groupId) {
  return prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createExpenseSchema.parse(req.body);

    const membership = await isMember(req.userId, data.groupId);
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const members = await prisma.groupMember.findMany({
      where: { groupId: data.groupId },
      select: { userId: true },
    });

    if (members.length === 0) return res.status(400).json({ error: 'Group has no members' });

    let splitData;

    if (data.splits && data.splits.length > 0) {
      const total = data.splits.reduce((s, x) => s + x.amount, 0);
      if (Math.abs(total - data.amount) > 0.01) {
        return res.status(400).json({ error: 'Split amounts must equal total expense amount' });
      }
      splitData = data.splits;
    } else {
      const share = Math.round((data.amount / members.length) * 100) / 100;
      splitData = members.map((m, i) => ({
        userId: m.userId,
        amount: i === 0 ? data.amount - share * (members.length - 1) : share,
      }));
    }

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        paidById: req.userId,
        groupId: data.groupId,
        splits: { create: splitData },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: true,
      },
    });

    res.status(201).json({ expense });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.get('/group/:groupId', requireAuth, async (req, res, next) => {
  try {
    const membership = await isMember(req.userId, req.params.groupId);
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const expenses = await prisma.expense.findMany({
      where: { groupId: req.params.groupId },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json({ expenses });
  } catch (err) {
    next(err);
  }
});

router.get('/group/:groupId/balances', requireAuth, async (req, res, next) => {
  try {
    const membership = await isMember(req.userId, req.params.groupId);
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const expenses = await prisma.expense.findMany({
      where: { groupId: req.params.groupId },
      include: { splits: true, paidBy: { select: { id: true, name: true } } },
    });

    const members = await prisma.groupMember.findMany({
      where: { groupId: req.params.groupId },
      include: { user: { select: { id: true, name: true } } },
    });

    const balances = {};
    members.forEach((m) => {
      balances[m.userId] = { userId: m.userId, name: m.user.name, balance: 0 };
    });

    for (const exp of expenses) {
      if (balances[exp.paidById]) balances[exp.paidById].balance += exp.amount;
      for (const split of exp.splits) {
        if (balances[split.userId]) balances[split.userId].balance -= split.amount;
      }
    }

    res.json({ balances: Object.values(balances) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { group: { include: { members: true } } },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const isPayer = expense.paidById === req.userId;
    const isOwner = expense.group.members.some(
      (m) => m.userId === req.userId && m.role === 'OWNER'
    );
    if (!isPayer && !isOwner) {
      return res.status(403).json({ error: 'Only the payer or group owner can edit this expense' });
    }

    const data = updateExpenseSchema.parse(req.body);
    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: { paidBy: { select: { id: true, name: true } }, splits: true },
    });

    res.json({ expense: updated });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { group: { include: { members: true } } },
    });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const isPayer = expense.paidById === req.userId;
    const isOwner = expense.group.members.some(
      (m) => m.userId === req.userId && m.role === 'OWNER'
    );
    if (!isPayer && !isOwner) {
      return res.status(403).json({ error: 'Only the payer or group owner can delete this expense' });
    }

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
