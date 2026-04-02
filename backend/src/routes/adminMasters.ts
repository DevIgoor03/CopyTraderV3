import { Router, Response } from 'express';
import { z } from 'zod';
import { CopyPlan, Prisma } from '@prisma/client';
import { prisma } from '../database/prisma.js';
import { authService } from '../services/AuthService.js';
import { planService } from '../services/PlanService.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logger } from '../utils/logger.js';
import {
  assertSlugNotConflictingWithMasterIds,
  normalizePortalSlug,
  validatePortalSlug,
} from '../utils/portalSlug.js';

const router = Router();

router.use(requireAdmin as any);

const createMasterSchema = z.object({
  email:              z.string().email('Email inválido'),
  password:           z.string().min(8, 'Senha: mínimo 8 caracteres'),
  name:               z.string().min(2, 'Nome muito curto').max(80),
  subscriptionPlan:   z.nativeEnum(CopyPlan).optional(),
});

const patchPlanSchema = z.object({
  subscriptionPlan: z.nativeEnum(CopyPlan),
});

const patchPortalSlugSchema = z.object({
  portalSlug: z.union([z.string().max(100), z.null()]),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Senha: mínimo 8 caracteres'),
});

function planPayload(plan: CopyPlan, followerCount: number) {
  const spec = planService.spec(plan);
  const max    = spec.maxFollowers;
  const remaining = max === null ? null : Math.max(0, max - followerCount);
  return {
    tier:                  plan,
    name:                  spec.name,
    emoji:                 spec.emoji,
    priceBrlPerUser:       spec.priceBrlPerUser,
    suggestedLimitLabel:   spec.suggestedLimitLabel,
    maxFollowers:          max,
    followerCount,
    followerSlotsRemaining: remaining,
    features:              spec.features,
    optimizedCopy:         spec.optimizedCopy,
    priorityServer:        spec.priorityServer,
    vipSupport:            spec.vipSupport,
  };
}

// GET /api/admin/plans — catálogo público (admin)
router.get('/plans', (_req: AuthRequest, res: Response) => {
  res.json({ plans: planService.catalogList() });
});

// GET /api/admin/masters
router.get('/masters', async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await prisma.user.findMany({
      where:   { role: 'MASTER' },
      orderBy: { createdAt: 'desc' },
      select:  {
        id:               true,
        email:            true,
        name:             true,
        createdAt:        true,
        subscriptionPlan: true,
        portalSlug:       true,
        masterAccount: {
          select: {
            id:           true,
            bullexEmail:  true,
            isConnected:  true,
            copyRunning:  true,
            balanceReal:  true,
            balanceDemo:  true,
            currency:     true,
            _count:       { select: { followers: true, trades: true } },
          },
        },
      },
    });
    const masters = rows.map((u) => {
      const fc = u.masterAccount?._count.followers ?? 0;
      return {
        id:               u.id,
        email:            u.email,
        name:             u.name,
        createdAt:        u.createdAt,
        subscriptionPlan: u.subscriptionPlan,
        portalSlug:       u.portalSlug,
        plan:             planPayload(u.subscriptionPlan, fc),
        masterAccount: u.masterAccount
          ? {
            id:            u.masterAccount.id,
            bullexEmail:   u.masterAccount.bullexEmail,
            isConnected:   u.masterAccount.isConnected,
            copyRunning:   u.masterAccount.copyRunning,
            balanceReal:   u.masterAccount.balanceReal,
            balanceDemo:   u.masterAccount.balanceDemo,
            currency:      u.masterAccount.currency,
            followerCount: u.masterAccount._count.followers,
            tradeCount:    u.masterAccount._count.trades,
          }
          : null,
      };
    });
    res.json({ masters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/masters
router.post('/masters', validate(createMasterSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.createMasterUser(
      req.body.email,
      req.body.password,
      req.body.name,
      req.body.subscriptionPlan ?? CopyPlan.START
    );
    res.status(201).json({ user });
  } catch (err: any) {
    logger.warn({ err: err.message }, 'Admin create master failed');
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/admin/masters/:userId/portal-slug — ID público na URL /portal/{slug}
router.patch('/masters/:userId/portal-slug', validate(patchPortalSlugSchema), async (req: AuthRequest, res: Response) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target || target.role !== 'MASTER') {
      res.status(404).json({ error: 'Usuário master não encontrado' });
      return;
    }

    const raw = req.body.portalSlug;
    if (raw === null || (typeof raw === 'string' && raw.trim() === '')) {
      await prisma.user.update({
        where: { id: target.id },
        data:  { portalSlug: null },
      });
      logger.info({ targetUserId: target.id, byAdmin: req.user!.userId }, 'Master portal slug cleared');
      res.json({ user: { id: target.id, portalSlug: null } });
      return;
    }

    const slug = validatePortalSlug(normalizePortalSlug(String(raw)));
    await assertSlugNotConflictingWithMasterIds(slug, target.id);

    try {
      const updated = await prisma.user.update({
        where: { id: target.id },
        data:  { portalSlug: slug },
        select: { id: true, portalSlug: true },
      });
      logger.info({ targetUserId: target.id, portalSlug: slug, byAdmin: req.user!.userId }, 'Master portal slug set');
      res.json({ user: updated });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        res.status(400).json({ error: 'Este identificador já está em uso por outro operador' });
        return;
      }
      throw err;
    }
  } catch (err: any) {
    const msg = err.message ?? 'Falha ao salvar identificador';
    res.status(400).json({ error: msg });
  }
});

// PATCH /api/admin/masters/:userId/plan
router.patch('/masters/:userId/plan', validate(patchPlanSchema), async (req: AuthRequest, res: Response) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target || target.role !== 'MASTER') {
      res.status(404).json({ error: 'Usuário master não encontrado' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data:  { subscriptionPlan: req.body.subscriptionPlan },
      select: { id: true, email: true, subscriptionPlan: true },
    });
    logger.info(
      { targetUserId: target.id, plan: req.body.subscriptionPlan, byAdmin: req.user!.userId },
      'Master subscription plan updated'
    );
    res.json({ user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/masters/:userId/password
router.patch('/masters/:userId/password', validate(resetPasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target || target.role !== 'MASTER') {
      res.status(404).json({ error: 'Usuário master não encontrado' });
      return;
    }
    const passwordHash = await authService.hashPassword(req.body.newPassword);
    await prisma.user.update({
      where: { id: target.id },
      data:  { passwordHash },
    });
    await prisma.refreshSession.deleteMany({ where: { userId: target.id } });
    logger.info({ targetUserId: target.id, byAdmin: req.user!.userId }, 'Master password reset by admin');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/masters/:userId
router.delete('/masters/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (req.params.userId === req.user!.userId) {
      res.status(400).json({ error: 'Não é possível excluir a própria conta por esta rota' });
      return;
    }
    const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!target || target.role !== 'MASTER') {
      res.status(404).json({ error: 'Usuário master não encontrado' });
      return;
    }
    await prisma.user.delete({ where: { id: target.id } });
    logger.info({ targetUserId: target.id, byAdmin: req.user!.userId }, 'Master user deleted by admin');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
