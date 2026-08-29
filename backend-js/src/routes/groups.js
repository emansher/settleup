import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  description: z.string().optional(),
});

const updateGroupSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

async function getMembership(userId, groupId) {
  return prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
}

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = createGroupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        members: {
          create: { userId: req.userId, role: 'OWNER' },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.status(201).json({ group });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, expenses: true } },
            members: { include: { user: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      myRole: m.role,
    }));

    res.json({ groups });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const membership = await getMembership(req.userId, req.params.id);
    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        expenses: {
          include: {
            paidBy: { select: { id: true, name: true } },
            splits: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });

    res.json({ group: { ...group, myRole: membership.role } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const membership = await getMembership(req.userId, req.params.id);
    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only the group owner can update the group' });
    }

    const data = updateGroupSchema.parse(req.body);
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data,
      include: { members: { include: { user: { select: { id: true, name: true } } } } },
    });

    res.json({ group });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const membership = await getMembership(req.userId, req.params.id);
    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only the group owner can delete the group' });
    }

    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ message: 'Group deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const membership = await getMembership(req.userId, req.params.id);
    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Only the group owner can add members' });
    }

    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found. They must register first.' });

    const existing = await getMembership(user.id, req.params.id);
    if (existing) return res.status(400).json({ error: 'User is already a member' });

    const member = await prisma.groupMember.create({
      data: { userId: user.id, groupId: req.params.id, role: 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ member });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
