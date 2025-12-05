
export enum EnrichmentStatus {
  PENDING = 'PENDING',
  ENRICHED = 'ENRICHED',
  FAILED = 'FAILED'
}

export enum LeadStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  DISQUALIFIED = 'DISQUALIFIED',
  CONTACTED = 'CONTACTED',
  REPLIED = 'REPLIED'
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  linkedinUrl: string;
  postUrl: string;
  postContent: string;
  postDate: string;
  foundAt: string;
  
  // AI Analysis
  aiScore: number;
  aiReasoning: string;
  isRelevant: boolean;

  // Enrichment Data
  email?: string;
  phone?: string;
  location?: string;
  enrichmentStatus: EnrichmentStatus;
  
  // Workflow Status
  status: LeadStatus;
}

export interface WorkflowConfig {
  keywords: string[];
  negativeKeywords: string[];
  scanFrequencyMinutes: number;
  minAiScore: number;
  enrichmentEnabled: boolean;
  autoMessage: boolean;
  targetLocations: string[];
  
  // Mitigation & Safety
  useResidentialProxies: boolean;
  separateScoutAccount: boolean;
  
  // Infrastructure / Tech Stack Config
  n8nWebhookUrl: string;
  postgresConnection: string;
  redisConnection: string;
}

export interface Stats {
  totalScanned: number;
  qualified: number;
  enriched: number;
  messagesSent: number;
}

export enum LogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface SystemLog {
  id: string;
  timestamp: string;
  service: 'LINKEDIN_SCRAPER' | 'OPENAI_GPT' | 'APOLLO_API' | 'GOOGLE_SHEETS' | 'SYSTEM' | 'N8N_WORKFLOW' | 'POSTGRES_DB';
  severity: LogSeverity;
  message: string;
  details?: string;
}

export interface SystemHealth {
  scraperStatus: 'ONLINE' | 'RATE_LIMITED' | 'OFFLINE';
  databaseStatus: 'CONNECTED' | 'DISCONNECTED';
  lastHeartbeat: string;
  errorRate: number; // Percentage
}
