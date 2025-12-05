import { Lead, LeadStatus, EnrichmentStatus, SystemLog, LogSeverity } from '../types';

const MOCK_NAMES = ["Alice Johnson", "Bob Smith", "Charlie Davis", "Diana Prince", "Ethan Hunt"];
const MOCK_TITLES = ["CTO", "VP of Engineering", "Head of Product", "Founder", "Senior Developer"];
const MOCK_COMPANIES = ["TechFlow", "InnovateX", "SaaSify", "CloudScale", "DataMinds"];
const MOCK_LOCATIONS = ["San Francisco, CA", "New York, NY", "Austin, TX", "London, UK", "Remote"];

const MOCK_POSTS = [
  "We are looking for a new automated solution for our sales pipeline. Does anyone have recommendations for tools like n8n or Zapier?",
  "Just raised our Series A! Now looking to hire a full engineering team. Exciting times ahead at CloudScale.",
  "Is it just me or is the LinkedIn algorithm getting worse? I barely see relevant content anymore.",
  "Need a freelancer to help scrape some data from public directories. DM me if interested.",
  "Our team is struggling with legacy code. Thinking about a complete rewrite in React. Thoughts?",
  "Looking for a co-founder for a new AI startup in the healthcare space."
];

export const generateMockLead = (): Lead => {
  const isTarget = Math.random() > 0.5;
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const company = MOCK_COMPANIES[Math.floor(Math.random() * MOCK_COMPANIES.length)];
  
  return {
    id: Math.random().toString(36).substring(7),
    name: name,
    title: MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)],
    company: company,
    linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
    postUrl: `https://linkedin.com/posts/${Math.random().toString(36).substring(7)}`,
    postContent: MOCK_POSTS[Math.floor(Math.random() * MOCK_POSTS.length)],
    postDate: new Date().toISOString(),
    foundAt: new Date().toISOString(),
    aiScore: 0,
    aiReasoning: "Pending analysis...",
    isRelevant: false,
    enrichmentStatus: EnrichmentStatus.PENDING,
    status: LeadStatus.NEW,
    location: MOCK_LOCATIONS[Math.floor(Math.random() * MOCK_LOCATIONS.length)],
  };
};

export const simulateEnrichment = async (lead: Lead): Promise<Lead> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...lead,
        email: `${lead.name.split(' ')[0].toLowerCase()}@${lead.company.toLowerCase()}.com`,
        phone: "+1 (555) 123-4567",
        enrichmentStatus: EnrichmentStatus.ENRICHED
      });
    }, 1500); // Simulate API delay
  });
};

export const generateMockLogs = (): SystemLog[] => {
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      service: 'LINKEDIN_SCRAPER',
      severity: LogSeverity.INFO,
      message: 'Scrape cycle started. 15 profiles queued.'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      service: 'OPENAI_GPT',
      severity: LogSeverity.INFO,
      message: 'Batch analysis complete. 3/15 qualified.'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      service: 'APOLLO_API',
      severity: LogSeverity.WARNING,
      message: 'Rate limit approaching (85% used).',
      details: 'Reset in 14 hours.'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 30).toISOString(),
      service: 'GOOGLE_SHEETS',
      severity: LogSeverity.ERROR,
      message: 'Write failed: 503 Service Unavailable',
      details: 'Retrying in 30s...'
    }
  ];
};