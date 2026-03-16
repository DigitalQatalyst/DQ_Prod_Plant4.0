## Assets/IoT Feature Area - Page Inventory

### Root Level Pages (`src/assets`)

| Page | File | Description |
|------|------|-------------|
| Assets Alerts | `AssetsAlerts.tsx` | Displays asset-related alerts using the AlertView component |
| Assets Dashboard | `AssetsDashboard.tsx` | Main dashboard showing asset health metrics, performance indicators, and connectivity status |

---

### Catalog (`/catalog`)
Asset type definitions and metadata configuration.

| Page | File | Description |
|------|------|-------------|
| Asset Catalog | `AssetCatalogPage.tsx` | Manage upstream O&G asset types organized by category: wells, process equipment, pipeline infrastructure, instrumentation, and electrical systems |
| Lifecycle Config | `LifecycleConfigPage.tsx` | Configure lifecycle states and transitions for wells, facilities, and pipelines (e.g., Planning → Active → Decommissioned) |
| Property Sets | `PropertySetsPage.tsx` | Define and manage property sets (metadata field collections) that can be applied to asset types |
| Sector Profiles | `SectorProfilesPage.tsx` | Sector-specific asset type profiles with pre-configured properties for different industry segments |

---

### Connectivity (`/connectivity`)
Industrial protocol connections and data streaming configuration.

| Page | File | Description |
|------|------|-------------|
| Connection Endpoints | `ConnectionEndpointsPage.tsx` | Manage industrial protocol endpoints (OPC-UA, Modbus TCP/RTU, HART) with connection parameters and status |
| Connection Health | `ConnectionHealthPage.tsx` | Monitor endpoint connectivity status with timeline visualization and health indicators |
| Sandbox Streams | `SandboxStreamsPage.tsx` | Configure simulated data streams for demo/testing environments with adjustable parameters |
| Stream Config | `StreamConfigPage.tsx` | Define data streaming profiles including polling intervals, retention policies, and buffering settings |
| Tag Mapping | `TagMappingPage.tsx` | Map telemetry tags from data sources to specific assets with bulk mapping capabilities |

---

### Detail (`/detail`)
Individual asset views.

| Page | File | Description |
|------|------|-------------|
| Asset Detail | `AssetDetailPage.tsx` | Asset 360° view with tabbed interface: Overview, Telemetry (live/historical), Relationships (hierarchy/connections), Documents, History (audit trail), and Compliance status |

---

### Discovery (`/discovery`)
Asset onboarding and registration workflows.

| Page | File | Description |
|------|------|-------------|
| Asset Import | `AssetImportPage.tsx` | Import assets from Excel/CSV files using a stepper workflow (upload → mapping → validation → import) |
| Bulk Discovery | `BulkDiscoveryPage.tsx` | Run discovery jobs across networks, fields, or pads to automatically detect assets |
| Discovery Agents | `DiscoveryAgentsPage.tsx` | Manage discovery agents (RTU collectors, OPC gateways, SCADA bridges) with deployment status |
| Discovery Review | `DiscoveryReviewPage.tsx` | Review, approve, reject, or merge candidate assets found during discovery |
| Manual Asset Capture | `ManualAssetCapturePage.tsx` | Manual asset creation form with field validation and asset type selection |

---

### Location (`/location`)
Geographic and topological asset views.

| Page | File | Description |
|------|------|-------------|
| Geo Location | `GeoLocationPage.tsx` | Geographic map view of fields and pads with coordinate display and spatial filtering |
| Linear Assets | `LinearAssetsPage.tsx` | Manage flowlines and pipeline segments with issue tracking (leaks, corrosion, integrity) |
| Mobile Assets | `MobileAssetsPage.tsx` | Track mobile assets (service trucks, portable equipment, mobile rigs) with location history |
| Network Topology | `NetworkTopologyPage.tsx` | Visualize network topology with adjacency tables and schematic diagrams showing asset relationships |

---

### Portfolio (`/portfolio`)
Portfolio-level views and management.

| Page | File | Description |
|------|------|-------------|
| Asset Portfolio | `AssetPortfolioPage.tsx` | Main portfolio overview with KPI cards, asset counts by type/status, and advanced filtering |
| Cross-Tenant Portfolio | `CrossTenantPortfolioPage.tsx` | Compare assets across multiple tenants/business units with aggregated metrics |
| Portfolio Explorer | `PortfolioExplorerPage.tsx` | Interactive explorer with multiple view modes: tree hierarchy, network graph, and map view |
| Saved Views | `SavedViewsPage.tsx` | Manage saved filter presets and custom views for quick access to common queries |

---

**Total: 24 pages** across 6 functional areas covering the complete asset lifecycle from discovery through ongoing monitoring and portfolio management.