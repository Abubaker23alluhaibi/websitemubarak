export type UserRole = 'super_admin' | 'admin' | 'staff' | 'exchange_agent' | 'customer';

export type AppPageKey =
  | 'dashboard'
  | 'customers'
  | 'cars'
  | 'containers'
  | 'invoices'
  | 'exchange'
  | 'logistics'
  | 'calculator'
  | 'users';

export interface UserPermissions {
  allowedPages?: AppPageKey[];
  canAddCars?: boolean;
  canEditCars?: boolean;
  canDeleteCars?: boolean;
  canCreateInvoices?: boolean;
  canEditInvoices?: boolean;
  canDeleteInvoices?: boolean;
  canLockUnlockInvoices?: boolean;
  canManageContainers?: boolean;
  canManageExchange?: boolean;
  canManageCustomers?: boolean;
  canManageLogistics?: boolean;
  canManageStaff?: boolean;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  actionTitle: string;
  entityType: 'car' | 'invoice' | 'container' | 'transfer' | 'exchange_office' | 'customer' | 'logistics' | 'user' | 'settings';
  entityId?: string;
  details?: string;
  timestamp: string;
}

export interface User {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  temporaryPassword?: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
  exchangeOfficeId?: string;
  createdAt: string;
  permissions?: UserPermissions;
}

export type CarStatus = 
  | 'purchased'      // تم الشراء من المزاد
  | 'towing'         // قيد النقل الداخلي الأمريكي
  | 'at_port'        // في ميناء التحميل
  | 'shipped'        // في عرض البحر داخل الحاوية
  | 'arrived'        // وصلت ميناء الوصول (أم قصر/العقبة...)
  | 'delivered';     // تم التسليم للزبون

export interface ExtraCostItem {
  id?: string;
  name: string;
  amount: number;
}

export interface USState {
  id: string;
  code: string;
  name: string;
  defaultLoadingPortId: string;
  inlandCost: number;
  towingCostAvg?: number;
  extraCosts?: ExtraCostItem[];
}

export interface Port {
  id: string;
  name: string;
  code: string;
  country: string;
  type: 'loading' | 'destination';
  defaultOceanCost?: number;
  clearanceCost?: number;
  extraCosts?: ExtraCostItem[];
}

export interface ShippingRoute {
  id: string;
  loadingPortId: string;
  destinationPortId: string;
  oceanFreightCost: number;
  estimatedDays: number;
  extraCosts?: ExtraCostItem[];
}

export interface CarMessage {
  id: string;
  carId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'staff' | 'super_admin';
  message: string;
  createdAt: string;
}

export interface Car {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  lotNumber: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  auctionName: 'Copart' | 'IAAI' | 'Manheim' | 'Other';
  auctionUrl?: string;
  purchaseDate: string;
  purchasePrice: number;
  auctionPaymentSource?: 'through_us' | 'external'; // 'through_us' = عن طريقنا, 'external' = مسدد من مكتب خارجي
  externalPaymentDetails?: string; // بيان الجهة الخارجية
  city?: string; // مدينة وموقع المزاد بأمريكا
  usStateId: string;
  usStateName: string;
  loadingPortName: string;
  destinationPortName: string;
  containerId?: string;
  containerNumber?: string;
  status: CarStatus;
  notes?: string;
  messages?: CarMessage[];
}

export interface InvoiceCustomField {
  id: string;
  fieldName: string;
  fieldAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  carId: string;
  car?: Car;
  auctionPaymentSource?: 'through_us' | 'external';
  externalPaymentDetails?: string;
  shippingCost: number;
  commissionPercent: number;
  commissionAmount: number;
  subtotal: number;
  discount: number;
  discountReason?: string;
  netTotal: number;
  paidAmount: number;
  remainingAmount: number;
  isLocked: boolean;
  lockedAt?: string;
  customFields: InvoiceCustomField[];
  createdAt: string;
}

export interface Container {
  id: string;
  containerNumber: string;
  bookingNumber?: string;
  trackingUrl?: string;
  shippingLine: string;
  loadingPort: string;
  destinationPort: string;
  departureDate?: string;
  estimatedArrival?: string;
  capacity: number;
  status: 'loading' | 'on_sea' | 'arrived' | 'cleared';
  carIds: string[];
  cars?: Car[];
}

export interface ExchangeOffice {
  id: string;
  name: string;
  city: string;
  contactPerson: string;
  phone: string;
  balanceUsd: number; // موجب = بذمة الصيرفة لنا / سالب = مستحقات للصيرفة
  notes?: string;
}

export type TransferPurpose = 'car_purchase' | 'shipping_cost' | 'combined' | 'customs_clearance' | 'other';
export type TransferDirection = 'inbound' | 'outbound' | 'exchange_transfer';
export type CommissionType = 'for_us' | 'on_us'; // 'for_us' = لنا (إيراد لشركتنا), 'on_us' = علينا (تأخذها الصيرفة / كلفة)

export interface MoneyTransfer {
  id: string;
  transferNumber: string;
  customerId?: string;
  customerName?: string;
  exchangeOfficeId?: string;
  exchangeOfficeName?: string;
  carId?: string;
  carLot?: string;
  purpose: TransferPurpose | string;
  customPurpose?: string;
  direction: TransferDirection;
  originalAmount: number;
  currency: 'USD' | 'IQD' | 'EUR';
  exchangeRate: number;
  amountUsd: number;
  location?: string;
  receivedAt: string;
  notes?: string;
  isAiAction?: boolean;

  // عمولة اختيارية (لنا أو علينا للصيرفة)
  hasCommission?: boolean;
  commissionType?: CommissionType;
  commissionAmount?: number;
  commissionCurrency?: 'USD' | 'IQD';
  commissionRate?: number;
  commissionAmountUsd?: number;
  netOfficeAmountUsd?: number; // المبلغ الصافي المؤثر في رصيد الصيرفة بعد احتساب العمولة
}
