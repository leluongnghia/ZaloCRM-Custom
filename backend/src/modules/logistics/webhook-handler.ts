import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';

// Map Viettel Post status codes to CRM shipment status
// Codes based on Viettel Post documentation:
// 100: Chờ duyệt, 101: Chờ gom, 102: Đang gom, 103: Gom thành công (PICKED_UP)
// 104: Đang trung chuyển, 200: Nhận tại bưu cục (IN_TRANSIT)
// 501: Đang phát (DELIVERING)
// 505: Phát thành công (DELIVERED)
// 507: Giao không thành công (FAILED)
// 508: Chuyển hoàn (RETURNING)
// 509: Nhận chuyển hoàn (RETURNED)
function mapVtpStatus(vtpStatus: number | string): string {
  const code = Number(vtpStatus);
  if (code >= 100 && code <= 102) return 'PICKUP_PENDING';
  if (code === 103) return 'PICKED_UP';
  if (code === 104 || code === 200) return 'IN_TRANSIT';
  if (code === 501) return 'DELIVERING';
  if (code === 505) return 'DELIVERED';
  if (code === 507) return 'FAILED';
  if (code === 508) return 'RETURNING';
  if (code === 509) return 'RETURNED';
  return 'IN_TRANSIT'; // Default fallback
}

export async function viettelPostWebhookHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { orgId } = request.params as { orgId: string };
    const secretHeader = request.headers['x-viettel-secret'] as string;

    if (!orgId) {
      return reply.status(400).send({ error: 'orgId parameter is required' });
    }

    // Fetch the carrier configuration to check the secret key
    const carrier = await prisma.carrierIntegration.findFirst({
      where: { orgId, carrierCode: 'viettelpost', isActive: true },
    });

    if (!carrier) {
      logger.warn(`[vtp-webhook] Carrier configuration not found for org: ${orgId}`);
      return reply.status(404).send({ error: 'Carrier integration not found or inactive' });
    }

    const config = carrier.configData as any;
    const configuredSecret = config?.webhookSecret;

    // Validate webhook signature / secret token (Option B)
    if (configuredSecret && secretHeader !== configuredSecret) {
      logger.warn(`[vtp-webhook] Unauthorized webhook payload for org: ${orgId}. Secret token mismatch.`);
      return reply.status(401).send({ error: 'Unauthorized. Secret token mismatch.' });
    }

    const payload = request.body as any;
    logger.info(`[vtp-webhook] Received status update for org ${orgId}:`, JSON.stringify(payload));

    // Expected fields from Viettel Post callback payload:
    // ORDER_NUMBER: Tracking number
    // ORDER_STATUS: Status code (e.g. 505)
    // STATUS_NAME: Text description of the status
    // LOCATE_STATION: Bưu cục cập nhật
    const trackingNumber = payload.ORDER_NUMBER || payload.order_number;
    const orderStatus = payload.ORDER_STATUS || payload.status;
    const statusName = payload.STATUS_NAME || payload.status_name || 'Cập nhật trạng thái';
    const location = payload.LOCATE_STATION || payload.location || '';

    if (!trackingNumber || orderStatus === undefined) {
      return reply.status(400).send({ error: 'Missing ORDER_NUMBER or ORDER_STATUS in payload' });
    }

    // Find shipment and associated order
    const shipment = await prisma.shipment.findFirst({
      where: { trackingNumber },
      include: { order: true },
    });

    if (!shipment) {
      logger.warn(`[vtp-webhook] Shipment with tracking number ${trackingNumber} not found.`);
      return reply.status(404).send({ error: `Shipment not found: ${trackingNumber}` });
    }

    // Map and update status
    const fromStatus = shipment.status;
    const toStatus = mapVtpStatus(orderStatus);

    await prisma.$transaction(async (tx) => {
      // 1. Update shipment details
      await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: toStatus,
          updatedAt: new Date(),
        },
      });

      // 2. Map shipment status to Order status if needed
      let orderStatusUpdate: string | null = null;
      if (toStatus === 'DELIVERED') {
        orderStatusUpdate = 'COMPLETED';
      } else if (toStatus === 'RETURNED') {
        orderStatusUpdate = 'RETURNED';
      } else if (toStatus === 'IN_TRANSIT' || toStatus === 'DELIVERING' || toStatus === 'PICKED_UP') {
        orderStatusUpdate = 'SHIPPED';
      }

      if (orderStatusUpdate) {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: orderStatusUpdate },
        });
      }

      // 3. Save to Shipment status history
      await tx.shipmentStatusHistory.create({
        data: {
          shipmentId: shipment.id,
          fromStatus,
          toStatus,
          notes: `Cập nhật webhook: ${statusName} (${orderStatus}) tại ${location}`,
        },
      });

      // 4. Save to Shipment tracking logs
      await tx.shipmentTrackingLog.create({
        data: {
          shipmentId: shipment.id,
          location,
          activity: statusName,
          occurredAt: new Date(),
        },
      });
    });

    logger.info(`[vtp-webhook] Successfully synchronized shipment ${trackingNumber}: ${fromStatus} -> ${toStatus}`);
    return { success: true };
  } catch (err: any) {
    logger.error('[vtp-webhook] Webhook execution error:', err.message);
    return reply.status(500).send({ error: 'Internal server error' });
  }
}
