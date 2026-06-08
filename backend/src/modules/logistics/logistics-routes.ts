import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from '../auth/auth-middleware.js';
import { logger } from '../../shared/utils/logger.js';
import { ViettelPostAdapter, CarrierConfig } from './carrier-adapter.js';
import { viettelPostWebhookHandler } from './webhook-handler.js';

export async function logisticsRoutes(app: FastifyInstance): Promise<void> {
  // Webhook endpoint: Publicly accessible, no JWT auth
  app.post('/api/v1/logistics/webhook/viettelpost/:orgId', viettelPostWebhookHandler);

  // Authenticated routes group
  app.register(async (authApp) => {
    authApp.addHook('preHandler', authMiddleware);

    // ── Carrier Integrations ──────────────────────────────────────────────────

    authApp.get('/api/v1/logistics/carriers', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const carriers = await prisma.carrierIntegration.findMany({
          where: { orgId },
          orderBy: { carrierCode: 'asc' },
        });
        return { carriers };
      } catch (err: any) {
        logger.error('[logistics-api] GET /carriers error:', err);
        return reply.status(500).send({ error: 'Failed to fetch carriers' });
      }
    });

    authApp.post('/api/v1/logistics/carriers', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const body = request.body as any;

        if (!body.carrierCode || !body.carrierName) {
          return reply.status(400).send({ error: 'carrierCode and carrierName are required' });
        }

        const carrier = await prisma.carrierIntegration.upsert({
          where: {
            orgId_carrierCode: {
              orgId,
              carrierCode: body.carrierCode,
            },
          },
          create: {
            orgId,
            carrierCode: body.carrierCode,
            carrierName: body.carrierName,
            configData: body.configData || {},
            isActive: body.isActive !== undefined ? body.isActive : true,
          },
          update: {
            carrierName: body.carrierName,
            configData: body.configData || {},
            isActive: body.isActive !== undefined ? body.isActive : true,
          },
        });

        return carrier;
      } catch (err: any) {
        logger.error('[logistics-api] POST /carriers error:', err);
        return reply.status(500).send({ error: 'Failed to save carrier configuration' });
      }
    });

    // ── Fee Calculation ───────────────────────────────────────────────────────

    authApp.post('/api/v1/logistics/calculate-fee', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const body = request.body as any;

        if (!body.receiverProvince || !body.receiverDistrict || !body.receiverWard) {
          return reply.status(400).send({ error: 'receiverProvince, receiverDistrict, and receiverWard are required' });
        }

        const carrier = await prisma.carrierIntegration.findFirst({
          where: { orgId, carrierCode: 'viettelpost', isActive: true },
        });

        const config: CarrierConfig = (carrier?.configData as any) || {
          apiUrl: 'https://partner.viettelpost.vn/v2/order',
          testMode: true,
        };

        const adapter = new ViettelPostAdapter();
        const result = await adapter.calculateFee(
          {
            receiverProvince: body.receiverProvince,
            receiverDistrict: body.receiverDistrict,
            receiverWard: body.receiverWard,
            weightGrams: body.weightGrams || 500,
            codAmount: body.codAmount || 0,
          },
          config
        );

        return result;
      } catch (err: any) {
        logger.error('[logistics-api] POST /calculate-fee error:', err);
        return reply.status(500).send({ error: 'Failed to calculate shipping fee' });
      }
    });

    // ── Orders (OMS Helpers) ──────────────────────────────────────────────────

    authApp.post('/api/v1/logistics/orders', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId, id: userId } = request.user!;
        const body = request.body as any;

        if (!body.customerId || !body.shippingAddressJson || !body.items || body.items.length === 0) {
          return reply.status(400).send({ error: 'customerId, shippingAddressJson, and items are required' });
        }

        // Generate a simple order code: ORD-YYYYMMDD-Random
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderCode = `ORD-${dateStr}-${randomNum}`;

        const subtotal = body.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
        const total = subtotal + (body.shippingFee || 0) - (body.discountAmount || 0);

        const order = await prisma.order.create({
          data: {
            orgId,
            orderCode,
            customerId: body.customerId,
            creatorId: userId,
            status: 'PENDING',
            subtotalAmount: subtotal,
            discountAmount: body.discountAmount || 0,
            shippingFee: body.shippingFee || 0,
            totalAmount: total,
            codAmount: body.codAmount !== undefined ? body.codAmount : total,
            shippingAddressJson: body.shippingAddressJson,
            notes: body.notes || '',
            items: {
              create: body.items.map((item: any) => ({
                productName: item.productName,
                productId: item.productId || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              })),
            },
          },
          include: { items: true },
        });

        return reply.status(201).send(order);
      } catch (err: any) {
        logger.error('[logistics-api] POST /orders error:', err);
        return reply.status(500).send({ error: 'Failed to create order' });
      }
    });

    authApp.get('/api/v1/logistics/orders', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const orders = await prisma.order.findMany({
          where: { orgId },
          include: { customer: true, shipment: true, items: true },
          orderBy: { createdAt: 'desc' },
        });
        return { orders };
      } catch (err: any) {
        logger.error('[logistics-api] GET /orders error:', err);
        return reply.status(500).send({ error: 'Failed to fetch orders' });
      }
    });

    // ── Shipments (Logistics) ─────────────────────────────────────────────────

    authApp.post('/api/v1/logistics/shipments', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const body = request.body as any;

        if (!body.orderId) {
          return reply.status(400).send({ error: 'orderId is required' });
        }

        // 1. Fetch order and check if shipment already exists
        const order = await prisma.order.findFirst({
          where: { id: body.orderId, orgId },
          include: { items: true, shipment: true },
        });

        if (!order) {
          return reply.status(404).send({ error: 'Order not found' });
        }

        if (order.shipment) {
          return reply.status(400).send({ error: 'Shipment already exists for this order' });
        }

        // 2. Fetch carrier config
        const carrier = await prisma.carrierIntegration.findFirst({
          where: { orgId, carrierCode: 'viettelpost', isActive: true },
        });

        const config: CarrierConfig = (carrier?.configData as any) || {
          apiUrl: 'https://partner.viettelpost.vn/v2/order',
          testMode: true,
        };

        const adapter = new ViettelPostAdapter();
        logger.info(`[logistics-api] Creating waybill for order ${order.orderCode} with carrier config...`);

        // Call adapter to create waybill
        const result = await adapter.createShipment(order, config);

        // 3. Handle result using P0 (Option B: Async retry fallback on failure/timeout)
        let shipmentStatus = 'PICKUP_PENDING';
        let trackingNumber = result.trackingNumber || null;
        let estimatedDelivery = result.estimatedDeliveryAt || null;
        let labelPdfUrl = result.labelPdfUrl || null;
        let note = 'Tạo vận đơn thành công qua API.';

        if (!result.success) {
          // Failure/Timeout -> save as PENDING_WAYBILL and trigger background retry loop
          shipmentStatus = 'PENDING_WAYBILL';
          note = `Tạo vận đơn thất bại/timeout: ${result.error || 'API timeout'}. Đơn được xếp vào hàng chờ thử lại.`;
          logger.warn(`[logistics-api] Waybill creation failed for ${order.orderCode}. Saving as PENDING_WAYBILL for async retry.`);
        }

        const shipment = await prisma.$transaction(async (tx) => {
          // Create shipment record
          const ship = await tx.shipment.create({
            data: {
              orderId: order.id,
              carrierId: carrier?.id || null,
              trackingNumber,
              status: shipmentStatus,
              weightGrams: body.weightGrams || 500,
              codAmount: order.codAmount,
              shippingFeeCharged: order.shippingFee,
              labelPdfUrl,
              estimatedDelivery,
            },
          });

          // Update Order Status
          await tx.order.update({
            where: { id: order.id },
            data: { status: shipmentStatus === 'PENDING_WAYBILL' ? 'PENDING' : 'PROCESSING' },
          });

          // Create status history log
          await tx.shipmentStatusHistory.create({
            data: {
              shipmentId: ship.id,
              fromStatus: 'NONE',
              toStatus: shipmentStatus,
              notes: note,
            },
          });

          // Create tracking activity log
          await tx.shipmentTrackingLog.create({
            data: {
              shipmentId: ship.id,
              activity: shipmentStatus === 'PENDING_WAYBILL' ? 'Chờ tạo vận đơn ngầm.' : 'Vận đơn được tạo thành công.',
              occurredAt: new Date(),
            },
          });

          return ship;
        });

        return reply.status(201).send({
          success: true,
          shipment,
          message: shipmentStatus === 'PENDING_WAYBILL'
            ? 'Cổng vận chuyển đang bận hoặc gặp sự cố. Đơn hàng được lưu dưới trạng thái Chờ Tạo Vận Đơn và sẽ tự động thử lại sau 5 phút.'
            : 'Tạo vận đơn thành công.',
        });
      } catch (err: any) {
        logger.error('[logistics-api] POST /shipments error:', err);
        return reply.status(500).send({ error: 'Failed to create shipment' });
      }
    });

    authApp.get('/api/v1/logistics/shipments', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const shipments = await prisma.shipment.findMany({
          where: {
            order: { orgId },
          },
          include: {
            order: {
              include: { customer: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return { shipments };
      } catch (err: any) {
        logger.error('[logistics-api] GET /shipments error:', err);
        return reply.status(500).send({ error: 'Failed to fetch shipments' });
      }
    });

    authApp.get('/api/v1/logistics/shipments/:id', async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { orgId } = request.user!;
        const { id } = request.params as { id: string };

        const shipment = await prisma.shipment.findFirst({
          where: {
            id,
            order: { orgId },
          },
          include: {
            order: {
              include: { customer: true, items: true },
            },
            statusHistory: { orderBy: { createdAt: 'desc' } },
            trackingLogs: { orderBy: { occurredAt: 'desc' } },
          },
        });

        if (!shipment) {
          return reply.status(404).send({ error: 'Shipment not found' });
        }

        return shipment;
      } catch (err: any) {
        logger.error('[logistics-api] GET /shipments/:id error:', err);
        return reply.status(500).send({ error: 'Failed to fetch shipment details' });
      }
    });
  });
}
