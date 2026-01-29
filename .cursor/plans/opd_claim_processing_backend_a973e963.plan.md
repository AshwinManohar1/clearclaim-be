---
name: OPD Claim Processing Backend
overview: Create a Node.js TypeScript Express backend for OPD claim processing with MongoDB, including claim creation, background digitization/adjudication, and claim submission APIs. Keep it simple for a hackathon prototype.
todos:
  - id: setup-project
    content: Initialize TypeScript project with Express, MongoDB, and dependencies. Create package.json, tsconfig.json, and .env.example
    status: completed
  - id: create-models
    content: Create Claim model with MongoDB schema (patientName, documentUrls, status, digitizedData, adjudicationResult, timestamps)
    status: completed
    dependencies:
      - setup-project
  - id: create-utils
    content: "Create utility files: OpenAI client, Gemini client, digitization API client, and environment config"
    status: completed
    dependencies:
      - setup-project
  - id: create-services
    content: "Create services: ClaimService (CRUD), DigitizationService (external API), AdjudicationService (stub)"
    status: completed
    dependencies:
      - create-models
      - create-utils
  - id: create-controllers
    content: Create claimController with handlers for create, getAll, getById, and submit endpoints
    status: completed
    dependencies:
      - create-services
  - id: create-routes
    content: Create Express routes for /api/claims endpoints and wire up controllers
    status: completed
    dependencies:
      - create-controllers
  - id: setup-app
    content: Create Express app setup with middleware (JSON parser, error handling, CORS) and connect to MongoDB
    status: completed
    dependencies:
      - create-routes
  - id: background-processing
    content: Implement background digitization and adjudication pipeline that runs after claim creation
    status: completed
    dependencies:
      - create-services
  - id: create-server
    content: Create server.ts entry point to start Express server and handle graceful shutdown
    status: completed
    dependencies:
      - setup-app
---

# OPD Claim Processing Backend

## Architecture Overview

Simple Express + TypeScript + MongoDB backend with:

- **Models**: Claim schema with status tracking
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic (claims, digitization, adjudication)
- **Routers**: API route definitions
- **Utils**: OpenAI, Gemini, and digitization API clients
- **Background Processing**: Async digitization and adjudication

## Project Structure

```
src/
├── models/
│   └── Claim.ts              # MongoDB schema for claims
├── controllers/
│   └── claimController.ts    # HTTP request handlers
├── services/
│   ├── claimService.ts       # Claim CRUD operations
│   ├── digitizationService.ts # External digitization API client
│   └── adjudicationService.ts # Adjudication logic (stub for now)
├── routers/
│   └── claimRoutes.ts        # Express routes
├── utils/
│   ├── openai.ts             # OpenAI client utility
│   ├── gemini.ts             # Gemini client utility
│   └── digitizationClient.ts # Digitization API client
├── types/
│   └── index.ts              # TypeScript interfaces
├── config/
│   ├── database.ts           # MongoDB connection
│   └── env.ts                # Environment variables validation
├── app.ts                     # Express app setup
└── server.ts                  # Entry point
```

## Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant ClaimService
    participant DigitizationService
    participant AdjudicationService
    participant MongoDB

    Client->>API: POST /api/claims (with doc URLs)
    API->>ClaimService: createClaim()
    ClaimService->>>MongoDB: Save claim (status: pending)
    ClaimService-->>API: Return claim
    API-->>Client: 201 Created
    
    Note over ClaimService: Background process starts
    ClaimService->>ClaimService: Update status: digitizing
    ClaimService->>DigitizationService: digitizeDocuments()
    DigitizationService->>External API: Call digitization API
    External API-->>DigitizationService: Return extracted data
    DigitizationService-->>ClaimService: Return digitized data
    ClaimService->>MongoDB: Update claim with digitized data
    ClaimService->>ClaimService: Update status: adjudicating
    ClaimService->>AdjudicationService: adjudicate()
    AdjudicationService-->>ClaimService: Return adjudication result
    ClaimService->>MongoDB: Update claim (status: adjudicated)
```

## Implementation Details

### 1. Claim Model ([src/models/Claim.ts](src/models/Claim.ts))

- **Fields**:
  - `patientName`: string
  - `documentUrls`: string[] (URLs of uploaded documents)
  - `status`: enum ['pending', 'digitizing', 'adjudicating', 'adjudicated', 'submitted']
  - `digitizedData`: object (extracted data from documents)
  - `adjudicationResult`: object (adjudication outcome, rejection reasons if any)
  - `createdAt`, `updatedAt`: timestamps

### 2. APIs

**POST /api/claims**

- Request: `{ patientName: string, documentUrls: string[] }`
- Creates claim with status 'pending'
- Triggers background digitization/adjudication
- Returns created claim

**GET /api/claims**

- Returns list of all claims with pagination
- Query params: `?page=1&limit=10`

**GET /api/claims/:id**

- Returns single claim with full details

**POST /api/claims/:id/submit**

- Updates claim status to 'submitted'
- Validates claim is in 'adjudicated' status

### 3. Services

**ClaimService** ([src/services/claimService.ts](src/services/claimService.ts))

- `createClaim()`: Create new claim
- `getAllClaims()`: Get paginated claims
- `getClaimById()`: Get single claim
- `updateClaim()`: Update claim fields
- `submitClaim()`: Submit adjudicated claim

**DigitizationService** ([src/services/digitizationService.ts](src/services/digitizationService.ts))

- `digitizeDocuments()`: Call external digitization API
- Uses digitization client utility
- Handles API errors and retries

**AdjudicationService** ([src/services/adjudicationService.ts](src/services/adjudicationService.ts))

- `adjudicate()`: Process adjudication logic (stub for now)
- Returns adjudication result with approval/rejection status
- Placeholder for future logic implementation

### 4. Background Processing

- Use `setImmediate()` or simple async function for background processing
- After claim creation, trigger digitization → adjudication pipeline
- Update claim status at each stage
- Handle errors gracefully (update status, log errors)

### 5. Environment Variables (.env)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/clearclaim
DIGITIZATION_API_URL=https://zyvelor-document-extractor-uat...
DIGITIZATION_API_KEY=zyvl_...
OPENAI_API_KEY=
GEMINI_API_KEY=
NODE_ENV=development
```

### 6. Dependencies (package.json)

- `express`, `mongoose`, `dotenv`
- `axios` (for external API calls)
- `openai`, `@google/generative-ai` (AI clients)
- `typescript`, `@types/express`, `@types/node`
- `ts-node-dev` (development)

## Missing Features to Consider

1. **Error Handling Middleware**: Global error handler for consistent error responses
2. **Request Validation**: Validate request bodies (e.g., using `zod` or `joi`)
3. **Logging**: Simple console logging or Winston for production
4. **Health Check Endpoint**: `/health` for monitoring
5. **CORS**: Enable CORS if frontend is separate
6. **Rate Limiting**: Basic rate limiting for API protection

## Next Steps After Basics

1. Implement actual adjudication logic using digitized data
2. Add policy validation against claim data
3. Add fraud detection integration
4. Add more detailed status tracking
5. Add claim history/audit trail