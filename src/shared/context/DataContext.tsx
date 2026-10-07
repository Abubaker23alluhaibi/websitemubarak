import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Car,
  MoneyTransfer,
  Invoice,
  ExchangeOffice,
  Container,
  Port,
  USState,
  ShippingRoute,
  CarMessage,
  AuditLogEntry,
} from '../../types';
import {
  MOCK_USERS,
  MOCK_CARS,
  MOCK_TRANSFERS,
  MOCK_INVOICES,
  MOCK_EXCHANGE_OFFICES,
  MOCK_CONTAINERS,
  MOCK_PORTS,
  MOCK_STATES,
  MOCK_ROUTES,
  MOCK_AUDIT_LOGS,
} from '../lib/mockData';
import {
  carsApi,
  invoicesApi,
  transfersApi,
  exchangeApi,
  containersApi,
  usersApi,
  logisticsApi,
} from '../api';

interface DataContextType {
  users: User[];
  cars: Car[];
  transfers: MoneyTransfer[];
  invoices: Invoice[];
  exchangeOffices: ExchangeOffice[];
  containers: Container[];
  ports: Port[];
  states: USState[];
  routes: ShippingRoute[];

  // Users & Customers Actions
  registerCustomer: (customerData: {
    fullName: string;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
  }) => Promise<User>;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  // Cars Actions
  addCar: (carData: Partial<Car>, newCustomer?: User) => Car;
  updateCar: (car: Car) => void;
  deleteCar: (carId: string) => void;
  sendCarMessage: (
    carId: string,
    messageText: string,
    sender: { id: string; fullName: string; role: any }
  ) => void;

  // Invoices Actions
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (invoiceId: string) => void;

  // Containers Actions
  addContainer: (container: Container) => void;
  updateContainer: (container: Container) => void;
  deleteContainer: (containerId: string) => void;

  // Exchange Offices Actions
  addExchangeOffice: (office: ExchangeOffice) => void;
  updateExchangeOffice: (office: ExchangeOffice) => void;
  deleteExchangeOffice: (officeId: string) => void;

  // Money Transfers Actions
  addTransfer: (transferData: Partial<MoneyTransfer>) => MoneyTransfer;
  updateTransfer: (transfer: MoneyTransfer) => void;
  deleteTransfer: (transferId: string) => void;

  // Logistics Actions (Ports, States, Routes)
  addPort: (port: Port) => Promise<Port>;
  updatePort: (port: Port) => Promise<void>;
  deletePort: (portId: string) => Promise<void>;
  addState: (state: USState) => Promise<USState>;
  updateState: (state: USState) => Promise<void>;
  deleteState: (stateId: string) => Promise<void>;
  addRoute: (route: ShippingRoute) => Promise<ShippingRoute>;
  updateRoute: (route: ShippingRoute) => Promise<void>;
  deleteRoute: (routeId: string) => Promise<void>;
  // General Settings
  defaultCommissionRate: number;
  updateDefaultCommissionRate: (rate: number) => void;

  // Audit Logs & Activity
  auditLogs: AuditLogEntry[];
  logActivity: (entry: {
    action: string;
    actionTitle: string;
    entityType: AuditLogEntry['entityType'];
    entityId?: string;
    details?: string;
    user?: User;
  }) => void;
  getUserAuditLogs: (userId: string) => AuditLogEntry[];

  resetToDefaults: () => void;
  isOnlineServer: boolean;
  refreshFromBackend: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'carship_data_users',
  CARS: 'carship_data_cars',
  TRANSFERS: 'carship_data_transfers',
  INVOICES: 'carship_data_invoices',
  EXCHANGE_OFFICES: 'carship_data_exchange_offices',
  CONTAINERS: 'carship_data_containers',
  PORTS: 'carship_data_ports',
  STATES: 'carship_data_states',
  ROUTES: 'carship_data_routes',
  COMMISSION_RATE: 'carship_data_commission_rate',
  AUDIT_LOGS: 'carship_data_audit_logs',
};

const getStoredData = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const isUuid = (str?: string): boolean =>
  Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() =>
    getStoredData(STORAGE_KEYS.USERS, MOCK_USERS)
  );
  const [cars, setCars] = useState<Car[]>(() =>
    getStoredData(STORAGE_KEYS.CARS, MOCK_CARS)
  );
  const [transfers, setTransfers] = useState<MoneyTransfer[]>(() =>
    getStoredData(STORAGE_KEYS.TRANSFERS, MOCK_TRANSFERS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    getStoredData(STORAGE_KEYS.INVOICES, MOCK_INVOICES)
  );
  const [exchangeOffices, setExchangeOffices] = useState<ExchangeOffice[]>(() =>
    getStoredData(STORAGE_KEYS.EXCHANGE_OFFICES, MOCK_EXCHANGE_OFFICES)
  );
  const [containers, setContainers] = useState<Container[]>(() =>
    getStoredData(STORAGE_KEYS.CONTAINERS, MOCK_CONTAINERS)
  );
  const [ports, setPorts] = useState<Port[]>(() =>
    getStoredData(STORAGE_KEYS.PORTS, MOCK_PORTS)
  );
  const [states, setStates] = useState<USState[]>(() =>
    getStoredData(STORAGE_KEYS.STATES, MOCK_STATES)
  );
  const [routes, setRoutes] = useState<ShippingRoute[]>(() =>
    getStoredData(STORAGE_KEYS.ROUTES, MOCK_ROUTES)
  );
  const [defaultCommissionRate, setDefaultCommissionRate] = useState<number>(() =>
    getStoredData(STORAGE_KEYS.COMMISSION_RATE, 1.5)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    getStoredData(STORAGE_KEYS.AUDIT_LOGS, MOCK_AUDIT_LOGS)
  );

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
  }, [cars]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXCHANGE_OFFICES, JSON.stringify(exchangeOffices));
  }, [exchangeOffices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONTAINERS, JSON.stringify(containers));
  }, [containers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PORTS, JSON.stringify(ports));
  }, [ports]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(states));
  }, [states]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROUTES, JSON.stringify(routes));
  }, [routes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMISSION_RATE, JSON.stringify(defaultCommissionRate));
  }, [defaultCommissionRate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const [isOnlineServer, setIsOnlineServer] = useState<boolean>(false);

  const refreshFromBackend = async () => {
    try {
      const token = localStorage.getItem('carship_token');
      const [portsRes, statesRes, routesRes] = await Promise.all([
        logisticsApi.getPorts().catch(() => null),
        logisticsApi.getStates().catch(() => null),
        logisticsApi.getRoutes().catch(() => null),
      ]);

      let connected = false;
      if (portsRes && Array.isArray(portsRes) && portsRes.length > 0) {
        setPorts(portsRes);
        connected = true;
      }
      if (statesRes && Array.isArray(statesRes) && statesRes.length > 0) {
        setStates(statesRes);
        connected = true;
      }
      if (routesRes && Array.isArray(routesRes) && routesRes.length > 0) {
        setRoutes(routesRes);
        connected = true;
      }

      if (token) {
        const [carsRes, invRes, transRes, offRes, contRes, usersRes] = await Promise.all([
          carsApi.getAll({ limit: 100 }).catch(() => null),
          invoicesApi.getAll({ limit: 100 }).catch(() => null),
          transfersApi.getAll({ limit: 100 }).catch(() => null),
          exchangeApi.getOffices().catch(() => null),
          containersApi.getAll().catch(() => null),
          usersApi.getAll({ limit: 100 }).catch(() => null),
        ]);

        const rawCars = Array.isArray(carsRes) ? carsRes : (carsRes?.cars && Array.isArray(carsRes.cars) ? carsRes.cars : null);
        if (rawCars && rawCars.length > 0) {
          setCars(rawCars);
          connected = true;
        }

        const rawInvoices = Array.isArray(invRes) ? invRes : (invRes?.invoices && Array.isArray(invRes.invoices) ? invRes.invoices : null);
        if (rawInvoices && rawInvoices.length > 0) {
          setInvoices(rawInvoices);
          connected = true;
        }

        const rawTransfers = Array.isArray(transRes) ? transRes : (transRes?.transfers && Array.isArray(transRes.transfers) ? transRes.transfers : null);
        if (rawTransfers && rawTransfers.length > 0) {
          setTransfers(rawTransfers);
          connected = true;
        }

        if (offRes && Array.isArray(offRes) && offRes.length > 0) {
          setExchangeOffices(offRes);
          connected = true;
        }

        if (contRes && Array.isArray(contRes) && contRes.length > 0) {
          setContainers(contRes);
          connected = true;
        }

        const rawUsers = Array.isArray(usersRes) ? usersRes : (usersRes?.users && Array.isArray(usersRes.users) ? usersRes.users : null);
        if (rawUsers && rawUsers.length > 0) {
          setUsers(rawUsers);
          connected = true;
        }
      }

      setIsOnlineServer(connected);
    } catch {
      setIsOnlineServer(false);
    }
  };

  useEffect(() => {
    refreshFromBackend();

    const handleAuthChange = () => {
      refreshFromBackend();
    };

    window.addEventListener('carship_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('carship_auth_change', handleAuthChange);
    };
  }, []);

  const updateDefaultCommissionRate = (rate: number) => {
    setDefaultCommissionRate(rate);
    logActivity({
      action: 'UPDATE_SETTINGS',
      actionTitle: 'تعديل نسبة عمولة التحويل العامة المعتمدة',
      entityType: 'settings',
      details: `تم تعديل نسبة عمولة التحويل لسيارات المزاد إلى ${rate}%.`,
    });
  };

  const getCurrentActor = (): User => {
    try {
      const saved = localStorage.getItem('carship_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return users[0];
  };

  const logActivity = (entry: {
    action: string;
    actionTitle: string;
    entityType: AuditLogEntry['entityType'];
    entityId?: string;
    details?: string;
    user?: User;
  }) => {
    const actor = entry.user || getCurrentActor();
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId: actor.id,
      userName: actor.fullName,
      userRole: actor.role,
      action: entry.action,
      actionTitle: entry.actionTitle,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const getUserAuditLogs = (userId: string) => {
    return auditLogs.filter((log) => log.userId === userId);
  };

  // Actions
  const registerCustomer = async (data: {
    fullName: string;
    username: string;
    password?: string;
    phone?: string;
    email?: string;
  }): Promise<User> => {
    const cleanUsername = data.username.trim().toLowerCase();
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (existing) {
      throw new Error('اسم المستخدم مستخدم مسبقاً، يرجى اختيار اسم آخر');
    }

    const newCust: User = {
      id: `cust-${Date.now()}`,
      fullName: data.fullName.trim(),
      username: cleanUsername,
      email: data.email?.trim() || `${cleanUsername}@customer.carship`,
      phone: data.phone?.trim() || '+964 770 000 0000',
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const addUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    const pass = newUser.password || (newUser as any).temporaryPassword || (newUser.role === 'customer' ? '123456' : 'Staff@2026!');
    usersApi.create({
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      password: pass,
    }).then((created) => {
      if (created && created.id) {
        setUsers((prev) => prev.map((u) => (u.id === newUser.id ? { ...u, id: created.id } : u)));
      }
    }).catch((err) => {
      console.warn('Backend user creation error:', err);
    });

    logActivity({
      action: 'CREATE_USER',
      actionTitle: `إضافة مستخدم / موظف: ${newUser.fullName}`,
      entityType: 'user',
      entityId: newUser.id,
      details: `الدور: ${newUser.role} - اسم المستخدم: @${newUser.username}`,
    });
  };

  const updateUser = (updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    const payload: any = {
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    };
    if ((updatedUser as any).password) {
      payload.password = (updatedUser as any).password;
    }
    usersApi.update(updatedUser.id, payload).catch((err) => {
      console.warn('Backend user update error:', err);
    });

    // If customer name changed, update cars with their name as well
    setCars((prevCars) =>
      prevCars.map((c) =>
        c.customerId === updatedUser.id
          ? { ...c, customerName: updatedUser.fullName, customerPhone: updatedUser.phone || c.customerPhone }
          : c
      )
    );
    logActivity({
      action: 'UPDATE_USER',
      actionTitle: `تعديل بيانات وحساب: ${updatedUser.fullName}`,
      entityType: 'user',
      entityId: updatedUser.id,
      details: `الدور: ${updatedUser.role} - الحالة: ${
        updatedUser.isActive ? 'نشط' : 'معطل'
      } - عدد الصفحات المصرح بها: ${
        updatedUser.permissions?.allowedPages?.length !== undefined
          ? `${updatedUser.permissions.allowedPages.length} صفحات`
          : 'كافة الصفحات'
      }.`,
    });
  };

  const deleteUser = (userId: string) => {
    usersApi.delete(userId).catch(() => {});
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logActivity({
      action: 'DELETE_USER',
      actionTitle: `حذف حساب: ${target?.fullName || userId}`,
      entityType: 'user',
      entityId: userId,
      details: `تم حذف الحساب نهائياً من قائمة المستخدمين.`,
    });
  };

  const addCar = (carData: Partial<Car>, newCustomer?: User): Car => {
    if (newCustomer) {
      addUser(newCustomer);
    }

    const isExternalPayment = carData.auctionPaymentSource === 'external';

    const createdCar: Car = {
      id: `car-${Date.now()}`,
      customerId: carData.customerId || (newCustomer ? newCustomer.id : 'user-5'),
      customerName: carData.customerName || (newCustomer ? newCustomer.fullName : 'عميل مسجل'),
      customerPhone: carData.customerPhone || (newCustomer ? newCustomer.phone : ''),
      lotNumber: carData.lotNumber || '00000000',
      vin: carData.vin || `VIN${Date.now()}`,
      make: carData.make || 'Toyota',
      model: carData.model || 'Camry',
      year: carData.year || new Date().getFullYear(),
      auctionName: carData.auctionName || 'Copart',
      auctionUrl: carData.auctionUrl,
      purchaseDate: carData.purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: Number(carData.purchasePrice) || 0,
      auctionPaymentSource: carData.auctionPaymentSource || 'through_us',
      externalPaymentDetails: carData.externalPaymentDetails,
      city: carData.city,
      usStateId: carData.usStateId || 'st-ga',
      usStateName: carData.usStateName || 'Georgia (GA)',
      loadingPortName: carData.loadingPortName || 'Savannah Port (GA)',
      destinationPortName: carData.destinationPortName || 'ميناء أم قصر (العراق)',
      status: carData.status || 'purchased',
      notes: carData.notes,
    };

    setCars((prev) => [createdCar, ...prev]);

    // Automatically generate draft invoice for this car
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const shipping = 1850;
    
    // إذا كان مسدد من مكتب خارجي: عمولة التحويل على ثمن السيارة = 0، والمطلوب لشركتنا هو الشحن فقط
    const commPercent = isExternalPayment ? 0 : defaultCommissionRate;
    const commission = isExternalPayment ? 0 : Math.round(createdCar.purchasePrice * (commPercent / 100));
    
    // Subtotal: إذا كان مسدداً عن طريقنا = سعر الشراء + الشحن + العمولة / إذا مسدد خارجي = الشحن فقط
    const subtotal = isExternalPayment 
      ? shipping + commission 
      : createdCar.purchasePrice + shipping + commission;

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      carId: createdCar.id,
      car: createdCar,
      auctionPaymentSource: createdCar.auctionPaymentSource,
      externalPaymentDetails: createdCar.externalPaymentDetails,
      shippingCost: shipping,
      commissionPercent: commPercent,
      commissionAmount: commission,
      subtotal,
      discount: 0,
      netTotal: subtotal,
      paidAmount: 0,
      remainingAmount: subtotal,
      isLocked: false,
      customFields: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInvoices((prev) => [newInv, ...prev]);

    logActivity({
      action: 'CREATE_CAR',
      actionTitle: `إضافة سيارة جديدة: ${createdCar.year} ${createdCar.make} ${createdCar.model}`,
      entityType: 'car',
      entityId: createdCar.id,
      details: `رقم اللوت: ${createdCar.lotNumber} | الشاصي: ${createdCar.vin} | العميل: ${createdCar.customerName} | سعر الشراء: $${createdCar.purchasePrice} (${createdCar.auctionPaymentSource === 'external' ? 'مسدد خارجياً' : 'عن طريقنا'}).`,
    });

    // Persist to live backend if connected
    const saveCarToBackend = async (targetCustomerId: string) => {
      try {
        let validCustomerId = targetCustomerId;
        if (newCustomer) {
          try {
            const createdCust = await usersApi.create({
              fullName: newCustomer.fullName,
              username: newCustomer.username,
              role: 'customer',
              password: 'Customer@2026!',
              phone: newCustomer.phone,
              email: newCustomer.email,
            });
            if (createdCust && isUuid(createdCust.id)) {
              validCustomerId = createdCust.id;
            }
          } catch (custErr) {
            console.warn('Backend user creation in saveCarToBackend failed:', custErr);
          }
        }

        if (!isUuid(validCustomerId)) {
          const matchByName = users.find((u) => isUuid(u.id) && u.fullName === createdCar.customerName);
          if (matchByName) {
            validCustomerId = matchByName.id;
          } else if (targetCustomerId === 'user-5' || createdCar.customerName?.includes('عمر')) {
            validCustomerId = 'bf58e18b-c3b8-44f0-988f-80da5057ddd7';
          } else {
            const liveCustomer = users.find((u) => u.role === 'customer' && isUuid(u.id));
            if (liveCustomer) validCustomerId = liveCustomer.id;
          }
        }

        const cleanLot = String(createdCar.lotNumber || '').replace(/[^A-Za-z0-9]/g, '') || `LOT${Date.now()}`;
        let cleanVin = String(createdCar.vin || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (cleanVin.length < 11) {
          cleanVin = (cleanVin + '00000000000000000').slice(0, 17);
        }

        const payload: any = {
          customerId: validCustomerId,
          lotNumber: cleanLot,
          vin: cleanVin,
          make: createdCar.make || 'Toyota',
          model: createdCar.model || 'Camry',
          year: Number(createdCar.year) || new Date().getFullYear(),
          auctionName: createdCar.auctionName || 'Copart',
          auctionUrl: createdCar.auctionUrl || undefined,
          purchasePrice: Number(createdCar.purchasePrice) || 0,
          city: createdCar.city || undefined,
          destinationPortName: createdCar.destinationPortName || undefined,
          status: createdCar.status || 'purchased',
          notes: createdCar.notes || undefined,
          auctionPaymentSource: createdCar.auctionPaymentSource || 'through_us',
          externalPaymentDetails: createdCar.externalPaymentDetails || undefined,
        };

        if (isUuid(createdCar.usStateId)) {
          payload.usStateId = createdCar.usStateId;
        } else if (states.length > 0) {
          const matchState = states.find(
            (s) => s.id === createdCar.usStateId || s.code === createdCar.usStateId || s.name === createdCar.usStateName
          );
          if (matchState && isUuid(matchState.id)) {
            payload.usStateId = matchState.id;
          }
        }

        const savedCar = await carsApi.create(payload);
        if (savedCar && savedCar.id) {
          setCars((prev) => prev.map((c) => (c.id === createdCar.id ? { ...c, ...savedCar, id: savedCar.id } : c)));
          // Link draft invoice to real car ID and create in backend
          setInvoices((prev) =>
            prev.map((inv) =>
              inv.carId === createdCar.id
                ? {
                    ...inv,
                    carId: savedCar.id,
                    car: inv.car ? { ...inv.car, ...savedCar, id: savedCar.id } : undefined,
                  }
                : inv
            )
          );
          try {
            const savedInv = await invoicesApi.create({
              carId: savedCar.id,
              shippingCost: shipping,
              commissionPercent: commPercent,
              auctionPaymentSource: createdCar.auctionPaymentSource || 'through_us',
              externalPaymentDetails: createdCar.externalPaymentDetails || undefined,
            });
            if (savedInv && savedInv.id) {
              setInvoices((prev) =>
                prev.map((inv) => (inv.carId === savedCar.id ? { ...inv, ...savedInv, id: savedInv.id } : inv))
              );
            }
          } catch (invErr) {
            console.warn('Backend auto-invoice creation failed:', invErr);
          }
        }
      } catch (err) {
        console.warn('Backend car creation failed:', err);
      }
    };

    if (newCustomer) {
      usersApi.create({
        fullName: newCustomer.fullName,
        username: newCustomer.username,
        email: newCustomer.email,
        phone: newCustomer.phone,
        role: 'customer',
        password: 'Customer@2026!',
      }).then((savedUser) => {
        const realUserId = savedUser?.id;
        if (realUserId) {
          setUsers((prev) => prev.map((u) => (u.id === newCustomer.id ? { ...u, id: realUserId } : u)));
          setCars((prev) => prev.map((c) => (c.id === createdCar.id ? { ...c, customerId: realUserId } : c)));
          saveCarToBackend(realUserId);
        } else {
          saveCarToBackend(createdCar.customerId);
        }
      }).catch(() => {
        saveCarToBackend(createdCar.customerId);
      });
    } else {
      saveCarToBackend(createdCar.customerId);
    }

    return createdCar;
  };

  const updateCar = (updated: Car) => {
    setCars((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (isUuid(updated.id)) {
      const payload: any = {
        make: updated.make,
        model: updated.model,
        year: Number(updated.year),
        lotNumber: updated.lotNumber,
        vin: updated.vin,
        auctionName: updated.auctionName,
        auctionUrl: updated.auctionUrl || undefined,
        purchasePrice: Number(updated.purchasePrice) || 0,
        city: updated.city || undefined,
        destinationPortName: updated.destinationPortName || undefined,
        notes: updated.notes || undefined,
        auctionPaymentSource: updated.auctionPaymentSource,
        externalPaymentDetails: updated.externalPaymentDetails || undefined,
        status: updated.status,
        containerId: isUuid(updated.containerId) ? updated.containerId : undefined,
      };
      if (isUuid(updated.usStateId)) {
        payload.usStateId = updated.usStateId;
      } else if (states.length > 0) {
        const matchState = states.find(
          (s) => s.id === updated.usStateId || s.code === updated.usStateId || s.name === updated.usStateName
        );
        if (matchState && isUuid(matchState.id)) {
          payload.usStateId = matchState.id;
        }
      }
      carsApi.update(updated.id, payload).catch((err) => {
        console.warn('Backend car update failed:', err);
      });
    }
    // Also update invoice's nested car object if exists
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.carId === updated.id
          ? {
              ...inv,
              car: updated,
            }
          : inv
      )
    );
    logActivity({
      action: 'UPDATE_CAR',
      actionTitle: `تعديل سيارة: ${updated.year} ${updated.make} ${updated.model}`,
      entityType: 'car',
      entityId: updated.id,
      details: `الحالة: ${updated.status} | اللوت: ${updated.lotNumber} | مسار الشحن: ${updated.loadingPortName} إلى ${updated.destinationPortName}.`,
    });
  };

  const deleteCar = (carId: string) => {
    if (isUuid(carId)) {
      const linkedInv = invoices.find((inv) => inv.carId === carId);
      if (linkedInv && isUuid(linkedInv.id)) {
        invoicesApi
          .delete(linkedInv.id)
          .catch(() => {})
          .finally(() => {
            carsApi.delete(carId).catch(() => {});
          });
      } else {
        carsApi.delete(carId).catch(() => {});
      }
    }
    const target = cars.find((c) => c.id === carId);
    // 1. Remove the car
    setCars((prev) => prev.filter((c) => c.id !== carId));
    // 2. Cascade delete invoices linked to this car
    setInvoices((prev) => prev.filter((inv) => inv.carId !== carId));
    // 3. Unlink car from any container
    setContainers((prev) =>
      prev.map((cont) => ({
        ...cont,
        carIds: cont.carIds.filter((id) => id !== carId),
      }))
    );
    logActivity({
      action: 'DELETE_CAR',
      actionTitle: `حذف سيارة: ${target ? `${target.year} ${target.make} ${target.model} (Lot: ${target.lotNumber})` : carId}`,
      entityType: 'car',
      entityId: carId,
      details: `تم حذف السيارة وفك ارتباطها بالفاتورة والحاوية.`,
    });
  };

  const sendCarMessage = (
    carId: string,
    messageText: string,
    sender: { id: string; fullName: string; role: any }
  ) => {
    const newMsg: CarMessage = {
      id: `msg-${Date.now()}`,
      carId,
      senderId: sender.id,
      senderName: sender.fullName,
      senderRole: sender.role,
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    setCars((prevCars) =>
      prevCars.map((c) => {
        if (c.id === carId) {
          const currentMsgs = c.messages || [];
          return {
            ...c,
            messages: [...currentMsgs, newMsg],
          };
        }
        return c;
      })
    );

    // Persist to backend database so it syncs with customer mobile app
    carsApi.sendMessage(carId, messageText.trim()).then((savedMsg) => {
      if (savedMsg && savedMsg.id) {
        setCars((prevCars) =>
          prevCars.map((c) => {
            if (c.id === carId) {
              return {
                ...c,
                messages: (c.messages || []).map((m) => (m.id === newMsg.id ? savedMsg : m)),
              };
            }
            return c;
          })
        );
      }
    }).catch((err) => {
      console.warn('Failed to persist car message to backend:', err);
    });

    logActivity({
      action: 'SEND_CAR_MESSAGE',
      actionTitle: `إرسال رسالة بخصوص سيارة`,
      entityType: 'car',
      entityId: carId,
      details: `المرسل: ${sender.fullName} - نص الرسالة: "${messageText.slice(0, 70)}${messageText.length > 70 ? '...' : ''}"`,
    });
  };

  const addTransfer = (transferData: Partial<MoneyTransfer>): MoneyTransfer => {
    const created: MoneyTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber:
        transferData.transferNumber || `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: transferData.customerId,
      customerName: transferData.customerName || 'عميل',
      exchangeOfficeId: transferData.exchangeOfficeId,
      exchangeOfficeName: transferData.exchangeOfficeName,
      carLot: transferData.carLot,
      purpose: transferData.purpose || 'car_purchase',
      customPurpose: transferData.customPurpose,
      direction: transferData.direction || 'inbound',
      originalAmount: transferData.originalAmount || 0,
      currency: transferData.currency || 'USD',
      exchangeRate: transferData.exchangeRate || 1,
      amountUsd: transferData.amountUsd || 0,
      location: transferData.location || 'بغداد',
      receivedAt: transferData.receivedAt || new Date().toISOString().split('T')[0],
      notes: transferData.notes,
      isAiAction: transferData.isAiAction || false,
      hasCommission: transferData.hasCommission || false,
      commissionType: transferData.commissionType,
      commissionAmount: transferData.commissionAmount,
      commissionCurrency: transferData.commissionCurrency,
      commissionRate: transferData.commissionRate,
      commissionAmountUsd: transferData.commissionAmountUsd,
      netOfficeAmountUsd: transferData.netOfficeAmountUsd,
    };

    setTransfers((prev) => [created, ...prev]);

    logActivity({
      action: 'CREATE_TRANSFER',
      actionTitle: `تسجيل قيد حركة مالية: $${created.amountUsd}`,
      entityType: 'transfer',
      entityId: created.id,
      details: `الصيرفة: ${created.exchangeOfficeName || 'مكتب صرافة'} | النوع: ${
        created.direction === 'inbound' ? 'قبض / إيداع' : 'صرف / سحب'
      } | الغرض: ${created.purpose}${created.carLot ? ` | لوت: ${created.carLot}` : ''}.`,
    });

    // If inbound payment from customer for a car lot, automatically credit corresponding invoice
    if (created.direction === 'inbound' && created.carLot) {
      setInvoices((prevInvoices) =>
        prevInvoices.map((inv) => {
          const matchingCar = cars.find((c) => c.id === inv.carId);
          if (matchingCar && matchingCar.lotNumber === created.carLot) {
            const newPaid = Number(inv.paidAmount || 0) + Number(created.amountUsd || 0);
            const newRemaining = Math.max(0, Number(inv.netTotal || 0) - newPaid);
            return {
              ...inv,
              paidAmount: newPaid,
              remainingAmount: newRemaining,
            };
          }
          return inv;
        })
      );
    }

    // Persist transfer to live backend
    const transferPayload: any = {
      purpose: created.purpose,
      customPurpose: created.customPurpose || undefined,
      direction: created.direction,
      originalAmount: Math.max(1, Number(created.originalAmount) || Number(created.amountUsd) || 1),
      currency: created.currency || 'USD',
      exchangeRate: Number(created.exchangeRate) || 1.0,
      location: created.location || undefined,
      receivedAt: created.receivedAt,
      notes: created.notes || undefined,
      hasCommission: Boolean(created.hasCommission),
      commissionType: created.commissionType || undefined,
      commissionAmount: created.commissionAmount ? Number(created.commissionAmount) : undefined,
      commissionCurrency: created.commissionCurrency || undefined,
      commissionRate: created.commissionRate ? Number(created.commissionRate) : undefined,
    };

    if (isUuid(created.exchangeOfficeId)) {
      transferPayload.exchangeOfficeId = created.exchangeOfficeId;
    } else if (exchangeOffices.length > 0) {
      const matchOffice = exchangeOffices.find(
        (o) => o.id === created.exchangeOfficeId || o.name === created.exchangeOfficeName
      );
      if (matchOffice && isUuid(matchOffice.id)) {
        transferPayload.exchangeOfficeId = matchOffice.id;
      }
    }

    if (isUuid(created.customerId)) {
      transferPayload.customerId = created.customerId;
    } else {
      const matchCust = users.find(
        (u) =>
          (isUuid(u.id) && (u.id === created.customerId || u.fullName === created.customerName)) ||
          (created.customerId === 'user-5' && (u.username === 'omar.customer' || u.fullName.includes('عمر')))
      );
      if (matchCust && isUuid(matchCust.id)) {
        transferPayload.customerId = matchCust.id;
      } else if (created.customerId === 'user-5' || created.customerName?.includes('عمر')) {
        transferPayload.customerId = 'bf58e18b-c3b8-44f0-988f-80da5057ddd7';
      }
    }

    if (isUuid(created.carId)) {
      transferPayload.carId = created.carId;
    } else if (cars.length > 0) {
      const matchCar = cars.find(
        (c) => c.id === created.carId || (created.carLot && c.lotNumber === created.carLot)
      );
      if (matchCar && isUuid(matchCar.id)) {
        transferPayload.carId = matchCar.id;
        if (!transferPayload.customerId && isUuid(matchCar.customerId)) {
          transferPayload.customerId = matchCar.customerId;
        }
      }
    }

    if (created.carLot) {
      transferPayload.carLot = created.carLot;
    }

    transfersApi.create(transferPayload).then((savedTr) => {
      if (savedTr && savedTr.id) {
        setTransfers((prev) => prev.map((t) => (t.id === created.id ? { ...t, ...savedTr, id: savedTr.id } : t)));
      }
    }).catch((err) => {
      console.warn('Backend transfer creation failed:', err);
    });

    return created;
  };

  const updateTransfer = (transfer: MoneyTransfer) => {
    setTransfers((prev) => prev.map((t) => (t.id === transfer.id ? transfer : t)));
    if (isUuid(transfer.id)) {
      transfersApi.update(transfer.id, transfer).catch(() => {});
    }
    logActivity({
      action: 'UPDATE_TRANSFER',
      actionTitle: `تعديل قيد مالي رقم ${transfer.transferNumber}`,
      entityType: 'transfer',
      entityId: transfer.id,
      details: `المبلغ المعدل: $${transfer.amountUsd} | الصيرفة: ${transfer.exchangeOfficeName}.`,
    });
  };

  const deleteTransfer = (transferId: string) => {
    if (isUuid(transferId)) {
      transfersApi.delete(transferId).catch(() => {});
    }
    const target = transfers.find((t) => t.id === transferId);
    setTransfers((prev) => prev.filter((t) => t.id !== transferId));
    logActivity({
      action: 'DELETE_TRANSFER',
      actionTitle: `حذف قيد مالي بمبلغ $${target?.amountUsd || ''}`,
      entityType: 'transfer',
      entityId: transferId,
      details: `تم حذف القيد المالي (${target?.transferNumber || transferId}).`,
    });
  };

  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => [invoice, ...prev]);

    let targetCarId = invoice.carId;
    if (!isUuid(targetCarId) && cars.length > 0) {
      const matchCar = cars.find((c) => c.id === invoice.carId || (invoice.car && c.lotNumber === invoice.car.lotNumber));
      if (matchCar && isUuid(matchCar.id)) {
        targetCarId = matchCar.id;
      }
    }

    if (isUuid(targetCarId)) {
      invoicesApi.create({
        carId: targetCarId,
        shippingCost: Number(invoice.shippingCost) || 0,
        commissionPercent: Number(invoice.commissionPercent) || 0,
        discount: Number(invoice.discount) || 0,
        discountReason: invoice.discountReason || undefined,
        auctionPaymentSource: invoice.auctionPaymentSource || 'through_us',
        externalPaymentDetails: invoice.externalPaymentDetails || undefined,
        customFields: (invoice.customFields || []).map((f) => ({
          fieldName: f.fieldName,
          fieldAmount: Number(f.fieldAmount) || 0,
        })),
      }).then((savedInv) => {
        if (savedInv && savedInv.id) {
          setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? { ...inv, ...savedInv, id: savedInv.id } : inv)));
        }
      }).catch((err) => {
        console.warn('Live invoice creation failed:', err);
      });
    }

    logActivity({
      action: 'CREATE_INVOICE',
      actionTitle: `إصدار فاتورة جديدة: ${invoice.invoiceNumber}`,
      entityType: 'invoice',
      entityId: invoice.id,
      details: `المجموع الصافي: $${invoice.netTotal} | المدفوع: $${invoice.paidAmount} | المتبقي: $${invoice.remainingAmount}.`,
    });
  };

  const updateInvoice = (invoice: Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? invoice : inv)));
    if (isUuid(invoice.id)) {
      invoicesApi.update(invoice.id, {
        shippingCost: Number(invoice.shippingCost) || 0,
        commissionPercent: Number(invoice.commissionPercent) || 0,
        discount: Number(invoice.discount) || 0,
        discountReason: invoice.discountReason || undefined,
        auctionPaymentSource: invoice.auctionPaymentSource || 'through_us',
        externalPaymentDetails: invoice.externalPaymentDetails || undefined,
      }).catch((err) => {
        console.warn('Backend invoice update failed:', err);
      });
    }
    logActivity({
      action: 'UPDATE_INVOICE',
      actionTitle: `تعديل فاتورة: ${invoice.invoiceNumber}`,
      entityType: 'invoice',
      entityId: invoice.id,
      details: `حالة القفل: ${invoice.isLocked ? 'مقفلة مالياً' : 'مفتوحة'} | الصافي: $${
        invoice.netTotal
      } | الخصم: $${invoice.discount || 0}.`,
    });
  };

  const deleteInvoice = (invoiceId: string) => {
    if (isUuid(invoiceId)) {
      invoicesApi.delete(invoiceId).catch(() => {});
    }
    const target = invoices.find((inv) => inv.id === invoiceId);
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    logActivity({
      action: 'DELETE_INVOICE',
      actionTitle: `حذف فاتورة: ${target?.invoiceNumber || invoiceId}`,
      entityType: 'invoice',
      entityId: invoiceId,
      details: `تم حذف الفاتورة المالية نهائياً من النظام.`,
    });
  };

  const addContainer = (container: Container) => {
    setContainers((prev) => [container, ...prev]);

    containersApi.create({
      containerNumber: container.containerNumber,
      bookingNumber: container.bookingNumber || undefined,
      trackingUrl: container.trackingUrl || undefined,
      shippingLine: container.shippingLine || undefined,
      loadingPort: container.loadingPort || undefined,
      destinationPort: container.destinationPort || undefined,
      departureDate: container.departureDate || undefined,
      estimatedArrival: container.estimatedArrival || undefined,
      capacity: Number(container.capacity) || 4,
      status: container.status || 'loading',
    }).then(async (savedCont) => {
      if (savedCont && savedCont.id) {
        setContainers((prev) => prev.map((c) => (c.id === container.id ? { ...c, ...savedCont, id: savedCont.id } : c)));
        const validCarIds = (container.carIds || []).filter(isUuid);
        if (validCarIds.length > 0) {
          await containersApi.assignCars(savedCont.id, validCarIds).catch(() => {});
        }
      }
    }).catch((err) => {
      console.warn('Live container creation error:', err);
    });
    // Link container info to contained cars
    if (container.carIds && container.carIds.length > 0) {
      setCars((prevCars) =>
        prevCars.map((c) =>
          container.carIds.includes(c.id)
            ? { ...c, containerId: container.id, containerNumber: container.containerNumber }
            : c
        )
      );
    }
    logActivity({
      action: 'CREATE_CONTAINER',
      actionTitle: `إنشاء حاوية جديدة: ${container.containerNumber}`,
      entityType: 'container',
      entityId: container.id,
      details: `خط الملاحة: ${container.shippingLine} | السعة: ${container.capacity} سيارات.`,
    });
  };

  const updateContainer = (container: Container) => {
    setContainers((prev) => prev.map((c) => (c.id === container.id ? container : c)));
    containersApi.update(container.id, container).catch(() => {});
    // Sync cars container link
    setCars((prevCars) =>
      prevCars.map((c) => {
        if (container.carIds.includes(c.id)) {
          return { ...c, containerId: container.id, containerNumber: container.containerNumber };
        } else if (c.containerId === container.id) {
          // unlinked
          return { ...c, containerId: undefined, containerNumber: undefined };
        }
        return c;
      })
    );
    logActivity({
      action: 'UPDATE_CONTAINER',
      actionTitle: `تعديل حاوية: ${container.containerNumber}`,
      entityType: 'container',
      entityId: container.id,
      details: `الحالة: ${container.status} | عدد السيارات المحملة: ${container.carIds.length}.`,
    });
  };

  const deleteContainer = (containerId: string) => {
    containersApi.delete(containerId).catch(() => {});
    const target = containers.find((c) => c.id === containerId);
    setContainers((prev) => prev.filter((c) => c.id !== containerId));
    // Unlink cars from this container
    setCars((prevCars) =>
      prevCars.map((c) =>
        c.containerId === containerId
          ? { ...c, containerId: undefined, containerNumber: undefined }
          : c
      )
    );
    logActivity({
      action: 'DELETE_CONTAINER',
      actionTitle: `حذف الحاوية: ${target?.containerNumber || containerId}`,
      entityType: 'container',
      entityId: containerId,
      details: `تم حذف الحاوية وفك ارتباط السيارات المحملة بها.`,
    });
  };

  const addExchangeOffice = (office: ExchangeOffice) => {
    setExchangeOffices((prev) => [office, ...prev]);
    exchangeApi.createOffice(office).catch(() => {});
  };

  const updateExchangeOffice = (office: ExchangeOffice) => {
    setExchangeOffices((prev) => prev.map((o) => (o.id === office.id ? office : o)));
    exchangeApi.updateOffice(office.id, office).catch(() => {});
    // Also update office name in transfers
    setTransfers((prev) =>
      prev.map((t) =>
        t.exchangeOfficeId === office.id
          ? { ...t, exchangeOfficeName: office.name }
          : t
      )
    );
  };

  const deleteExchangeOffice = (officeId: string) => {
    setExchangeOffices((prev) => prev.filter((o) => o.id !== officeId));
    exchangeApi.deleteOffice(officeId).catch(() => {});
  };

  // Logistics Actions
  const addPort = async (port: Port): Promise<Port> => {
    setPorts((prev) => [port, ...prev]);
    try {
      const saved = await logisticsApi.createPort({
        name: port.name,
        code: port.code,
        country: port.country,
        type: port.type,
        defaultOceanCost: port.defaultOceanCost,
        clearanceCost: port.clearanceCost,
        extraCosts: port.extraCosts || [],
      });
      if (saved && saved.id) {
        setPorts((prev) => prev.map((p) => (p.id === port.id ? { ...p, ...saved } : p)));
        // Auto-refresh routes since backend auto-provisioned shipping routes for this port
        logisticsApi.getRoutes().then((rts) => {
          if (Array.isArray(rts) && rts.length > 0) setRoutes(rts);
        }).catch(() => {});
        return { ...port, ...saved };
      }
    } catch (err) {
      console.warn('Backend createPort failed:', err);
    }
    return port;
  };

  const updatePort = async (port: Port): Promise<void> => {
    setPorts((prev) => prev.map((p) => (p.id === port.id ? port : p)));
    try {
      const saved = await logisticsApi.updatePort(port.id, {
        name: port.name,
        code: port.code,
        country: port.country,
        type: port.type,
        defaultOceanCost: port.defaultOceanCost,
        clearanceCost: port.clearanceCost,
        extraCosts: port.extraCosts,
      });
      if (saved) {
        setPorts((prev) => prev.map((p) => (p.id === port.id ? { ...p, ...saved } : p)));
        logisticsApi.getRoutes().then((rts) => {
          if (Array.isArray(rts) && rts.length > 0) setRoutes(rts);
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Backend updatePort failed:', err);
    }
  };

  const deletePort = async (portId: string): Promise<void> => {
    setPorts((prev) => prev.filter((p) => p.id !== portId));
    setRoutes((prev) => prev.filter((r) => r.loadingPortId !== portId && r.destinationPortId !== portId));
    try {
      await logisticsApi.deletePort(portId);
    } catch (err) {
      console.warn('Backend deletePort failed:', err);
    }
  };

  const addState = async (state: USState): Promise<USState> => {
    setStates((prev) => [state, ...prev]);
    try {
      let targetPortId = state.defaultLoadingPortId;
      if (!isUuid(targetPortId)) {
        const matched = ports.find((p) => p.id === targetPortId || p.type === 'loading');
        if (matched && isUuid(matched.id)) {
          targetPortId = matched.id;
        }
      }

      const saved = await logisticsApi.createState({
        code: state.code.toUpperCase(),
        name: state.name,
        defaultLoadingPortId: targetPortId,
        inlandCost: Number(state.inlandCost),
        extraCosts: state.extraCosts || [],
      });
      if (saved && saved.id) {
        setStates((prev) => prev.map((s) => (s.id === state.id ? { ...s, ...saved } : s)));
        return { ...state, ...saved };
      }
    } catch (err) {
      console.warn('Backend createState failed:', err);
    }
    return state;
  };

  const updateState = async (state: USState): Promise<void> => {
    setStates((prev) => prev.map((s) => (s.id === state.id ? state : s)));
    try {
      const saved = await logisticsApi.updateState(state.id, {
        name: state.name,
        code: state.code,
        inlandCost: Number(state.inlandCost),
        defaultLoadingPortId: state.defaultLoadingPortId,
        extraCosts: state.extraCosts,
      });
      if (saved) {
        setStates((prev) => prev.map((s) => (s.id === state.id ? { ...s, ...saved } : s)));
      }
    } catch (err) {
      console.warn('Backend updateState failed:', err);
    }
  };

  const deleteState = async (stateId: string): Promise<void> => {
    setStates((prev) => prev.filter((s) => s.id !== stateId));
    try {
      await logisticsApi.deleteState(stateId);
    } catch (err) {
      console.warn('Backend deleteState failed:', err);
    }
  };

  const addRoute = async (route: ShippingRoute): Promise<ShippingRoute> => {
    setRoutes((prev) => [route, ...prev]);
    try {
      const saved = await logisticsApi.createRoute({
        loadingPortId: route.loadingPortId,
        destinationPortId: route.destinationPortId,
        oceanFreightCost: Number(route.oceanFreightCost),
        estimatedDays: Number(route.estimatedDays) || 25,
        extraCosts: route.extraCosts || [],
      });
      if (saved && saved.id) {
        setRoutes((prev) => prev.map((r) => (r.id === route.id ? { ...r, ...saved } : r)));
        return { ...route, ...saved };
      }
    } catch (err) {
      console.warn('Backend createRoute failed:', err);
    }
    return route;
  };

  const updateRoute = async (route: ShippingRoute): Promise<void> => {
    setRoutes((prev) => prev.map((r) => (r.id === route.id ? route : r)));
    try {
      const saved = await logisticsApi.updateRoute(route.id, {
        oceanFreightCost: Number(route.oceanFreightCost),
        estimatedDays: Number(route.estimatedDays),
        extraCosts: route.extraCosts,
      });
      if (saved) {
        setRoutes((prev) => prev.map((r) => (r.id === route.id ? { ...r, ...saved } : r)));
      }
    } catch (err) {
      console.warn('Backend updateRoute failed:', err);
    }
  };

  const deleteRoute = async (routeId: string): Promise<void> => {
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    try {
      await logisticsApi.deleteRoute(routeId);
    } catch (err) {
      console.warn('Backend deleteRoute failed:', err);
    }
  };

  const resetToDefaults = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CARS);
    localStorage.removeItem(STORAGE_KEYS.TRANSFERS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.EXCHANGE_OFFICES);
    localStorage.removeItem(STORAGE_KEYS.CONTAINERS);
    localStorage.removeItem(STORAGE_KEYS.PORTS);
    localStorage.removeItem(STORAGE_KEYS.STATES);
    localStorage.removeItem(STORAGE_KEYS.ROUTES);

    setUsers(MOCK_USERS);
    setCars(MOCK_CARS);
    setTransfers(MOCK_TRANSFERS);
    setInvoices(MOCK_INVOICES);
    setExchangeOffices(MOCK_EXCHANGE_OFFICES);
    setContainers(MOCK_CONTAINERS);
    setPorts(MOCK_PORTS);
    setStates(MOCK_STATES);
    setRoutes(MOCK_ROUTES);
  };

  return (
    <DataContext.Provider
      value={{
        users,
        cars,
        transfers,
        invoices,
        exchangeOffices,
        containers,
        ports,
        states,
        routes,
        registerCustomer,
        addUser,
        updateUser,
        deleteUser,
        addCar,
        updateCar,
        deleteCar,
        sendCarMessage,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addContainer,
        updateContainer,
        deleteContainer,
        addExchangeOffice,
        updateExchangeOffice,
        deleteExchangeOffice,
        addTransfer,
        updateTransfer,
        deleteTransfer,
        addPort,
        updatePort,
        deletePort,
        addState,
        updateState,
        deleteState,
        addRoute,
        updateRoute,
        deleteRoute,
        defaultCommissionRate,
        updateDefaultCommissionRate,
        auditLogs,
        logActivity,
        getUserAuditLogs,
        resetToDefaults,
        isOnlineServer,
        refreshFromBackend,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
