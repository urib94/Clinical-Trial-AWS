/**
 * TypeScript Type Definitions - Clinical Trial Platform
 * 
 * Comprehensive type definitions for the dual-portal Clinical Trial platform,
 * ensuring type safety across physician admin and patient portals.
 */

// =============================================================================
// Base Types
// =============================================================================

export type UUID = string;
export type ISODateString = string;
export type EmailAddress = string;
export type PhoneNumber = string;
export type URL = string;

export interface BaseEntity {
  id: UUID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TimestampedEntity extends BaseEntity {
  createdBy?: UUID;
  updatedBy?: UUID;
}

// =============================================================================
// User Authentication & Authorization
// =============================================================================

export type UserRole = 'patient' | 'physician' | 'admin' | 'researcher';

export interface User extends BaseEntity {
  email: EmailAddress;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: ISODateString;
  preferences: UserPreferences;
  profile: UserProfile;
}

export interface UserProfile {
  avatar?: URL;
  phoneNumber?: PhoneNumber;
  timezone: string;
  language: string;
  organization?: string;
  department?: string;
  licenseNumber?: string; // For physicians
  biography?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

export interface AuthenticationState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  mfaRequired: boolean;
  sessionExpiry: Date | null;
  tokens: {
    accessToken: string;
    refreshToken: string;
    idToken: string;
  } | null;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface LoginCredentials {
  email: EmailAddress;
  password: string;
  rememberMe?: boolean;
}

export interface MFASetup {
  method: 'sms' | 'email' | 'authenticator';
  phoneNumber?: PhoneNumber;
  qrCode?: string;
  backupCodes?: string[];
}

// =============================================================================
// Patient Management
// =============================================================================

export interface Patient extends TimestampedEntity {
  email: EmailAddress;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phoneNumber?: PhoneNumber;
  status: PatientStatus;
  invitationStatus: InvitationStatus;
  enrollmentDate?: ISODateString;
  completionDate?: ISODateString;
  lastActivityAt?: ISODateString;
  metadata: PatientMetadata;
  groups: PatientGroup[];
  assignedQuestionnaires: AssignedQuestionnaire[];
}

export type PatientStatus = 
  | 'invited' 
  | 'registered' 
  | 'active' 
  | 'inactive' 
  | 'completed' 
  | 'withdrawn';

export type InvitationStatus = 
  | 'pending' 
  | 'sent' 
  | 'delivered' 
  | 'opened' 
  | 'accepted' 
  | 'expired' 
  | 'failed';

export interface PatientMetadata {
  studyId?: string;
  cohort?: string;
  recruitmentSource?: string;
  consentVersion?: string;
  customFields?: Record<string, any>;
}

export interface PatientGroup extends BaseEntity {
  name: string;
  description?: string;
  color: string;
  patientCount: number;
  criteria?: GroupCriteria[];
}

export interface GroupCriteria {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface PatientInvitation extends BaseEntity {
  patientId: UUID;
  invitedBy: UUID;
  email: EmailAddress;
  token: string;
  expiresAt: ISODateString;
  sentAt?: ISODateString;
  openedAt?: ISODateString;
  acceptedAt?: ISODateString;
  questionnaireIds?: UUID[];
  customMessage?: string;
}

export interface AssignedQuestionnaire {
  questionnaireId: UUID;
  assignedAt: ISODateString;
  dueDate?: ISODateString;
  status: 'assigned' | 'started' | 'completed' | 'overdue';
  completedAt?: ISODateString;
  remindersSent: number;
  lastReminderAt?: ISODateString;
}

// =============================================================================
// Questionnaire System
// =============================================================================

export interface Questionnaire extends TimestampedEntity {
  title: string;
  description?: string;
  instructions?: string;
  version: number;
  status: QuestionnaireStatus;
  category?: string;
  tags: string[];
  estimatedDuration: number; // minutes
  questions: Question[];
  settings: QuestionnaireSettings;
  metadata: QuestionnaireMetadata;
  statistics: QuestionnaireStatistics;
}

export type QuestionnaireStatus = 
  | 'draft' 
  | 'review' 
  | 'active' 
  | 'paused' 
  | 'archived' 
  | 'completed';

export interface QuestionnaireSettings {
  allowMultipleSubmissions: boolean;
  showProgressBar: boolean;
  allowBackNavigation: boolean;
  requireAllQuestions: boolean;
  randomizeQuestions: boolean;
  saveProgress: boolean;
  notificationSettings: NotificationSettings;
  accessSettings: AccessSettings;
}

export interface NotificationSettings {
  sendInvitations: boolean;
  sendReminders: boolean;
  reminderSchedule: ReminderSchedule[];
  completionNotification: boolean;
}

export interface ReminderSchedule {
  delay: number; // hours after assignment
  message?: string;
}

export interface AccessSettings {
  requireInvitation: boolean;
  publicLink: boolean;
  ipRestrictions?: string[];
  timeRestrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  days: number[];    // 0-6, Sunday = 0
}

export interface QuestionnaireMetadata {
  studyProtocol?: string;
  version: string;
  approvedBy?: UUID;
  approvedAt?: ISODateString;
  changeLog?: ChangeLogEntry[];
}

export interface ChangeLogEntry {
  version: string;
  changes: string[];
  changedBy: UUID;
  changedAt: ISODateString;
}

export interface QuestionnaireStatistics {
  totalAssigned: number;
  totalStarted: number;
  totalCompleted: number;
  averageCompletionTime: number; // minutes
  completionRate: number; // percentage
  dropoffRate: number; // percentage
  lastUpdated: ISODateString;
}

// =============================================================================
// Question Types
// =============================================================================

export interface Question extends BaseEntity {
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  settings: QuestionSettings;
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  metadata?: QuestionMetadata;
}

export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'scale'
  | 'matrix'
  | 'file_upload'
  | 'signature'
  | 'location'
  | 'divider'
  | 'instruction';

export interface QuestionSettings {
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: QuestionOption[];
  allowOther?: boolean;
  otherText?: string;
  multiline?: boolean;
  rows?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  acceptedFiles?: string[];
  maxFileSize?: number; // bytes
  maxFiles?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: Record<number, string>;
  matrixRows?: MatrixRow[];
  matrixColumns?: MatrixColumn[];
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  order: number;
  color?: string;
  image?: URL;
}

export interface MatrixRow {
  id: string;
  label: string;
  order: number;
}

export interface MatrixColumn {
  id: string;
  label: string;
  order: number;
  type: 'radio' | 'checkbox' | 'text' | 'number';
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export type ValidationType = 
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'min_value'
  | 'max_value'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'url'
  | 'date_range'
  | 'file_type'
  | 'file_size';

export interface ConditionalLogic {
  condition: LogicCondition;
  action: LogicAction;
}

export interface LogicCondition {
  questionId: UUID;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface LogicAction {
  type: 'show' | 'hide' | 'require' | 'skip_to';
  target?: UUID; // question ID for skip_to
}

export interface QuestionMetadata {
  category?: string;
  subcategory?: string;
  clinicalDomain?: string;
  validatedScale?: string;
  references?: string[];
}

// =============================================================================
// Response System
// =============================================================================

export interface QuestionnaireResponse extends TimestampedEntity {
  questionnaireId: UUID;
  patientId: UUID;
  version: number;
  status: ResponseStatus;
  startedAt: ISODateString;
  completedAt?: ISODateString;
  submittedAt?: ISODateString;
  duration?: number; // seconds
  responses: QuestionResponse[];
  metadata: ResponseMetadata;
  progress: ResponseProgress;
}

export type ResponseStatus = 
  | 'started'
  | 'in_progress'
  | 'completed'
  | 'submitted'
  | 'abandoned'
  | 'expired';

export interface QuestionResponse {
  questionId: UUID;
  value: ResponseValue;
  answeredAt: ISODateString;
  timeSpent?: number; // seconds
  metadata?: ResponseQuestionMetadata;
}

export type ResponseValue = 
  | string
  | number
  | boolean
  | string[]  // for multi-select
  | number[]  // for scale arrays
  | FileUpload[]
  | MatrixResponse
  | LocationResponse
  | null;

export interface FileUpload {
  id: UUID;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: URL;
  uploadedAt: ISODateString;
}

export interface MatrixResponse {
  [rowId: string]: {
    [columnId: string]: string | number | boolean;
  };
}

export interface LocationResponse {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface ResponseQuestionMetadata {
  skipped?: boolean;
  skipReason?: string;
  revisited?: boolean;
  validationErrors?: string[];
}

export interface ResponseMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  screenResolution?: string;
  timezone?: string;
  locale?: string;
  referrer?: string;
}

export interface ResponseProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  percentage: number;
  estimatedTimeRemaining?: number; // minutes
}

// =============================================================================
// Media Management
// =============================================================================

export interface MediaFile extends TimestampedEntity {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // for videos/audio
  url: URL;
  thumbnailUrl?: URL;
  uploadedBy: UUID;
  patientId?: UUID;
  questionnaireId?: UUID;
  questionId?: UUID;
  responseId?: UUID;
  tags: string[];
  description?: string;
  status: MediaStatus;
  scanResults?: VirusScanResult;
  metadata: MediaMetadata;
}

export type MediaStatus = 
  | 'uploading'
  | 'processing'
  | 'scanning'
  | 'ready'
  | 'failed'
  | 'quarantined'
  | 'deleted';

export interface VirusScanResult {
  scannedAt: ISODateString;
  status: 'clean' | 'infected' | 'suspicious' | 'error';
  engine: string;
  threats?: string[];
}

export interface MediaMetadata {
  exif?: Record<string, any>;
  fileHash: string;
  compressionRatio?: number;
  processedVersions?: ProcessedVersion[];
}

export interface ProcessedVersion {
  type: 'thumbnail' | 'preview' | 'compressed';
  url: URL;
  width: number;
  height: number;
  size: number;
}

export interface MediaUpload {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'queued';
  progress: number;
  size: number;
  error?: string;
  uploadedFile?: MediaFile;
}

// =============================================================================
// Analytics & Reporting
// =============================================================================

export interface Analytics {
  questionnaires: QuestionnaireAnalytics;
  patients: PatientAnalytics;
  responses: ResponseAnalytics;
  engagement: EngagementAnalytics;
  performance: PerformanceAnalytics;
}

export interface QuestionnaireAnalytics {
  totalQuestionnaires: number;
  activeQuestionnaires: number;
  averageCompletionRate: number;
  averageCompletionTime: number;
  mostPopularQuestions: QuestionPopularity[];
  dropoffAnalysis: DropoffPoint[];
}

export interface QuestionPopularity {
  questionId: UUID;
  questionTitle: string;
  responseCount: number;
  averageRating?: number;
}

export interface DropoffPoint {
  questionId: UUID;
  questionTitle: string;
  order: number;
  dropoffRate: number;
  totalAttempts: number;
}

export interface PatientAnalytics {
  totalPatients: number;
  activePatients: number;
  completionRates: CompletionRate[];
  engagementTrends: EngagementTrend[];
  demographicBreakdown: DemographicData[];
}

export interface CompletionRate {
  period: string;
  completed: number;
  assigned: number;
  rate: number;
}

export interface EngagementTrend {
  date: string;
  activeUsers: number;
  questionnairesCompleted: number;
  averageSessionDuration: number;
}

export interface DemographicData {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ResponseAnalytics {
  totalResponses: number;
  responsesByQuestion: QuestionResponseAnalytics[];
  responseTime: ResponseTimeAnalytics;
  qualityMetrics: ResponseQualityMetrics;
}

export interface QuestionResponseAnalytics {
  questionId: UUID;
  questionTitle: string;
  responseCount: number;
  averageResponseTime: number;
  responseDistribution: ResponseDistribution[];
}

export interface ResponseDistribution {
  value: string;
  count: number;
  percentage: number;
}

export interface ResponseTimeAnalytics {
  average: number;
  median: number;
  percentile95: number;
  byQuestionType: Record<QuestionType, number>;
}

export interface ResponseQualityMetrics {
  completionRate: number;
  validationErrorRate: number;
  averageResponseLength: number;
  skipRate: number;
}

export interface EngagementAnalytics {
  dailyActiveUsers: TimeSeries[];
  sessionMetrics: SessionMetrics;
  deviceBreakdown: DeviceBreakdown[];
  geographicDistribution: GeographicData[];
}

export interface TimeSeries {
  date: string;
  value: number;
}

export interface SessionMetrics {
  averageDuration: number;
  medianDuration: number;
  bounceRate: number;
  returnUserRate: number;
}

export interface DeviceBreakdown {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  count: number;
  percentage: number;
}

export interface GeographicData {
  country: string;
  region?: string;
  city?: string;
  count: number;
  percentage: number;
}

export interface PerformanceAnalytics {
  pageLoadTimes: PerformanceMetric[];
  apiResponseTimes: PerformanceMetric[];
  errorRates: ErrorRate[];
  uptimeMetrics: UptimeMetric[];
}

export interface PerformanceMetric {
  endpoint: string;
  averageTime: number;
  medianTime: number;
  percentile95: number;
  sampleCount: number;
}

export interface ErrorRate {
  endpoint: string;
  errorCount: number;
  totalRequests: number;
  errorRate: number;
  commonErrors: string[];
}

export interface UptimeMetric {
  service: string;
  uptime: number; // percentage
  downtime: number; // minutes
  incidents: number;
}

// =============================================================================
// API & Network Types
// =============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: ResponseMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp: ISODateString;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: ResponseMeta;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: ISODateString;
  userId?: UUID;
}

// =============================================================================
// UI State Types
// =============================================================================

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export interface UIState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  activeModal?: string;
  notifications: Notification[];
  theme: ThemeState;
  viewport: ViewportState;
}

export interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindnessMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

export interface ViewportState {
  width: number;
  height: number;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

// =============================================================================
// Form & Validation Types
// =============================================================================

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<keyof T, string[]>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface FormConfig<T = Record<string, any>> {
  initialValues: T;
  validationSchema?: ValidationSchema;
  onSubmit: (values: T) => Promise<void> | void;
  onError?: (error: Error) => void;
  resetOnSubmit?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// =============================================================================
// PWA & Offline Types
// =============================================================================

export interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  updateAvailable: boolean;
  pendingActions: OfflineAction[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: Date | null;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface ServiceWorkerMessage {
  type: 'SKIP_WAITING' | 'GET_VERSION' | 'CACHE_UPDATED' | 'OFFLINE_FALLBACK';
  payload?: any;
}

// =============================================================================
// Search & Filtering Types
// =============================================================================

export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateRange?: DateRange;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: SearchFilters;
  suggestions?: string[];
}

// =============================================================================
// Integration Types
// =============================================================================

export interface ExternalIntegration {
  id: UUID;
  name: string;
  type: IntegrationType;
  config: IntegrationConfig;
  status: 'active' | 'inactive' | 'error';
  lastSync?: ISODateString;
  createdAt: ISODateString;
}

export type IntegrationType = 
  | 'webhook'
  | 'api'
  | 'email'
  | 'sms'
  | 'ehr'
  | 'crm'
  | 'analytics';

export interface IntegrationConfig {
  endpoint?: URL;
  apiKey?: string;
  headers?: Record<string, string>;
  authentication?: AuthenticationConfig;
  mapping?: FieldMapping[];
  schedule?: SyncSchedule;
}

export interface AuthenticationConfig {
  type: 'api_key' | 'oauth2' | 'basic' | 'bearer';
  credentials: Record<string, string>;
}

export interface FieldMapping {
  source: string;
  target: string;
  transformation?: string;
}

export interface SyncSchedule {
  frequency: 'manual' | 'hourly' | 'daily' | 'weekly';
  time?: string; // HH:mm format
  timezone?: string;
}

// =============================================================================
// Audit & Compliance Types
// =============================================================================

export interface AuditLog extends BaseEntity {
  userId: UUID;
  userRole: UserRole;
  action: string;
  resource: string;
  resourceId?: UUID;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: ISODateString;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ComplianceReport {
  id: UUID;
  type: 'hipaa' | 'gdpr' | 'accessibility' | 'security';
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  requirements: ComplianceRequirement[];
  generatedAt: ISODateString;
  validUntil: ISODateString;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence?: string[];
  recommendations?: string[];
}

// =============================================================================
// Export Types for Module System
// =============================================================================

// User & Authentication
export type {
  User,
  UserProfile,
  UserPreferences,
  AuthenticationState,
  Permission,
  LoginCredentials,
  MFASetup,
} from './auth';

// Patient Management
export type {
  Patient,
  PatientStatus,
  InvitationStatus,
  PatientMetadata,
  PatientGroup,
  PatientInvitation,
  AssignedQuestionnaire,
} from './patient';

// Questionnaire System
export type {
  Questionnaire,
  QuestionnaireStatus,
  QuestionnaireSettings,
  Question,
  QuestionType,
  QuestionSettings,
  QuestionOption,
  ValidationRule,
  ConditionalLogic,
} from './questionnaire';

// Response System
export type {
  QuestionnaireResponse,
  ResponseStatus,
  QuestionResponse,
  ResponseValue,
  FileUpload,
  MatrixResponse,
  LocationResponse,
} from './response';

// Media Management
export type {
  MediaFile,
  MediaStatus,
  VirusScanResult,
  MediaUpload,
} from './media';

// Analytics
export type {
  Analytics,
  QuestionnaireAnalytics,
  PatientAnalytics,
  ResponseAnalytics,
  EngagementAnalytics,
} from './analytics';

// API & Network
export type {
  APIResponse,
  APIError,
  PaginatedResponse,
  WebSocketMessage,
} from './api';

// UI State
export type {
  UIState,
  ThemeState,
  ViewportState,
  Notification,
  LoadingState,
} from './ui';

// Forms
export type {
  FormState,
  ValidationSchema,
  FormConfig,
} from './forms';

// PWA
export type {
  PWAState,
  OfflineAction,
  ServiceWorkerMessage,
} from './pwa';