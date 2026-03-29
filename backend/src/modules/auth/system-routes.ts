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
        const targetPath = '/var/www/quanly.khacdaunhanh.vn';

        // Add to safe directory to avoid dubious ownership errors
        await execPromise(`git config --global --add safe.directory ${targetPath}`).catch(() => {});

        // Pull latest code
        const { stdout, stderr } = await execPromise('git stash && git pull', { cwd: targetPath });
        logger.info('Git pull output:', stdout);
        if (stderr) logger.warn('Git pull warnings:', stderr);

        const isUpToDate = stdout.includes('Already up to date') || stdout.includes('up-to-date');
        
        // If there's an update, start a background rebuild
        if (!isUpToDate) {
           setTimeout(() => {
             logger.info('Starting docker rebuild in background...');
             exec('docker compose build --no-cache && docker compose up -d', { cwd: targetPath }, (err: any, out: string, errOut: string) => {
               if (err) logger.error('Docker rebuild failed', err);
               else logger.info('Docker rebuild success', out);
             });
           }, 2000);
           
           return {
             ok: true,
             message: 'Cập nhật thành công. Đang xây dựng lại (build) ở chế độ nền, hệ thống sẽ tự động khởi động lại sau khoảng 1-2 phút.',
             needsRestart: true,
           };
        }

        return {
          ok: true,
          message: 'Hệ thống đã ở phiên bản mới nhất.',
          needsRestart: false,
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
