/**
 * System routes — perform core server operations like updating from git.
 * Requires owner role for all operations.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { authMiddleware } from './auth-middleware.js';
import { requireRole } from './role-middleware.js';
import { logger } from '../../shared/utils/logger.js';

const execPromise = promisify(exec);

export async function systemRoutes(app: FastifyInstance): Promise<void> {
  // All routes in this module require authentication
  app.addHook('preHandler', authMiddleware);

  /**
   * POST /api/v1/system/update — pull latest changes from git.
   * Only accessible to owners.
   */
  app.post(
    '/api/v1/system/update',
    { preHandler: requireRole('owner') },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      logger.info(`System update requested by ${user.email}`);

      try {
        // Run git pull from the parent directory (root of the repo)
        const { stdout, stderr } = await execPromise('git pull', {
          cwd: process.cwd().includes('backend') ? '..' : '.',
        });

        logger.info('Git pull output:', stdout);
        if (stderr) logger.warn('Git pull warnings:', stderr);

        // Check if there was any update
        const isUpToDate = stdout.includes('Already up to date');

        return {
          ok: true,
          output: stdout,
          message: isUpToDate ? 'Hệ thống đã ở phiên bản mới nhất' : 'Cập nhật thành công. Vui lòng khởi động lại hệ thống để áp dụng.',
          needsRestart: !isUpToDate,
        };
      } catch (error: any) {
        logger.error('Git update failed:', error.message);
        return reply.status(500).send({
          ok: false,
          error: 'Cập nhật thất bại. Kiểm tra kết nối Git hoặc xung đột tệp.',
          details: error.message,
        });
      }
    },
  );

  /**
   * GET /api/v1/system/version — get current version info.
   */
  app.get('/api/v1/system/version', async () => {
    try {
      // Try to get the latest commit hash and date
      const { stdout: hash } = await execPromise('git rev-parse --short HEAD').catch(() => ({ stdout: 'unknown' }));
      const { stdout: date } = await execPromise('git log -1 --format=%cd --date=iso').catch(() => ({ stdout: 'unknown' }));

      return {
        version: '1.0.0',
        commit: hash.trim(),
        date: date.trim(),
      };
    } catch {
      return { version: '1.0.0', commit: 'n/a', date: 'n/a' };
    }
  });
}
