import cron from 'node-cron';
import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { ViettelPostAdapter, CarrierConfig } from './carrier-adapter.js';

export function startLogisticsCron(): void {
  // Run every 5 minutes to retry pending waybill creations
  cron.schedule('*/5 * * * *', async () => {
    logger.info('[logistics-cron] Scanning for PENDING_WAYBILL shipments...');
    try {
      const pendingShipments = await prisma.shipment.findMany({
        where: { status: 'PENDING_WAYBILL' },
        include: {
          order: {
            include: {
              items: true,
              org: true,
            },
          },
        },
      });

      if (pendingShipments.length === 0) {
        logger.debug('[logistics-cron] No pending waybill shipments found.');
        return;
      }

      logger.info(`[logistics-cron] Found ${pendingShipments.length} pending shipment(s) to process.`);
      const adapter = new ViettelPostAdapter();

      for (const shipment of pendingShipments) {
        try {
          const orgId = shipment.order.orgId;

          // Fetch the carrier integration configuration
          const carrier = await prisma.carrierIntegration.findFirst({
            where: { orgId, carrierCode: 'viettelpost', isActive: true },
          });

          // Even if no config, we simulate if in test/mock mode
          const config: CarrierConfig = (carrier?.configData as any) || {
            apiUrl: 'https://partner.viettelpost.vn/v2/order',
            testMode: true,
          };

          logger.info(`[logistics-cron] Retrying shipment creation for order ${shipment.order.orderCode}...`);
          const result = await adapter.createShipment(shipment.order, config);

          if (result.success && result.trackingNumber) {
            // Update Shipment & Order in database
            await prisma.$transaction(async (tx) => {
              await tx.shipment.update({
                where: { id: shipment.id },
                data: {
                  status: 'PICKUP_PENDING',
                  trackingNumber: result.trackingNumber,
                  estimatedDelivery: result.estimatedDeliveryAt,
                  labelPdfUrl: result.labelPdfUrl,
                },
              });

              await tx.order.update({
                where: { id: shipment.orderId },
                data: { status: 'PROCESSING' },
              });

              await tx.shipmentStatusHistory.create({
                data: {
                  shipmentId: shipment.id,
                  fromStatus: 'PENDING_WAYBILL',
                  toStatus: 'PICKUP_PENDING',
                  notes: 'Tạo vận đơn tự động qua Cron Job thành công.',
                },
              });

              await tx.shipmentTrackingLog.create({
                data: {
                  shipmentId: shipment.id,
                  activity: 'Đã tạo vận đơn tự động thành công.',
                  occurredAt: new Date(),
                },
              });
            });

            logger.info(`[logistics-cron] Successfully retried and created waybill for order ${shipment.order.orderCode}: ${result.trackingNumber}`);
          } else {
            logger.warn(`[logistics-cron] Failed to create waybill for order ${shipment.order.orderCode}: ${result.error || 'Unknown error'}`);
          }
        } catch (shipmentErr: any) {
          logger.error(`[logistics-cron] Error processing shipment ${shipment.id}:`, shipmentErr.message);
        }
      }
    } catch (err: any) {
      logger.error('[logistics-cron] Global logistics cron job error:', err.message);
    }
  });

  logger.info('[logistics-cron] Logistics retry cron job started (every 5 min)');
}
