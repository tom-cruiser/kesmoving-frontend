// ─── User & Auth ──────────────────────────────────────────────────────────────
export type Role =
  | 'Admin'
  | 'OperationsManager'
  | 'CustomerService'
  | 'Sales'
  | 'Driver'
  | 'Mover'
  | 'WarehouseWorker'
  | 'Packer'
  | 'QualityAssurance'
  | 'ITSupport'
  | 'Marketing'
  | 'Client';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  avatar?: string;
  address?: Address;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  lastLogin?: string;
  createdAt: string;
}

export interface AuthState {
  token: string;
  refreshToken: string;
  user: User;
}

// ─── Address ──────────────────────────────────────────────────────────────────
export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
}

// ─── Booking ──────────────────────────────────────────────────────────────────
export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'Charged' | 'Paid';

export type MoveType = 'Residential' | 'Commercial' | 'Storage' | 'LongDistance';

export interface ItemPhoto {
  url: string;
  filename?: string;
  uploadedAt?: string;
}

export interface AIEstimate {
  itemsDetected: string[];
  estimatedVolume: number;
  estimatedWeight: number;
  recommendedTruck: string;
  loadingTime: number;
  aiConfidence: number;
  estimatedPrice?: number;
  needsManualReview: boolean;
  reviewedBy?: Partial<User>;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface CrewAssignment {
  driver?: Partial<User>;
  movers?: Partial<User>[];
  truck?: Partial<Truck>;
  assignedAt?: string;
  assignedBy?: Partial<User>;
}

export interface BookingTimeline {
  status: BookingStatus;
  changedAt: string;
  changedBy?: Partial<User>;
  note?: string;
}

export interface Booking {
  _id: string;
  bookingNumber: string;
  client: Partial<User>;
  pickupAddress: Address;
  destinationAddress: Address;
  moveDate: string;
  moveTime?: string;
  status: BookingStatus;
  moveType: MoveType;
  itemPhotos: ItemPhoto[];
  aiEstimate?: AIEstimate;
  crewAssignment?: CrewAssignment;
  specialInstructions?: string;
  floorDetails?: {
    pickupFloor?: number;
    destinationFloor?: number;
    hasElevator?: boolean;
  };
  payment?: {
    status: PaymentStatus;
    amount?: number;
    notes?: string;
    updatedAt?: string;
  };
  timeline: BookingTimeline[];
  review?: Review;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Truck / Fleet ────────────────────────────────────────────────────────────
export type TruckStatus = 'Available' | 'InUse' | 'Maintenance' | 'OutOfService';

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: string;
}

export interface Truck {
  _id: string;
  truckId: string;
  name: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  capacity: {
    volume: number;
    weight: number;
    label: string;
  };
  status: TruckStatus;
  maintenanceStatus: string;
  driver?: Partial<User>;
  currentLocation?: GeoLocation;
  activeBooking?: Partial<Booking>;
  mileage?: number;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  booking: string | Partial<Booking>;
  client: Partial<User>;
  ratings: {
    overall: number;
    professionalism?: number;
    timeliness?: number;
    carefulHandling?: number;
    valueForMoney?: number;
  };
  comment?: string;
  isPublished: boolean;
  adminResponse?: {
    text: string;
    respondedAt: string;
  };
  createdAt: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export type ConversationStatus =
  | 'Open'
  | 'BotHandling'
  | 'WaitingForAgent'
  | 'AgentHandling'
  | 'Resolved'
  | 'Closed';

export interface ChatMessage {
  _id: string;
  chatId?: string;
  sender?: Partial<User>;
  senderType: 'Client' | 'Agent' | 'Admin' | 'Bot';
  clientTempId?: string | null;
  content: string;
  timestamp: string;
  is_escalated?: boolean;
  assigned_admin_id?: string;
  isRead?: boolean;
  seenAt?: string | null;
  metadata?: {
    aiConfidence?: number;
    intent?: string;
  };
}

export interface Conversation {
  _id: string;
  client: Partial<User>;
  booking?: Partial<Booking>;
  assignedAgent?: Partial<User>;
  assigned_admin_id?: Partial<User> | string;
  status: ConversationStatus;
  messages: ChatMessage[];
  isEscalated: boolean;
  is_escalated?: boolean;
  escalatedAt?: string;
  escalationReason?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  booking?: string;
  createdAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  users: { totalClients: number; totalStaff: number };
  fleet: { available: number; inUse: number };
  averageRating: number | null;
  totalRevenue: number;
  recentBookings: Partial<Booking>[];
}

// ─── API Response ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
