# Career Autopilot — Project Context Report

Generated: 2025-06-11

## 1. Product Vision

Career Autopilot is a **candidate-centric Opportunity Operating System** that transforms how professionals discover, evaluate, and pursue career opportunities.

### Core Philosophy

Unlike job-centric tools that follow a linear "job posting → analysis → application package" model, Career Autopilot operates from the candidate's perspective:

**Career-Ops (Traditional):**
- Job posting → analysis → application package

**Career Autopilot:**
- Candidate → opportunity discovery → prioritization → fit analysis → positioning → application workflow

### Product Rule

A feature only belongs if it:
- **Increases the user's probability of getting a better career opportunity**, or
- **Significantly reduces the time needed to find, evaluate, or pursue opportunities.**

### Value Proposition

Career Autopilot answers the fundamental question: *"Given who I am, what I've done, and where I want to go, what opportunities should I pursue and how should I pursue them?"*

## 2. Current User Flow

```
Profile Setup
    ↓
Experience Intelligence (CV parsing & analysis)
    ↓
Job Discovery (automated, multi-source)
    ↓
Recommended Jobs (ranked with V2 scoring)
    ↓
Create Job (move to personal pipeline)
    ↓
Job Detail (full analysis & scoring)
    ↓
Fit Analysis / Scoring (V2 three-tier architecture)
    ↓
Positioning Strategy (narrative & differentiation)
    ↓
Material Generation (CV, cover letter, messages)
    ↓
Pipeline Tracking (application status management)
```

### What Works Well
- **Experience Intelligence**: Strong CV parsing with detailed extraction
- **Job Discovery**: Multi-provider automated discovery with good coverage
- **V2 Scoring**: Three-tier scoring (discovery/fit/positionability) working correctly
- **Material Generation**: High-quality tailored materials using positioning
- **Positioning Engine**: Sophisticated narrative generation

### What's Still Rough
- **Candidate Intelligence**: Missing structured candidate model
- **Discovery Diversity**: Can be concentrated around limited sources
- **Fit Analysis**: Still depends on raw keywords vs structured candidate data
- **Career Goals**: Only indirectly represented through target titles

## 3. Database Schema Overview

### Core Models

#### CandidatePreferences
- **Purpose**: User's job search preferences and constraints
- **Key Fields**: `targetTitles`, `positiveKeywords`, `excludedCountries`, `openToRelocation`, `preferredCountries`
- **Used By**: Discovery scoring, fit analysis
- **Relationships**: One-to-many with RecommendedJob

#### ResumeMaster
- **Purpose**: Master CV record with parsing results
- **Key Fields**: `rawText`, `parsedJson`, `fileUrl`, `source`
- **Used By**: Experience Intelligence, Material Generation
- **Relationships**: One-to-one with ExperienceInsight

#### ExperienceInsight
- **Purpose**: Structured extraction from CV
- **Key Fields**: `responsibilities`, `skills`, `keywords`, `metrics`, `transferableNarratives`, `workEnvironment`, `professionalThemes`, `impactStatements`, `achievementSignals`
- **Used By**: Material Generation, Positioning Engine
- **Relationships**: Belongs to ResumeMaster

#### CompanySource
- **Purpose**: Job source provider configuration
- **Key Fields**: `provider`, `providerSlug`, `url`, `isActive`, `lastRunAt`
- **Used By**: Discovery system
- **Relationships**: One-to-many with RecommendedJob

#### RecommendedJob
- **Purpose**: Discovered jobs with V2 scoring
- **Key Fields**: `title`, `company`, `location`, `description`, `matchScore`, `label`, `discoveryScore`, `fitScore`, `positionabilityScore`, `finalVerdict`, `fitReasons`, `fitRisks`, `fitGaps`, `fitBreakdown`
- **Used By**: Job creation pipeline, Recommended Jobs UI
- **Relationships**: Belongs to CompanySource, many-to-one with Job

#### Job
- **Purpose**: User's personal job pipeline
- **Key Fields**: `title`, `companyName`, `location`, `sourceUrl`, `rawText`, `applicationStatus`
- **Used By**: Job detail page, material generation
- **Relationships**: One-to-many with JobEvaluation, one-to-many with Material

#### JobEvaluation
- **Purpose**: Scoring and analysis for user's jobs
- **Key Fields**: `totalScore`, `label`, `reasons`, `risks`, `gaps`, `seniorityFit`, `stackFit`, `domainFit`, `languageFit`, `geographyFit`, `honestyFit`, `narrativeSuggestion`
- **Used By**: Job detail page, scoring display
- **Relationships**: Belongs to Job

#### PositioningProfile
- **Purpose**: Strategic positioning analysis for a job
- **Key Fields**: `recommendedPosition`, `recruiterHook`, `leadWith`, `biggestRisk`, `riskResponse`, `positioningNarrative`, `strengths`, `differentiators`, `cvStrategy`, `interviewStrategy`
- **Used By**: Material Generation, Positioning Strategy UI
- **Relationships**: Belongs to Job

### Material Models
- **CV**: Generated tailored CV versions
- **CoverLetter**: Generated cover letters
- **RecruiterMessage**: Generated outreach messages

## 4. Discovery System

### Architecture
- **Location**: `src/server/jobDiscovery/`
- **Entry Point**: `src/app/api/discovery/run/route.ts`

### Provider Architecture
```
CompanySource Registry
    ↓
Provider Fetchers (Ashby, Greenhouse, Lever, etc.)
    ↓
Job Parsing & Normalization
    ↓
Deduplication
    ↓
V2 Scoring
    ↓
RecommendedJob Persistence
```

### Implemented Providers
- **Ashby**: `src/server/jobDiscovery/providers/ashby.ts`
- **Greenhouse**: `src/server/jobDiscovery/providers/greenhouse.ts`
- **Lever**: `src/server/jobDiscovery/providers/lever.ts`
- **Workable**: `src/server/jobDiscovery/providers/workable.ts`

### Company Source Registry
- **File**: `src/server/jobDiscovery/companySources.ts`
- **Purpose**: Centralized provider configuration
- **Coverage**: 20+ companies, expanding for Europe/Spain

### Discovery Scoring
- **File**: `src/server/jobDiscovery/discoveryScoring.ts`
- **Function**: `discoveryScoreJob()`
- **Output**: V2 three-tier scoring (discovery/fit/positionability)

### Query-Aware Discovery
- **Feature**: Supports search queries with `query` parameter
- **Implementation**: `queryMatch` in discovery scoring
- **Usage**: Targeted job searches

### Known Limitations
- **Source Concentration**: Can be dominated by high-volume providers
- **Geographic Bias**: Stronger US coverage than EU/Spain
- **Update Frequency**: Manual source updates required
- **Parsing Variability**: Different providers have different data quality

### Important: Discovery vs Fit Score
- **Discovery Score**: Search relevance (how well job matches query/preferences)
- **Fit Score**: Realistic candidate compatibility (how likely candidate is to succeed)
- **Critical**: Discovery score should NOT be treated as real candidate fit

## 5. Fit Analysis / Scoring System

### Architecture Evolution

#### Old V1 Scoring
- Single score (0-100)
- Basic keyword matching
- Limited breakdown components
- Simple verdict system (APPLY/MAYBE/SKIP)

#### V2 Three-Score Architecture
```
discoveryScore (0-100): Search relevance and basic match
fitScore (0-100): Realistic candidate compatibility  
positionabilityScore (0-100): Interview narrative potential
finalVerdict: APPLY/APPLY_STRETCH/MAYBE/SKIP
```

### V2 Scoring Components

#### Fit Score Breakdown
- **Experience Fit** (25%): Years of experience alignment
- **Seniority Fit** (20%): Seniority level matching
- **Stack Fit** (20%): Technology stack overlap
- **Domain Fit** (15%): Industry/domain experience
- **Geography Fit** (10%): Location compatibility
- **Language Fit** (5%): Language requirements
- **Honesty Fit** (5%): Realistic self-assessment

#### Positionability Score Factors
- **Narrative Strength**: Storytelling capability
- **Customer-Facing Experience**: Client interaction skills
- **Adjacent Skills**: Transferable capabilities
- **Projects**: Relevant project portfolio

### Data Flow
```
V2 Scoring Calculation (discoveryScoring.ts)
    ↓
RecommendedJob (V2 fields persisted)
    ↓
Job Creation (V2 fields transferred)
    ↓
JobEvaluation (V2 data stored)
    ↓
Job Detail UI (V2 data displayed)
```

### File Locations
- **Scoring Engine**: `src/server/jobScoring/fitAnalysisV2.ts`
- **Requirement Extraction**: `src/server/jobScoring/requirementExtraction.ts`
- **Discovery Integration**: `src/server/jobDiscovery/discoveryScoring.ts`
- **UI Display**: `src/app/jobs/[id]/page.tsx`

### Recent Plumbing Fix (2025-06-11)
- **Issue**: V2 fields calculated but not persisted/transferred
- **Fix**: Complete data flow from calculation to UI display
- **Result**: Frontend now shows realistic fit scores instead of misleading discovery scores

### Current Weaknesses
- **Candidate Profile**: Still not structured enough
- **Preference Dependence**: Fit score heavily depends on preference quality
- **Missing Intelligence Layer**: No structured candidate model
- **Experience Integration**: Experience Intelligence not fully connected to Fit Analysis

## 6. Experience Intelligence

### Location
- **Main Logic**: `src/server/experience/experienceIntelligence.ts`
- **API Route**: `src/app/api/profile/experience-intelligence/analyze/route.ts`

### What It Extracts
From uploaded CV/resume:
- **Responsibilities**: Day-to-day duties and achievements
- **Skills**: Technical and soft skills
- **Keywords**: Important terms and phrases
- **Metrics**: Quantifiable achievements (numbers, percentages)
- **Transferable Narratives**: Stories that work across contexts
- **Work Environment**: Team size, company culture, work style
- **Professional Themes**: Career patterns and specializations
- **Impact Statements**: "Built X, resulting in Y" format achievements
- **Achievement Signals**: High-impact accomplishments

### Current Usage
- **Material Generation**: Provides content for tailored CV and cover letters
- **Positioning Engine**: Supplies evidence for positioning narratives
- **Profile Enhancement**: Enriches user profile with structured data

### Future Integration
Should feed into:
- **Candidate Intelligence**: As primary data source
- **Evidence Engine**: As evidence inventory
- **Fit Analysis V3**: As structured candidate model

## 7. Positioning Engine

### Location
- **Main Logic**: `src/server/positioning/positioningEngine.ts`
- **API Route**: `src/app/api/jobs/[id]/positioning/analyze/route.ts`

### What It Generates
For a specific job:
- **Recommended Position**: How to position yourself
- **Recruiter Hook**: Opening message to grab attention
- **Lead With**: Most compelling opening statement
- **Biggest Risk**: Main weakness or concern
- **Risk Response**: How to address the biggest risk
- **Positioning Narrative**: Complete story framework
- **Strengths**: Key advantages to highlight
- **Differentiators**: What makes you unique
- **CV Strategy**: How to structure your CV
- **Interview Strategy**: How to approach interviews

### Current Usage
- **Material Generation V2**: Uses positioning for tailored content
- **Job Detail UI**: Displays positioning strategy
- **Application Strategy**: Provides narrative guidance

### Inputs Used
- **Job**: Requirements and description
- **Profile**: User preferences and goals
- **Experience Intelligence**: Extracted CV data
- **Fit Analysis**: Compatibility assessment

## 8. Material Generation

### Location
- **Main Logic**: `src/server/materials/`
- **API Routes**: 
  - `src/app/api/jobs/[id]/generate-cv/route.ts`
  - `src/app/api/jobs/[id]/generate-materials/route.ts`
  - `src/app/api/export/*/route.ts`

### Generated Materials
- **Tailored CV**: Job-specific CV optimization
- **Cover Letter**: Personalized cover letter
- **Recruiter Message**: Outreach message templates
- **Screening Answers**: Pre-prepared responses to common questions

### Inputs Used
- **Job**: Specific job requirements and description
- **Profile**: User preferences and career goals
- **Resume Master**: Base CV content
- **Experience Intelligence**: Structured CV analysis
- **Positioning Strategy**: Narrative framework
- **Fit Analysis**: Compatibility insights (when available)

### Current Strengths
- **High Quality**: Professional, well-structured output
- **Personalized**: Tailored to specific jobs
- **Comprehensive**: Multiple material types
- **Positioning-Aware**: Uses strategic positioning

### Current Limitations
- **Template-Based**: Some repetition across jobs
- **Evidence Quality**: Limited by Experience Intelligence depth
- **Customization**: Limited user control over output style
- **Integration**: Could better use Fit Analysis insights

## 9. Candidate Intelligence — Missing Layer

### Current State
**This layer does not exist yet.** Experience Intelligence exists but Candidate Intelligence is the missing structured candidate model.

### Planned Components
Should combine:
- **Experience Intelligence**: CV analysis results
- **Projects**: Project portfolio and achievements
- **Career Goals**: Explicit career objectives
- **Languages**: Language proficiency levels
- **Technical Stack**: Technology expertise levels
- **Education**: Formal education and certifications
- **Target Titles**: Desired role types
- **User Outcomes**: Historical application results

### Expected Outputs
- **Career Stage**: Early/mid/senior level assessment
- **Technical Stack**: Core technologies and proficiency
- **Role Families**: Primary and secondary role categories
- **Domains**: Industry and domain expertise
- **Languages**: Language capabilities
- **Strengths**: Key competitive advantages
- **Constraints**: Limitations and preferences
- **Career Direction**: Strategic career path
- **Evidence Inventory**: Proven capabilities and achievements

### Why This Matters
Fit Analysis should compare job requirements against a **structured candidate model**, not raw keyword matching. This would dramatically improve scoring accuracy and reduce false positives.

## 10. Evidence Engine — Planned Layer

### Planned Concept
For each job, systematically answer: *"Why this candidate?"*

### Expected Output Example
**Role requires:**
- LLMs experience
- Python proficiency  
- Agentic workflows
- Production AI systems

**Candidate evidence:**
- **Career Autopilot**: Built LLM workflow and scoring system
- **WhatsApp Agent**: Created OpenAI/Twilio agent system
- **ProjectFlow AI**: Developed AI planning workflow

**Identified gaps:**
- LangGraph framework experience
- Production AI team experience
- Enterprise-scale deployment

### Integration Points
Should feed into:
- **Fit Analysis**: Evidence-based compatibility scoring
- **Positioning Strategy**: Evidence-backed narratives
- **Material Generation**: Specific achievement highlights
- **Interview Prep**: Evidence-based question preparation

## 11. Known Issues

### Discovery Issues
- **Source Concentration**: Results can be dominated by single companies/providers
- **Geographic Bias**: Stronger US coverage than EU/Spain markets
- **Update Frequency**: Manual source updates required for new companies
- **Parsing Variability**: Different providers provide different data quality

### Scoring Issues
- **Discovery Score Display**: Should be hidden or relabeled as "Relevance Score"
- **Candidate Model Missing**: Fit Analysis limited by lack of structured candidate data
- **Preference Quality**: Scoring depends heavily on preference completeness
- **Over/Under Scoring**: May misfit roles until candidate model improves

### User Experience Issues
- **Career Goals**: Only indirectly represented through target titles
- **Profile Setup**: Could be more guided and intuitive
- **Pipeline Management**: Limited application tracking features
- **Mobile Experience**: Not optimized for mobile usage

### Technical Issues
- **Database Performance**: Some queries could be optimized
- **Error Handling**: Could be more robust across all APIs
- **Logging**: Insufficient debug information for troubleshooting
- **Testing**: Limited automated test coverage

## 12. Recommended Next Sprints

### Sprint 1: Candidate Intelligence V1
- Create structured candidate model
- Integrate Experience Intelligence
- Add career goals and preferences
- Build evidence inventory system

### Sprint 2: Evidence Engine V1  
- Implement evidence mapping system
- Connect job requirements to candidate evidence
- Build gap identification system
- Create evidence-based narratives

### Sprint 3: Fit Analysis V3
- Rewrite Fit Analysis using Candidate Intelligence
- Improve scoring accuracy with structured data
- Add evidence-based reasoning
- Reduce false positives/negatives

### Sprint 4: Discovery Diversity
- Implement source balancing algorithms
- Add geographic diversity controls
- Improve provider coverage for EU/Spain
- Add discovery quality metrics

### Sprint 5: Career Direction Onboarding
- Build guided career goal setup
- Add career path visualization
- Implement skill gap analysis
- Create development recommendations

### Sprint 6: Polish & Launch
- Improve UI/UX across all features
- Add comprehensive documentation
- Create screenshots and demos
- Prepare LinkedIn launch materials

## 13. File Map

### Profile & Experience
**Frontend Components:**
- `src/app/profile/page.tsx` - Main profile page
- `src/components/ProfileForm.tsx` - Profile editing
- `src/app/api/profile/resume/upload/route.ts` - Resume upload

**API Routes:**
- `src/app/api/profile/route.ts` - Profile CRUD
- `src/app/api/profile/experience-intelligence/analyze/route.ts` - Experience analysis

**Server Logic:**
- `src/server/experience/experienceIntelligence.ts` - Experience extraction
- `src/server/experience/resumeParser.ts` - Resume parsing

**Database Models:**
- `CandidatePreferences` - User preferences
- `ResumeMaster` - CV records
- `ExperienceInsight` - Structured extraction

### Discovery System
**Frontend Components:**
- `src/app/page.tsx` - Dashboard with discovery results
- `src/components/RecommendedJobsList.tsx` - Jobs list

**API Routes:**
- `src/app/api/discovery/run/route.ts` - Discovery execution
- `src/app/api/discovery/recommended/route.ts` - Get recommended jobs
- `src/app/api/discovery/recommended/[id]/create-job/route.ts` - Create job

**Server Logic:**
- `src/server/jobDiscovery/discoveryService.ts` - Main discovery logic
- `src/server/jobDiscovery/discoveryScoring.ts` - V2 scoring
- `src/server/jobDiscovery/providers/` - Provider implementations
- `src/server/jobDiscovery/companySources.ts` - Source registry

**Database Models:**
- `CompanySource` - Provider configuration
- `RecommendedJob` - Discovered jobs with V2 scoring

### Job Management & Analysis
**Frontend Components:**
- `src/app/jobs/[id]/page.tsx` - Job detail page
- `src/components/StatusControls.tsx` - Application status
- `src/components/EditJobDetailsForm.tsx` - Job editing

**API Routes:**
- `src/app/api/jobs/[id]/route.ts` - Job CRUD
- `src/app/api/jobs/[id]/positioning/analyze/route.ts` - Positioning analysis
- `src/app/api/jobs/[id]/generate-materials/route.ts` - Material generation

**Server Logic:**
- `src/server/jobScoring/fitAnalysisV2.ts` - V2 scoring engine
- `src/server/jobScoring/requirementExtraction.ts` - Requirement extraction
- `src/server/positioning/positioningEngine.ts` - Positioning logic

**Database Models:**
- `Job` - User's job pipeline
- `JobEvaluation` - Job scoring and analysis
- `PositioningProfile` - Positioning strategy

### Material Generation
**Frontend Components:**
- `src/components/MaterialsSection.tsx` - Materials display
- `src/components/PositioningStrategySection.tsx` - Positioning display

**API Routes:**
- `src/app/api/jobs/[id]/generate-cv/route.ts` - CV generation
- `src/app/api/export/cv/pdf/route.ts` - PDF export
- `src/app/api/export/cover-letter/docx/route.ts` - DOCX export

**Server Logic:**
- `src/server/materials/cvGenerator.ts` - CV generation
- `src/server/materials/coverLetterGenerator.ts` - Cover letter generation
- `src/server/export/` - Export utilities

**Database Models:**
- `Material` - Generated materials storage

### Scoring System
**Frontend Components:**
- `src/components/ScoreBar.tsx` - Score visualization
- `src/app/jobs/[id]/page.tsx` - Score display

**API Routes:**
- `src/app/api/debug/test-v2-scoring/route.ts` - Scoring debug

**Server Logic:**
- `src/server/jobScoring/fitAnalysisV2.ts` - V2 scoring
- `src/server/jobScoring/requirementExtraction.ts` - Requirements
- `src/server/jobDiscovery/discoveryScoring.ts` - Discovery scoring

### Types & Utilities
**Type Definitions:**
- `src/types/` - Shared TypeScript types
- `src/lib/` - Utility functions
- `src/lib/db.ts` - Database connection

## 14. Build / Dev Commands

### Development
```bash
npm run dev              # Start development server (usually port 3000)
```

### Build & Type Checking
```bash
npm run build            # Production build (includes Prisma generation)
npx next build           # Next.js build only
npx tsc --noEmit         # TypeScript type checking
```

### Database
```bash
npx prisma generate      # Generate Prisma client
npx prisma migrate dev    # Run database migrations (development)
npx prisma migrate deploy # Deploy migrations (production)
npx prisma studio        # Open database browser
```

### Common Issues
- **Port 3000 in use**: Next.js will automatically use 3001, or kill existing process: `kill 90120`
- **Database migration errors**: Use `npx prisma generate` instead of full build if schema is already in sync
- **TypeScript errors**: Run `npx tsc --noEmit` to check without building

### Environment Setup
- Copy `.env.example` to `.env` and configure database URL
- Run `npx prisma generate` after schema changes
- Run `npm run build` to verify everything works

---

## Summary

Career Autopilot is a sophisticated candidate-centric opportunity operating system with strong foundations in Experience Intelligence, V2 scoring, and Material Generation. The recent plumbing fixes have resolved the core scoring data flow issues.

**Key Strengths:**
- V2 three-tier scoring working correctly
- Strong Experience Intelligence and Material Generation
- Comprehensive multi-source job discovery
- Sophisticated positioning engine

**Next Priorities:**
1. Build Candidate Intelligence layer
2. Implement Evidence Engine
3. Upgrade Fit Analysis using structured candidate data
4. Improve discovery diversity and geographic coverage

The system is ready for the next phase of development focusing on structured candidate modeling and evidence-based matching.
