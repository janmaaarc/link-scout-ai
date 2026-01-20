# LinkScout AI

Autonomous LinkedIn Lead Generation powered by Google Gemini AI. Scout for high-quality B2B leads from LinkedIn posts, analyze them using AI, enrich lead data, and manage your sales prospecting workflow.

## Features

- **AI-Powered Lead Analysis** - Uses Google Gemini to score and qualify leads based on configurable keywords
- **Lead Management** - Track lead status (New, Qualified, Disqualified, Contacted, Replied)
- **Data Enrichment** - Auto-enrich leads with email, phone, and location data
- **Email Draft Generation** - AI-generated personalized outreach emails
- **Google Sheets Integration** - Export leads directly to Google Sheets via API
- **Dashboard Analytics** - Visualize lead trends and system health
- **System Logs** - Monitor automation activities across all services
- **Dark Mode** - Toggle between light and dark themes
- **Input Validation** - Form validation with proper error messages
- **Rate-Limited Auth** - Login protection with lockout after failed attempts

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (@google/genai)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Vercel Serverless Functions
- **Integrations:** Google Sheets API

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn
- Google Gemini API key
- Google Cloud Service Account (for Sheets integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/janmaaarc/link-scout-ai.git
cd link-scout-ai

# Install dependencies
npm install

# Copy environment example and configure
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
# Authentication (Optional - defaults to admin/admin for development)
# IMPORTANT: Change these for production!
VITE_AUTH_USERNAME=admin
VITE_AUTH_PASSWORD=your-secure-password-here

# Gemini API Key (Recommended: set via environment variable for security)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Google Sheets API (for serverless function)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-google-sheet-id
```

**Security Note:** API keys set via environment variables are prioritized over browser storage. The app will show a security warning if using browser storage for API keys.

## Project Structure

```
link-scout-ai/
├── api/                    # Vercel serverless functions
│   └── writeToSheet.ts     # Google Sheets integration
├── components/             # React components
│   ├── AddLeadModal.tsx    # Manual lead entry with validation
│   ├── LeadDetailDrawer.tsx # Lead details & email drafts
│   ├── Sidebar.tsx         # Navigation & settings
│   ├── StatCard.tsx        # Dashboard stat cards
│   └── Toast.tsx           # Notifications
├── pages/                  # Page components
│   ├── Dashboard.tsx       # Analytics overview
│   ├── LeadsManager.tsx    # Lead scanning & management
│   ├── Login.tsx           # Authentication with rate limiting
│   ├── SystemLogs.tsx      # Activity monitoring
│   └── WorkflowConfig.tsx  # Configuration settings
├── services/               # Business logic
│   ├── geminiService.ts    # Gemini AI integration
│   └── mockDataService.ts  # Mock data for development
├── App.tsx                 # Root component
├── types.ts                # TypeScript interfaces
├── .env.example            # Environment variables template
└── index.html              # HTML entry point
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Configuration

The Workflow Configuration page allows you to customize:

- **Keywords** - Terms that indicate lead relevance
- **Negative Keywords** - Terms to exclude leads
- **Scan Frequency** - How often to scan for leads (15-1440 minutes)
- **Minimum AI Score** - Threshold for lead qualification (0-100)
- **Enrichment** - Toggle automatic data enrichment
- **Integrations** - N8N webhook, PostgreSQL, Redis connections

## API Endpoints

### POST /api/writeToSheet

Writes lead data to Google Sheets.

**Request Body:**
```json
{
  "id": "abc123",
  "name": "John Doe",
  "title": "CEO",
  "company": "Acme Inc",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "postContent": "Looking for automation solutions...",
  "status": "QUALIFIED",
  "email": "john@acme.com"
}
```

**Response:**
```json
{
  "message": "Success: Lead added to sheet."
}
```

## Security Features

- **Environment Variable Priority** - API keys from environment variables take precedence over browser storage
- **Rate-Limited Login** - 5 failed attempts results in 60-second lockout
- **Input Validation** - All forms validate input with length limits and format checking
- **Secure Credentials** - Configurable auth credentials via environment variables
- **Delete Confirmation** - Confirmation dialog before deleting leads

## Default Credentials

For demo/development purposes:
- **Username:** admin
- **Password:** admin

**Important:** Configure `VITE_AUTH_USERNAME` and `VITE_AUTH_PASSWORD` environment variables for production.

## Deployment

This project is optimized for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy

The serverless functions in `/api` will be automatically deployed as Vercel Functions.

## Recent Improvements

- Secure API key handling via environment variables
- Rate-limited authentication with lockout protection
- Form input validation with error messages
- Delete confirmation dialog
- CSV export with proper escaping
- Google Sheets sync via actual API endpoint
- Performance optimization with useMemo
- Fixed scan frequency NaN bug

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
