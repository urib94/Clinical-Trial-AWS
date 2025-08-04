# Clinical Trial Platform - Project Memory

## Project Context
Healthcare clinical trial platform enabling physicians to create dynamic questionnaires and patients to securely submit data and media. Built with mobile-first PWA, AWS serverless backend, and HIPAA-aligned security.

## Key Personas & Requirements

### The Physician (Admin)
- **Profile**: Medical professional with no technical background
- **Needs**: Extremely intuitive, visual, simple-to-use management panel
- **Core Features**:
  - Dashboard with key statistics and patient activity
  - Drag-and-drop questionnaire builder with conditional logic
  - Patient management with secure invitation system
  - Data export (CSV/JSON) and basic analytics
  - Media gallery with patient context tagging

### The Patient (User) 
- **Profile**: Clinical trial participant, varying technical proficiency
- **Scale**: Up to 600 patients per trial
- **Core Features**:
  - Secure registration via unique time-sensitive links
  - Two-factor authentication (2FA) setup
  - Step-by-step questionnaire flow with auto-save
  - Media upload capabilities
  - Profile management (password, 2FA settings)

## Architecture Decisions

### Technology Stack Rationale
- **Frontend**: Next.js 14 for server-side rendering, React for component architecture, TypeScript for type safety
- **Backend**: AWS Lambda for cost-effective serverless scaling, Node.js 20 for performance
- **Database**: Aurora PostgreSQL Serverless v2 for auto-scaling with healthcare data requirements
- **Auth**: AWS Cognito for managed user pools with MFA support
- **Storage**: S3 with lifecycle policies for cost optimization
- **CDN**: CloudFront for global content delivery
- **IaC**: Terraform for reproducible infrastructure

### Security Architecture
- **Compliance**: HIPAA-aligned principles with strict access controls
- **Encryption**: 
  - At Rest: AWS KMS for all data stores
  - In Transit: TLS 1.2+ enforcement
  - Database: Column-level encryption with pgcrypto
- **Authorization**: Role-Based Access Control (RBAC)
- **Audit**: Comprehensive logging for all significant actions
- **Protection**: AWS WAF with OWASP Top 10 managed rules

### Performance Targets
- Lambda cold start < 400ms
- Lighthouse mobile score ≥ 90  
- PWA offline functionality
- Responsive design (≥ 360px viewport)
- Database auto-scaling based on demand

### Cost Optimization Strategy
- Target: ≤ $40/month at 100 MAU
- Aurora Serverless v2 with pause/resume capabilities
- S3 lifecycle policies (Standard → IA → Glacier)
- NAT instance instead of NAT Gateway for cost savings
- Graviton processors for Lambda functions

## Development Phases

### Phase 1: Architecture & Setup ✓ (Current)
- Detailed architecture diagram
- Technology stack implementation
- Repository structure setup
- Initial Terraform infrastructure
- CI/CD pipeline foundation

### Phase 2: Backend Development (API-First)
- Database schema with healthcare data requirements
- AWS Cognito integration with MFA
- Core API endpoints for patients and physicians
- OpenAPI (Swagger) documentation
- Comprehensive test suite (unit + integration)

### Phase 3: Frontend Development  
- Mobile-first PWA implementation
- Patient portal with accessibility features
- Physician admin panel with drag-and-drop builder
- API integration with error handling
- Animations and user experience enhancements

### Phase 4: Deployment & Finalization
- Production Terraform configurations
- Full CI/CD pipeline with manual prod approval
- Security audit and penetration testing
- Comprehensive user documentation
- Performance optimization and monitoring

## Critical Success Factors
1. **Security First**: Every decision must prioritize patient data protection
2. **User Experience**: Intuitive interfaces for non-technical physicians
3. **Scalability**: Architecture must handle 600+ patients efficiently  
4. **Compliance**: HIPAA-aligned controls and audit capabilities
5. **Cost Control**: Maintain ≤ $40/month operational costs
6. **Performance**: Meet mobile-first performance benchmarks

## Future Enhancements (Post-MVP)
- ePROs with scheduled notifications
- Daily symptom tracking interface
- Wearable device integration (Apple HealthKit, Google Fit)
- Advanced analytics and reporting
- Multi-language internationalization

## Orchestration & Project Management

### Development Orchestrator
The **Development Orchestration Agent** serves as the master coordinator:
- **Task Allocation**: Routes work to specialized agents based on expertise
- **Progress Tracking**: Maintains project state across multiple conversations
- **Quality Oversight**: Ensures deliverables meet source prompt requirements
- **Dependency Management**: Coordinates handoffs between development phases
- **Session Continuity**: Resumes work seamlessly using Memory MCP server

### Progress Tracking System
- **Project State**: Real-time tracking of phase progress and task completion
- **Agent Activity**: Monitor which agents are active, blocked, or standby
- **Quality Gates**: Automated validation at phase transitions
- **Risk Management**: Proactive identification and mitigation of blockers
- **Metrics Dashboard**: Velocity, quality, and budget tracking

## Key Files & Structure
```
Clinical-Trail-AWS/
├── frontend/           # Next.js PWA (Patient + Admin portals)  
├── backend/           # AWS Lambda functions (Node.js 20)
├── infra/            # Terraform modules (Network, Auth, Compute, Data)
├── scripts/          # Deployment automation (PowerShell)
├── tests/            # E2E, integration, security tests
├── docs/             # Architecture, API documentation
└── .claude/          # Agent configurations and memory
    ├── agents/       # Specialized agent configurations (10 agents)
    ├── progress/     # Project state and task tracking
    ├── memory.md     # Project context and decisions
    └── setup-mcp.md  # MCP tools configuration guide
```

## Development Guidelines
- **Testing**: ≥85% code coverage, comprehensive E2E testing
- **Security**: OWASP compliance, regular vulnerability scanning  
- **Performance**: Monitor cold starts, optimize bundle sizes
- **Accessibility**: WCAG 2.1 AA compliance, large font support
- **Mobile**: Progressive enhancement, offline capabilities
- **Documentation**: OpenAPI specs, user guides, architecture diagrams

## Available MCP Tools

### AWS MCP Server
- **Purpose**: Direct AWS service integration and management
- **Usage**: Deploy Lambda functions, manage S3 buckets, monitor CloudWatch
- **Benefits**: Streamlined AWS operations, real-time monitoring, cost tracking

### PostgreSQL MCP Server
- **Purpose**: Database operations for Aurora PostgreSQL
- **Usage**: Execute queries, manage migrations, seed test data
- **Benefits**: Direct database access, schema management, performance monitoring

### GitHub MCP Server
- **Purpose**: Repository and project management integration
- **Usage**: Handle PRs, trigger workflows, track issues
- **Benefits**: Enhanced collaboration, automated CI/CD, project tracking

### Memory MCP Server
- **Purpose**: Persistent conversation memory across sessions
- **Usage**: Remember architectural decisions, user preferences, configurations
- **Benefits**: Maintain context, consistent decisions, knowledge retention

### Filesystem MCP Server
- **Purpose**: Enhanced file operations within project directory
- **Usage**: Generate code, manage project structure, batch operations
- **Benefits**: Efficient code generation, structured file management

### Brave Search MCP Server
- **Purpose**: Web search for development resources and research
- **Usage**: Find AWS documentation, healthcare compliance info, best practices
- **Benefits**: Quick research, up-to-date information, problem-solving support

## Agent Ecosystem (10 Specialized Agents)

1. **Development Orchestrator** (sonnet) - Master coordinator and task allocator
2. **System Architect** (sonnet) - Overall system design and scalability
3. **Infrastructure Engineer** (sonnet) - Terraform and AWS infrastructure
4. **Backend Engineer** (sonnet) - Lambda functions and API development
5. **Frontend Developer** (sonnet) - React/Next.js dual-portal development
6. **Security Engineer** (sonnet) - HIPAA compliance and security controls
7. **DevOps Engineer** (sonnet) - CI/CD pipelines and deployment automation
8. **Physician Portal UX Specialist** (sonnet) - Non-technical physician interfaces
9. **Patient Portal Accessibility Specialist** (sonnet) - Patient experience and accessibility
10. **QA Engineer** (haiku) - Testing strategies and quality assurance

### Agent Coordination
- **Primary Agents**: Lead specific development areas
- **Supporting Agents**: Provide expertise and review deliverables
- **MCP Tool Integration**: Each agent has access to relevant MCP tools
- **Cross-Agent Communication**: Orchestrator manages handoffs and dependencies