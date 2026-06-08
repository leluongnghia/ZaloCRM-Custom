import { logger } from '../../shared/utils/logger.js';

export interface ShipmentResult {
  success: boolean;
  trackingNumber?: string;
  estimatedDeliveryAt?: Date;
  labelPdfUrl?: string;
  error?: string;
}

export interface FeeParams {
  senderProvinceId?: number;
  senderDistrictId?: number;
  receiverProvince: string;
  receiverDistrict: string;
  receiverWard: string;
  weightGrams: number;
  codAmount: number;
}

export interface FeeResult {
  success: boolean;
  serviceName: string;
  shippingFee: number;
  estimatedDeliveryDays: number;
  error?: string;
}

export interface TrackingDetail {
  location?: string;
  activity: string;
  occurredAt: Date;
}

export interface CarrierConfig {
  apiUrl: string;
  token?: string;
  username?: string;
  password?: string;
  warehouseId?: number;
  testMode?: boolean;
}

export interface CarrierInterface {
  createShipment(order: any, config: CarrierConfig): Promise<ShipmentResult>;
  cancelShipment(trackingNumber: string, config: CarrierConfig): Promise<boolean>;
  getTracking(trackingNumber: string, config: CarrierConfig): Promise<TrackingDetail[]>;
  calculateFee(params: FeeParams, config: CarrierConfig): Promise<FeeResult>;
}

export class ViettelPostAdapter implements CarrierInterface {
  private isMock(config: CarrierConfig): boolean {
    return !!(config.testMode || !config.token);
  }

  async calculateFee(params: FeeParams, config: CarrierConfig): Promise<FeeResult> {
    if (this.isMock(config)) {
      // Simulate price calculations
      const distanceMultiplier = params.receiverProvince.includes('Hồ Chí Minh') ? 1.5 : 1.0;
      const baseFee = 22000;
      const weightFee = Math.ceil(params.weightGrams / 500) * 5000;
      const codFee = params.codAmount > 1000000 ? params.codAmount * 0.01 : 0;
      const finalFee = Math.round((baseFee + weightFee + codFee) * distanceMultiplier);

      return {
        success: true,
        serviceName: 'Viettel Post Chuyển phát nhanh (Mock)',
        shippingFee: finalFee,
        estimatedDeliveryDays: distanceMultiplier > 1.2 ? 3 : 2,
      };
    }

    try {
      const response = await fetch(`${config.apiUrl}/getPrice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': config.token || '',
        },
        body: JSON.stringify({
          SENDER_PROVINCE: config.warehouseId || 1, // simplified sender ref
          RECEIVER_PROVINCE: params.receiverProvince,
          RECEIVER_DISTRICT: params.receiverDistrict,
          PRODUCT_WEIGHT: params.weightGrams,
          PRODUCT_TYPE: 'HH',
          MONEY_COLLECT: params.codAmount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Viettel Post API error: HTTP status ${response.status}`);
      }

      const resData = (await response.json()) as any;
      if (resData.status !== 200 && resData.error) {
        return {
          success: false,
          serviceName: 'Viettel Post',
          shippingFee: 0,
          estimatedDeliveryDays: 0,
          error: resData.message || 'API error',
        };
      }

      return {
        success: true,
        serviceName: resData.data?.serviceName || 'Viettel Post Chuyển phát nhanh',
        shippingFee: resData.data?.MONEY_TOTAL || 35000,
        estimatedDeliveryDays: resData.data?.TIME_DELIVERY || 2,
      };
    } catch (err: any) {
      logger.error('[ViettelPostAdapter] calculateFee error:', err.message);
      return {
        success: false,
        serviceName: 'Viettel Post',
        shippingFee: 0,
        estimatedDeliveryDays: 0,
        error: err.message || 'Network error',
      };
    }
  }

  async createShipment(order: any, config: CarrierConfig): Promise<ShipmentResult> {
    if (this.isMock(config)) {
      // Simulate API delay and success/failure randomly if required, but default to success
      await new Promise((resolve) => setTimeout(resolve, 800));

      const trackingNumber = `VTP${Math.floor(100000000 + Math.random() * 900000000)}`;
      const estimatedDeliveryAt = new Date();
      estimatedDeliveryAt.setDate(estimatedDeliveryAt.getDate() + 2);

      return {
        success: true,
        trackingNumber,
        estimatedDeliveryAt,
        labelPdfUrl: `https://mock.viettelpost.vn/labels/print?code=${trackingNumber}`,
      };
    }

    try {
      const response = await fetch(`${config.apiUrl}/createOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': config.token || '',
        },
        body: JSON.stringify({
          ORDER_NUMBER: order.orderCode,
          SENDER_FULLNAME: 'ZaloCRM Warehouse',
          RECEIVER_FULLNAME: order.shippingAddressJson?.name,
          RECEIVER_PHONE: order.shippingAddressJson?.phone,
          RECEIVER_ADDRESS: `${order.shippingAddressJson?.addressDetail}, ${order.shippingAddressJson?.ward}, ${order.shippingAddressJson?.district}, ${order.shippingAddressJson?.province}`,
          PRODUCT_NAME: order.items?.[0]?.productName || 'Sản phẩm CRM',
          PRODUCT_WEIGHT: order.shipment?.weightGrams || 500,
          MONEY_COLLECT: Number(order.codAmount),
          ORDER_NOTE: order.notes || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Viettel Post API error: HTTP status ${response.status}`);
      }

      const resData = (await response.json()) as any;
      if (resData.status !== 200 || !resData.data?.ORDER_NUMBER) {
        return {
          success: false,
          error: resData.message || 'Viettel Post API failed to create order',
        };
      }

      const trackingNumber = resData.data.ORDER_NUMBER;
      const estimatedDeliveryAt = new Date();
      estimatedDeliveryAt.setDate(estimatedDeliveryAt.getDate() + (resData.data.ESTIMATED_DAYS || 2));

      return {
        success: true,
        trackingNumber,
        estimatedDeliveryAt,
        labelPdfUrl: `https://partner.viettelpost.vn/v2/order/print?code=${trackingNumber}`,
      };
    } catch (err: any) {
      logger.error('[ViettelPostAdapter] createShipment error:', err.message);
      return {
        success: false,
        error: err.message || 'API Timeout/Network error',
      };
    }
  }

  async cancelShipment(trackingNumber: string, config: CarrierConfig): Promise<boolean> {
    if (this.isMock(config)) {
      return true;
    }

    try {
      const response = await fetch(`${config.apiUrl}/cancelOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': config.token || '',
        },
        body: JSON.stringify({
          ORDER_NUMBER: trackingNumber,
        }),
      });

      if (!response.ok) return false;
      const resData = (await response.json()) as any;
      return resData.status === 200;
    } catch (err: any) {
      logger.error('[ViettelPostAdapter] cancelShipment error:', err.message);
      return false;
    }
  }

  async getTracking(trackingNumber: string, config: CarrierConfig): Promise<TrackingDetail[]> {
    if (this.isMock(config)) {
      return [
        { occurredAt: new Date(Date.now() - 3600000 * 4), activity: 'Đã nhận đơn hàng tại điểm giao dịch' },
        { occurredAt: new Date(Date.now() - 3600000 * 2), activity: 'Vận đơn đang được trung chuyển' },
        { occurredAt: new Date(), activity: 'Đang giao hàng cho người nhận' },
      ];
    }

    try {
      const response = await fetch(`${config.apiUrl}/tracking?code=${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Token': config.token || '',
        },
      });

      if (!response.ok) return [];
      const resData = (await response.json()) as any;
      if (resData.status !== 200 || !Array.isArray(resData.data)) return [];

      return resData.data.map((item: any) => ({
        location: item.LOCATION,
        activity: item.STATUS_NAME || 'Cập nhật hành trình',
        occurredAt: new Date(item.UPDATE_TIME),
      }));
    } catch (err: any) {
      logger.error('[ViettelPostAdapter] getTracking error:', err.message);
      return [];
    }
  }
}
