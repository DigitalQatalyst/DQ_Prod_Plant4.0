# Design Document: Operational Excellence (Optimise) - Transmission

## Overview

This document describes the design for the Operational Excellence (Optimise) feature area for Power Transmission. The design encompasses three integrated feature sets that work together to provide comprehensive operational excellence capabilities:

1. **Lean Execution (SIM)** - Real-time shift management and operational control
2. **Continuous Improvement (CI)** - Structured problem-solving and improvement projects
3. **Optimisation (AI-powered)** - AI-driven opportunity identification and execution

### Design Principles

- **Supabase-First**: All data stored in Supabase with no global mock data
- **Tenant Isolation**: All queries filtered by tenant_id with RLS enforcement
- **Natural Keys**: Idempotent upserts using business natural keys
- **nLVE Pattern**: Navigate → List → View → Edit for all UI pages
- **Provider Pattern**: All data access through DataProvider interface
- **Transmission-Specific**: Tailored for transmission grid operations
- **Local Development Only**: All migrations and seeds run against local Supabase instance only, never remote databases

## Architecture

### Data Flow Architecture

```
User Interface (React Components)
         ↓
   useDataProvider Hook
         ↓
   HybridProvider (Sector-based routing)
         ↓                    ↓
   MockProvider         SupabaseProvider
   (Oil & Gas)          (Power Transmission)
         ↓                    ↓
   mockData.ts          Supabase Client
                             ↓
                    PostgreSQL Database (with RLS)
```

### Hybrid Provider Routing Logic

The HybridProvider determines which backend to use based on tenant sector:

```typescript
/**
 * Hybrid Provider Routing Strategy:
 * 
 * 1. Oil & Gas sector → MockProvider (uses mockData.ts)
 * 2. Power sector → Check if tenant ID is UUID
 *    - UUID (Supabase tenant) → SupabaseProvider
 *    - Non-UUID (mock tenant) → MockProvider (returns empty arrays)
 * 3. Other sectors → MockProvider
 */
private async getProviderForTenant(tenantId: string): Promise<DataProvider> {
  const tenant = await this.getTenantById(tenantId);
  
  if (tenant?.sector === 'oil-gas') {
    return this.mockProvider;
  }
  
  if (tenant?.sector === 'power') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
    return isUuid ? this.supabaseProvider : this.mockProvider;
  }
  
  return this.mockProvider;
}
```

### Tenant List Hybrid Strategy

The tenant list merges data from both providers:

```typescript
async getTenants(): Promise<Tenant[]> {
  // Get Power Transmission tenants from Supabase
  const transmissionTenants = await this.supabaseProvider.getTransmissionTenants();
  
  // Get all other tenants from MockProvider
  const mockTenants = await this.mockProvider.getTenants();
  
  // Filter out power sector tenants from mocks to avoid duplicates
  const nonPowerMockTenants = mockTenants.filter(t => t.sector !== 'power');
  
  // Convert transmission tenants to Tenant format
  const powerTenants: Tenant[] = transmissionTenants.map(t => ({
    id: t.id,
    name: t.name,
    industry: 'Power & Utilities',
    sector: t.sector,
    subsector: t.subsector
  }));
  
  // Merge and return
  return [...powerTenants, ...nonPowerMockTenants];
}
```

### Component Architecture

```
Feature Area: Optimise
├── Performance (existing - analytical workspace)
├── Lean Execution (SIM)
│   ├── SIM Boards (operational dashboard)
│   ├── Shift Performance (shift summary)
│   ├── Issues (issue tracking)
│   └── Actions (action management)
├── Continuous Improvement (CI)
│   ├── CI Projects (kanban pipeline)
│   ├── RCA (root cause analysis)
│   ├── Countermeasures (action tracking)
│   ├── Impact Tracking (KPI measurement)
│   └── CI Reports (reporting)
└── Optimisation (AI-powered)
    ├── Opportunities (ranked inbox)
    ├── Recommendations (AI suggestions)
    ├── Playbooks (templates)
    ├── Simulations (scenario testing)
    └── Execution (publish to SIM/CI)
```

## Data Models

### Entity Relationship Overview

```
Tenants (existing)
  ↓
Sites (existing)
  ↓
Assets, Grid Nodes, Grid Lines (existing)
  ↓
┌─────────────────┬──────────────────┬────────────────────┐
│                 │                  │                    │
SIM Schema        CI Schema          Optimisation Schema
│                 │                  │
├─ sim_shifts     ├─ ci_stages      ├─ opt_opportunities
├─ sim_boards     ├─ ci_projects    ├─ opt_recommendations
├─ sim_kpis       ├─ ci_project_    ├─ opt_playbooks
├─ switching_     │   links         ├─ opt_opportunity_
│   orders        ├─ ci_rca         │   playbooks
├─ switching_     ├─ ci_counter     ├─ opt_simulations
│   order_        │   measures      └─ opt_publish_
│   impacts       ├─ ci_kpis        events
├─ outages        ├─ ci_kpi_links
├─ outage_        ├─ ci_impacts
│   impacts       └─ ci_documents
├─ sim_issues
├─ sim_actions
└─ sim_action_
    links
```


### SIM Schema (Lean Execution)

#### sim_shifts
```sql
CREATE TABLE sim_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  site_id UUID REFERENCES sites(id),
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  shift_name TEXT NOT NULL, -- 'day', 'evening', 'night'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, site_id, shift_start)
);
```

**Natural Key**: (tenant_id, site_id, shift_start)

#### sim_boards
```sql
CREATE TABLE sim_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  board_date DATE NOT NULL,
  site_id UUID REFERENCES sites(id),
  shift_id UUID REFERENCES sim_shifts(id),
  board_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('on-track', 'at-risk', 'behind')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, board_date, site_id, shift_id)
);
```

**Natural Key**: (tenant_id, board_date, site_id, shift_id)

#### sim_kpis
```sql
CREATE TABLE sim_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  board_id UUID NOT NULL REFERENCES sim_boards(id) ON DELETE CASCADE,
  kpi_code TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  target_value DOUBLE PRECISION,
  actual_value DOUBLE PRECISION,
  unit TEXT,
  status TEXT CHECK (status IN ('good', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, board_id, kpi_code)
);
```

**Natural Key**: (tenant_id, board_id, kpi_code)

#### switching_orders
```sql
CREATE TABLE switching_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  order_no TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'cancelled')),
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  assigned_owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, order_no)
);
```

**Natural Key**: (tenant_id, order_no)

#### switching_order_impacts
```sql
CREATE TABLE switching_order_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES switching_orders(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  asset_id UUID REFERENCES assets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);
```

**Constraint**: At least one of node_id, line_id, or asset_id must be specified

#### outages
```sql
CREATE TABLE outages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  outage_ref TEXT NOT NULL,
  outage_type TEXT CHECK (outage_type IN ('planned', 'unplanned')),
  status TEXT CHECK (status IN ('scheduled', 'active', 'resolved')),
  start_time TIMESTAMPTZ NOT NULL,
  estimated_restoration TIMESTAMPTZ,
  actual_restoration TIMESTAMPTZ,
  impact_level TEXT CHECK (impact_level IN ('high', 'medium', 'low')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, outage_ref)
);
```

**Natural Key**: (tenant_id, outage_ref)

#### outage_impacts
```sql
CREATE TABLE outage_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outage_id UUID NOT NULL REFERENCES outages(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  asset_id UUID REFERENCES assets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);
```

**Constraint**: At least one of node_id, line_id, or asset_id must be specified

#### sim_issues
```sql
CREATE TABLE sim_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  issue_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('open', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, issue_ref)
);
```

**Natural Key**: (tenant_id, issue_ref)

#### sim_actions
```sql
CREATE TABLE sim_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  action_ref TEXT NOT NULL,
  description TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, action_ref)
);
```

**Natural Key**: (tenant_id, action_ref)

#### sim_action_links
```sql
CREATE TABLE sim_action_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES sim_actions(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES sim_issues(id),
  order_id UUID REFERENCES switching_orders(id),
  outage_id UUID REFERENCES outages(id),
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  asset_id UUID REFERENCES assets(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (
    (issue_id IS NOT NULL)::int + 
    (order_id IS NOT NULL)::int + 
    (outage_id IS NOT NULL)::int + 
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);
```

**Constraint**: At least one link target must be specified


### CI Schema (Continuous Improvement)

#### ci_stages
```sql
CREATE TABLE ci_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);
```

**Natural Key**: (tenant_id, code)
**Stages**: Backlog, Analysis, Countermeasures, Implementation, Verification, Closed

#### ci_projects
```sql
CREATE TABLE ci_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  stage_id UUID NOT NULL REFERENCES ci_stages(id),
  site_id UUID REFERENCES sites(id),
  owner TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('active', 'on-hold', 'completed', 'cancelled')),
  start_date DATE,
  due_date DATE,
  summary TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, project_ref)
);
```

**Natural Key**: (tenant_id, project_ref)

#### ci_project_links
```sql
CREATE TABLE ci_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  alert_id UUID REFERENCES alerts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### ci_rca
```sql
CREATE TABLE ci_rca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  rca_type TEXT NOT NULL, -- '5-whys', 'fishbone', 'fault-tree'
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, rca_type)
);
```

**Natural Key**: (project_id, rca_type)

#### ci_countermeasures
```sql
CREATE TABLE ci_countermeasures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  cm_ref TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  status TEXT CHECK (status IN ('planned', 'in-progress', 'completed', 'verified')),
  due_date DATE,
  summary TEXT NOT NULL,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, cm_ref)
);
```

**Natural Key**: (tenant_id, cm_ref)

#### ci_kpis
```sql
CREATE TABLE ci_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  kpi_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, kpi_code)
);
```

**Natural Key**: (tenant_id, kpi_code)

#### ci_kpi_links
```sql
CREATE TABLE ci_kpi_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES ci_kpis(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, kpi_id)
);
```

#### ci_impacts
```sql
CREATE TABLE ci_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES ci_kpis(id) ON DELETE CASCADE,
  baseline DOUBLE PRECISION,
  target DOUBLE PRECISION,
  actual DOUBLE PRECISION,
  impact_value DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, kpi_id)
);
```

#### ci_documents
```sql
CREATE TABLE ci_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  doc_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  doc_type TEXT CHECK (doc_type IN ('report', 'analysis', 'procedure', 'photo', 'diagram', 'other')),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, doc_ref)
);
```

**Natural Key**: (project_id, doc_ref)


### Optimisation Schema (AI-powered)

#### opt_opportunities
```sql
CREATE TABLE opt_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  opp_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  site_id UUID REFERENCES sites(id),
  status TEXT CHECK (status IN ('new', 'under-review', 'approved', 'published', 'rejected')),
  rank_score DOUBLE PRECISION CHECK (rank_score >= 0 AND rank_score <= 100),
  expected_impact TEXT,
  confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 100),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, opp_ref)
);
```

**Natural Key**: (tenant_id, opp_ref)

#### opt_recommendations
```sql
CREATE TABLE opt_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rec_ref TEXT NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 100),
  expected_benefit TEXT,
  assumptions JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, rec_ref)
);
```

**Natural Key**: (tenant_id, rec_ref)

#### opt_playbooks
```sql
CREATE TABLE opt_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);
```

**Natural Key**: (tenant_id, code)

#### opt_opportunity_playbooks
```sql
CREATE TABLE opt_opportunity_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES opt_playbooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opportunity_id, playbook_id)
);
```

#### opt_simulations
```sql
CREATE TABLE opt_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sim_ref TEXT NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  comparison JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, sim_ref)
);
```

**Natural Key**: (tenant_id, sim_ref)

#### opt_publish_events
```sql
CREATE TABLE opt_publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_ref TEXT NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('SIM', 'CI')),
  target_id UUID, -- nullable for audit purposes
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, event_ref)
);
```

**Natural Key**: (tenant_id, event_ref)

## Supabase Query Contracts

### SIM Provider Methods

```typescript
// Get SIM boards with filters
getSimBoards(
  tenantId: string, 
  filters?: { siteId?: string; dateFrom?: string; dateTo?: string; status?: string },
  paging?: { limit?: number; offset?: number }
): Promise<SIMBoard[]>

// Get single SIM board by ID
getSimBoardById(boardId: string): Promise<SIMBoard | null>

// Get KPIs for a board
getSimKpis(boardId: string): Promise<KPIMetric[]>

// List switching orders
listSwitchingOrders(
  tenantId: string,
  filters?: { siteId?: string; status?: string; priority?: string; dateFrom?: string; dateTo?: string },
  paging?: { limit?: number; offset?: number }
): Promise<SwitchingOrder[]>

// Get single switching order
getSwitchingOrder(orderId: string): Promise<SwitchingOrder | null>

// Create switching order
createSwitchingOrder(payload: CreateSwitchingOrderRequest): Promise<SwitchingOrder>

// Update switching order
updateSwitchingOrder(orderId: string, patch: UpdateSwitchingOrderRequest): Promise<SwitchingOrder>

// List outages
listOutages(
  tenantId: string,
  filters?: { siteId?: string; status?: string; type?: string; dateFrom?: string; dateTo?: string },
  paging?: { limit?: number; offset?: number }
): Promise<Outage[]>

// Get single outage
getOutage(outageId: string): Promise<Outage | null>

// Create outage
createOutage(payload: CreateOutageRequest): Promise<Outage>

// Update outage
updateOutage(outageId: string, patch: UpdateOutageRequest): Promise<Outage>

// List SIM issues
listSimIssues(
  tenantId: string,
  filters?: { boardId?: string; status?: string; priority?: string },
  paging?: { limit?: number; offset?: number }
): Promise<Issue[]>

// Create SIM issue
createSimIssue(payload: CreateSimIssueRequest): Promise<Issue>

// Update SIM issue
updateSimIssue(id: string, patch: UpdateSimIssueRequest): Promise<Issue>

// List SIM actions
listSimActions(
  tenantId: string,
  filters?: { issueId?: string; status?: string; owner?: string },
  paging?: { limit?: number; offset?: number }
): Promise<ShiftAction[]>

// Create SIM action
createSimAction(payload: CreateSimActionRequest): Promise<ShiftAction>

// Update SIM action
updateSimAction(id: string, patch: UpdateSimActionRequest): Promise<ShiftAction>
```


### CI Provider Methods

```typescript
// Get CI stages
getCiStages(tenantId: string): Promise<CIStage[]>

// List CI projects
listCiProjects(
  tenantId: string,
  filters?: { stageId?: string; siteId?: string; owner?: string; priority?: string; status?: string },
  paging?: { limit?: number; offset?: number }
): Promise<CIProject[]>

// Get single CI project
getCiProject(projectId: string): Promise<CIProject | null>

// Create CI project
createCiProject(payload: CreateCIProjectRequest): Promise<CIProject>

// Update CI project
updateCiProject(projectId: string, patch: UpdateCIProjectRequest): Promise<CIProject>

// Move CI project to different stage
moveCiProjectStage(projectId: string, stageId: string): Promise<CIProject>

// Get RCA for project
getCiProjectRca(projectId: string): Promise<RootCauseAnalysis[]>

// Upsert RCA for project
upsertCiProjectRca(projectId: string, payload: UpsertRCARequest): Promise<RootCauseAnalysis>

// List countermeasures for project
listCiCountermeasures(projectId: string): Promise<Countermeasure[]>

// Create countermeasure
createCiCountermeasure(payload: CreateCountermeasureRequest): Promise<Countermeasure>

// Update countermeasure
updateCiCountermeasure(id: string, patch: UpdateCountermeasureRequest): Promise<Countermeasure>

// List KPIs for project
listCiProjectKpis(projectId: string): Promise<CIProjectKPI[]>

// Upsert impact measurement
upsertCiImpact(projectId: string, payload: UpsertImpactRequest): Promise<CIImpact>

// List documents for project
listCiDocuments(projectId: string): Promise<CIDocument[]>

// Create document metadata
createCiDocument(payload: CreateCIDocumentRequest): Promise<CIDocument>
```

### Optimisation Provider Methods

```typescript
// List opportunities
listOpportunities(
  tenantId: string,
  filters?: { siteId?: string; category?: string; status?: string; confidenceMin?: number },
  paging?: { limit?: number; offset?: number }
): Promise<OptimisationOpportunity[]>

// Get single opportunity
getOpportunity(oppId: string): Promise<OptimisationOpportunity | null>

// Update opportunity
updateOpportunity(oppId: string, patch: UpdateOpportunityRequest): Promise<OptimisationOpportunity>

// List recommendations for opportunity
listRecommendations(oppId: string): Promise<AIRecommendation[]>

// Create simulation
createSimulation(oppId: string, payload: CreateSimulationRequest): Promise<OptimisationSimulation>

// List simulations for opportunity
listSimulations(oppId: string): Promise<OptimisationSimulation[]>

// List playbooks
listPlaybooks(tenantId: string): Promise<OptimisationPlaybook[]>

// Link playbook to opportunity
linkPlaybookToOpportunity(oppId: string, playbookId: string): Promise<void>

// Publish opportunity to SIM (creates switching order)
publishOpportunityToSim(oppId: string, payload: PublishToSimRequest): Promise<PublishEvent>

// Publish opportunity to CI (creates CI project)
publishOpportunityToCi(oppId: string, payload: PublishToCiRequest): Promise<PublishEvent>
```

## TypeScript Type Definitions

### SIM Types

```typescript
export interface SIMBoard {
  id: string;
  tenantId: string;
  boardDate: string;
  siteId?: string;
  shiftId?: string;
  boardName: string;
  status: 'on-track' | 'at-risk' | 'behind';
  createdAt: string;
  updatedAt: string;
  // Joined data
  site?: Site;
  shift?: Shift;
  kpis?: KPIMetric[];
}

export interface SwitchingOrder {
  id: string;
  tenantId: string;
  orderNo: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  assignedOwner?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  impacts?: SwitchingOrderImpact[];
}

export interface Outage {
  id: string;
  tenantId: string;
  outageRef: string;
  outageType: 'planned' | 'unplanned';
  status: 'scheduled' | 'active' | 'resolved';
  startTime: string;
  estimatedRestoration?: string;
  actualRestoration?: string;
  impactLevel: 'high' | 'medium' | 'low';
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  impacts?: OutageImpact[];
}
```

### CI Types

```typescript
export interface CIProject {
  id: string;
  tenantId: string;
  projectRef: string;
  title: string;
  stageId: string;
  siteId?: string;
  owner: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate?: string;
  dueDate?: string;
  summary?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Joined data
  stage?: CIStage;
  site?: Site;
  rca?: RootCauseAnalysis[];
  countermeasures?: Countermeasure[];
  kpis?: CIProjectKPI[];
  documents?: CIDocument[];
}

export interface RootCauseAnalysis {
  id: string;
  projectId: string;
  rcaType: string;
  content: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Countermeasure {
  id: string;
  tenantId: string;
  cmRef: string;
  projectId: string;
  owner: string;
  status: 'planned' | 'in-progress' | 'completed' | 'verified';
  dueDate?: string;
  summary: string;
  effectivenessScore?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Optimisation Types

```typescript
export interface OptimisationOpportunity {
  id: string;
  tenantId: string;
  oppRef: string;
  title: string;
  category: string;
  siteId?: string;
  status: 'new' | 'under-review' | 'approved' | 'published' | 'rejected';
  rankScore: number;
  expectedImpact?: string;
  confidence: number;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  site?: Site;
  recommendations?: AIRecommendation[];
  playbooks?: OptimisationPlaybook[];
  simulations?: OptimisationSimulation[];
}

export interface AIRecommendation {
  id: string;
  tenantId: string;
  recRef: string;
  opportunityId: string;
  text: string;
  confidence: number;
  expectedBenefit?: string;
  assumptions?: Record<string, any>;
  risks?: Record<string, any>;
  createdAt: string;
}

export interface OptimisationPlaybook {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  steps?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
```


## UI Design Patterns (nLVE)

### Navigate → List → View → Edit Pattern

All Operational Excellence pages follow the nLVE pattern established in the existing codebase:

1. **Navigate**: Feature area navigation in left sidebar
2. **List**: Left pane with searchable/filterable list
3. **View**: Right pane with tabbed analytical workspace
4. **Edit**: Modals/forms for create/update operations

### Page Structure Examples

#### SIM Boards Page

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation: Optimise > Lean Execution > SIM Boards         │
├──────────────────┬──────────────────────────────────────────┤
│ LIST PANE        │ VIEW PANE                                │
│                  │                                          │
│ [Search...]      │ Dubai Main - Day Shift - 2024-01-28    │
│                  │ ┌──────────────────────────────────────┐│
│ ☑ Dubai Main     │ │ Board KPIs │ Switching │ Outages │  ││
│   Day Shift      │ └──────────────────────────────────────┘│
│   2024-01-28     │                                          │
│   Status: On-Tr  │ [KPI Grid with 6 tiles]                 │
│                  │                                          │
│ □ Jebel Ali      │ [Switching Orders Table]                │
│   Evening Shift  │                                          │
│   2024-01-28     │ [Outages Table]                         │
│   Status: At-Ris │                                          │
│                  │ [Issues & Actions]                      │
│ □ Al Aweer       │                                          │
│   Night Shift    │                                          │
│   2024-01-27     │                                          │
│                  │                                          │
│ [+ New Board]    │ [Export] [AI Assist]                    │
└──────────────────┴──────────────────────────────────────────┘
```

#### CI Projects Page (Kanban View)

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation: Optimise > Continuous Improvement > Projects    │
├──────────────────┬──────────────────────────────────────────┤
│ FILTERS          │ KANBAN VIEW                              │
│                  │                                          │
│ Owner: [All]     │ ┌────┬────┬────┬────┬────┬────┐        │
│ Priority: [All]  │ │Back│Anal│Coun│Impl│Veri│Clos│        │
│ Site: [All]      │ │log │ysis│term│emen│fica│ed  │        │
│                  │ │    │    │easu│tati│tion│    │        │
│ [+ New Project]  │ │    │    │res │on  │    │    │        │
│                  │ ├────┼────┼────┼────┼────┼────┤        │
│                  │ │[P1]│[P3]│[P5]│[P7]│[P9]│[P11│        │
│                  │ │[P2]│[P4]│[P6]│[P8]│[P10│[P12│        │
│                  │ │    │    │    │    │    │    │        │
│                  │ └────┴────┴────┴────┴────┴────┘        │
│                  │                                          │
│                  │ Selected: Relay Misoperation Reduction  │
│                  │ ┌──────────────────────────────────────┐│
│                  │ │ Overview │ RCA │ Countermeasures │  ││
│                  │ └──────────────────────────────────────┘│
│                  │                                          │
│                  │ [Project Details]                       │
└──────────────────┴──────────────────────────────────────────┘
```

#### Optimisation Opportunities Page

```
┌─────────────────────────────────────────────────────────────┐
│ Navigation: Optimise > Optimisation > Opportunities         │
├──────────────────┬──────────────────────────────────────────┤
│ LIST PANE        │ VIEW PANE                                │
│                  │                                          │
│ [Search...]      │ Transformer Loading Optimization        │
│                  │ ┌──────────────────────────────────────┐│
│ Filters:         │ │ Summary │ Data │ Recommendations │  ││
│ ☑ High Conf      │ └──────────────────────────────────────┘│
│ ☐ Medium Conf    │                                          │
│ ☐ Low Conf       │ Rank: #1 | Confidence: 92%             │
│                  │ Expected Impact: 15% loss reduction     │
│ ☑ OPP-001        │                                          │
│   Transformer    │ [Impact Assessment Cards]               │
│   Loading        │                                          │
│   Rank: 1        │ [AI Recommendations List]               │
│   Conf: 92%      │                                          │
│                  │ [Linked Playbooks]                      │
│ □ OPP-002        │                                          │
│   Voltage        │ [Simulation Results]                    │
│   Management     │                                          │
│   Rank: 2        │                                          │
│   Conf: 87%      │                                          │
│                  │                                          │
│ [+ New Opp]      │ [Publish to SIM] [Publish to CI]       │
└──────────────────┴──────────────────────────────────────────┘
```

### Component Reuse

The design leverages existing shared components:

- **ErrorAwareListPane**: Left pane with search, filters, loading/error states
- **ErrorAwareWorkPane**: Right pane with tabs, actions, loading/error states
- **KPICard**: Metric display cards with trends
- **StatusBadge**: Status indicators
- **DataTable**: Sortable/filterable tables
- **EmptyStates**: No data, error, and loading states
- **ErrorBoundary**: React error boundaries

### Modal Patterns

Create/Edit operations use modal dialogs:

- **CreateSwitchingOrderModal**: Form for new switching orders
- **CreateOutageModal**: Form for new outages
- **CreateCIProjectModal**: Form for new CI projects
- **CreateSimulationModal**: Form for new simulations
- **PublishToSimModal**: Confirmation and details for publishing to SIM
- **PublishToCiModal**: Confirmation and details for publishing to CI

## Row Level Security (RLS) Strategy

### RLS Policy Pattern

All Operational Excellence tables follow the same RLS pattern:

```sql
-- Enable RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view <table> for their tenant" ON <table_name>
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- INSERT policy
CREATE POLICY "Users can insert <table> for their tenant" ON <table_name>
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- UPDATE policy
CREATE POLICY "Users can update <table> for their tenant" ON <table_name>
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- DELETE policy
CREATE POLICY "Users can delete <table> for their tenant" ON <table_name>
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Tenant Context Setting

The application sets tenant context before queries:

```typescript
// In SupabaseProvider
private async setTenantContext(tenantId: string): Promise<void> {
  await this.supabase.rpc('set_config', {
    setting: 'app.current_tenant_id',
    value: tenantId,
    is_local: true
  });
}
```

### Query Filtering

All queries explicitly filter by tenant_id as defense-in-depth:

```typescript
// Example query with tenant filtering
const { data, error } = await this.supabase
  .from('sim_boards')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('board_date', { ascending: false });
```

## Error Handling and Loading States

### Error Handling Strategy

1. **Provider Level**: Catch and wrap Supabase errors
2. **Component Level**: Use ErrorBoundary for React errors
3. **UI Level**: Display user-friendly error messages

```typescript
// Provider error handling
try {
  const { data, error } = await this.supabase
    .from('sim_boards')
    .select('*')
    .eq('tenant_id', tenantId);
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Failed to fetch SIM boards:', error);
  throw new Error('Unable to load SIM boards. Please try again.');
}
```

### Loading State Pattern

```typescript
// Component loading state
const { data: boards, isLoading, error } = useQuery({
  queryKey: ['sim-boards', tenantId],
  queryFn: () => provider.getSimBoards(tenantId)
});

if (isLoading) return <LoadingState />;
if (error) return <EmptyStates.Error title="Failed to load boards" />;
if (!boards || boards.length === 0) return <EmptyStates.NoData />;
```

## Performance Considerations

### Query Optimization

1. **Indexes**: All foreign keys and filter columns indexed
2. **Joins**: Use Supabase's select syntax for efficient joins
3. **Pagination**: Implement limit/offset for large datasets
4. **Caching**: Use React Query for client-side caching

### Example Optimized Query

```typescript
// Efficient join query
const { data, error } = await this.supabase
  .from('sim_boards')
  .select(`
    *,
    site:sites(id, name),
    shift:sim_shifts(id, shift_name),
    kpis:sim_kpis(*)
  `)
  .eq('tenant_id', tenantId)
  .order('board_date', { ascending: false })
  .limit(50);
```

### Pagination Pattern

```typescript
// Paginated query
const { data, error, count } = await this.supabase
  .from('ci_projects')
  .select('*', { count: 'exact' })
  .eq('tenant_id', tenantId)
  .range(offset, offset + limit - 1);
```

## Integration Points

### SIM ↔ CI Integration

Opportunities can be published to CI as projects:

```typescript
// Publish opportunity to CI
async publishOpportunityToCi(oppId: string, payload: PublishToCiRequest): Promise<PublishEvent> {
  // 1. Create CI project
  const project = await this.createCiProject({
    tenantId: payload.tenantId,
    projectRef: `OPP-${oppId}-CI`,
    title: payload.title,
    stageId: payload.stageId,
    owner: payload.owner,
    priority: payload.priority,
    summary: payload.summary
  });
  
  // 2. Record publish event
  const event = await this.createPublishEvent({
    tenantId: payload.tenantId,
    eventRef: `PUB-${Date.now()}`,
    opportunityId: oppId,
    targetType: 'CI',
    targetId: project.id,
    payload: { projectRef: project.projectRef }
  });
  
  return event;
}
```

### SIM ↔ Optimisation Integration

Opportunities can be published to SIM as switching orders:

```typescript
// Publish opportunity to SIM
async publishOpportunityToSim(oppId: string, payload: PublishToSimRequest): Promise<PublishEvent> {
  // 1. Create switching order
  const order = await this.createSwitchingOrder({
    tenantId: payload.tenantId,
    orderNo: `OPP-${oppId}-SW`,
    description: payload.description,
    priority: payload.priority,
    plannedStart: payload.plannedStart,
    plannedEnd: payload.plannedEnd,
    assignedOwner: payload.assignedOwner
  });
  
  // 2. Record publish event
  const event = await this.createPublishEvent({
    tenantId: payload.tenantId,
    eventRef: `PUB-${Date.now()}`,
    opportunityId: oppId,
    targetType: 'SIM',
    targetId: order.id,
    payload: { orderNo: order.orderNo }
  });
  
  return event;
}
```

## Testing Strategy

### Unit Tests

- Test provider methods with mocked Supabase client
- Test component rendering with mocked data
- Test form validation logic

### Integration Tests

- Test full data flow from UI to database
- Test tenant isolation
- Test RLS policies

### Property-Based Tests

Not applicable for this feature (primarily CRUD operations and UI).

## Migration and Deployment

### Local Development Only

**CRITICAL**: All migrations and seeds must ONLY be run against the local Supabase instance. Never run these against remote (staging or production) databases.

**Local Database Connection**:
- Use `.env.development` or `.env.local` for local Supabase connection
- Verify you're connected to `localhost` or `127.0.0.1` before running migrations
- Use `npx supabase status` to confirm local instance is running
- Use `npx supabase db reset --local` to reset local database

### Migration Order

1. Run SIM migrations (013_create_sim_tables.sql) - **LOCAL ONLY**
2. Run CI migrations (014_create_ci_tables.sql) - **LOCAL ONLY**
3. Run Optimisation migrations (015_create_optimisation_tables.sql) - **LOCAL ONLY**
4. Run seed files in order - **LOCAL ONLY**:
   - 008_sim_seed.sql
   - 009_ci_seed.sql
   - 010_optimisation_seed.sql

### Rollback Strategy

Each migration includes DROP statements at the top (commented out) for manual rollback if needed.

### Verification Queries

```sql
-- Verify SIM tables
SELECT COUNT(*) FROM sim_boards WHERE tenant_id = '<tenant_id>';
SELECT COUNT(*) FROM switching_orders WHERE tenant_id = '<tenant_id>';
SELECT COUNT(*) FROM outages WHERE tenant_id = '<tenant_id>';

-- Verify CI tables
SELECT COUNT(*) FROM ci_projects WHERE tenant_id = '<tenant_id>';
SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = '<tenant_id>';

-- Verify Optimisation tables
SELECT COUNT(*) FROM opt_opportunities WHERE tenant_id = '<tenant_id>';
SELECT COUNT(*) FROM opt_recommendations WHERE tenant_id = '<tenant_id>';
```

