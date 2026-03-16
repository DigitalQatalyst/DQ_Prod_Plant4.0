# Feature Specifications – Asset/IoT Feature Area:

# Refinement Report

## 1. Executive Summary

### Overall finding

Your existing **5 feature sets** for Assets/IoT are **strongly cross-sector** :

- Every sector needs: discovery, onboarding, portfolio views, asset types,
    connectivity, and 360° asset context.
- The core concepts (assets, tags, connections, types, lifecycle) generalize well
    across **Mining, O&G, Water, Power, FMCG**.

### Main gaps (repeated across sectors)

1. **Location, topology & linear assets**
    a. Pipelines (Oil & Gas), transmission lines (Power), water networks, conveyor
       lines (Mining), production lines (FMCG), mobile fleets.
    b. Need first-class support for **spatial** , **network** , and **linear** assets.
2. **Sector-specific compliance & safety context**
    a. Hazardous areas (O&G, Chemicals), NERC CIP (Power), water quality
       regulations, food-grade constraints (FMCG), mine safety zones.
3. **Mobile & distributed assets**
    a. Mining fleets, remote boreholes & lift stations (Water), remote substations,
       field meters.
4. **Integration context**
    a. GIS (Water, Mining, O&G pipelines), EMS/SCADA (Power), MES (FMCG), Mine
       planning, LIMS, etc.

### Key refinement

- **Keep Feature Sets 1– 5** (Discovery, Portfolio, Catalog, Connectivity, Asset Detail).
- **Add Feature Set 6: Location, Topology & Linear Assets.**
- Within each existing feature set, add:


```
 Flexible property sets and configurable hierarchies.
 Sector-specific templates (asset types, property sets, protocols, compliance
attributes).
 Hooks for GIS / MES / EMS / planning tools.
```
## 2. Cross-Sector Validation Matrix (Condensed)

Legend:

✅ Fully Applicable ⚠️ Needs Adaptation ➕ Enhancement Needed

### Feature Set 1: Discovery & Onboarding

```
Feature Mining O&G Water Power FMCG
```
```
Cross-Sector
Compatibility
```
```
Required
Adjustments
```
```
Bulk
Discovery
```
```
Works
everywhere for
IP/network-based
discovery.
```
```
Add non-
IP/mobile &
GIS-driven
discovery
later.
```
```
Agent
Discovery
```
```
Shared pattern
for
gateways/agents.
```
```
Sector
templates for
edge profiles
(protocols,
hardening).
```
```
Manual
Asset
Capture
```
```
Universal need
for manual
onboarding.
```
```
Add mobile,
linear,
hazardous-
area fields.
```
```
Import
from File
```
```
All sectors need
bulk import from
CSV/Excel.
```
```
Sector-
specific
templates &
validation.
Discovery
Review &
Approval
```
```
All sectors need
governance on
```
```
Add rules per
sector (e.g.,
safety
```

```
discovered
assets.
```
```
classification,
criticality).
```
### Feature Set 2: Portfolio Management

```
Feature Minin
g
```
#### O&

#### G

```
Wate
r
```
```
Powe
r
```
#### FMC

#### G

```
Cross-Sector
Compatibility
```
```
Required
Adjustments
Asset
Portfolio
Overvie
w
```
```
KPIs by type/status
are universal.
```
```
Add domain
KPIs (e.g., wells,
feeders, lines).
```
```
Portfolio
Explorer
```
```
Tree works; but
many assets are
networks/linear/mob
ile.
```
```
Add
network/linear/g
eo views (new
Feature Set 6).
Saved
Views &
Segmen
ts
```
```
All sectors need
segments (critical
assets, lines, etc.)
```
```
Add sector-
specific presets
(e.g. “Critical
Feeders”).
```
```
Cross-
Tenant
Portfolio
```
```
Valuable for
vendor/advisor
personas.
```
```
Tenant/sector
filters & masking
for
confidentiality.
```
### Feature Set 3: Asset Catalog & Types

```
Featur
e
```
```
Mini
ng
```
#### O&

#### G

```
Wat
er
```
```
Pow
er
```
#### FMC

#### G

```
Cross-Sector
Compatibility
```
```
Required
Adjustments
```
```
Asset
Type
Library
```
```
Core abstraction works
for all sectors.
```
```
Sector-specific
type libraries &
grouping
(fixed/mobile/li
near).
Templa
tes &
Propert
y Sets
```
```
Key for cross-sector
reuse.
```
```
Prebuilt
property sets
per sector
(electrical,
```

```
process, food
safety, etc.).
```
```
Lifecycl
e
States
```
```
Draft/Active/Maintenance
/Retired works
everywhere.
```
```
Allow sector-
specific extra
states (e.g.,
Mothballed,
Standby).
```
```
Industr
y &
Sector
Profiles
```
```
Exactly what you need for
multicategory platform.
```
```
Ensure multi-
tagging (asset
might span
sectors in
multi-utility
orgs).
```
### Feature Set 4: Connectivity & Data Points

```
Feature Minin
g
```
#### O&

#### G

```
Wate
r
```
```
Powe
r
```
#### FMC

#### G

```
Cross-Sector
Compatibility
```
```
Required
Adjustments
```
```
Tag/Data
Point
Mapping
```
```
Core of IoT/OT
integration.
```
```
Add protocol-
aware mapping
(HART, FF,
DNP3, IEC
61850).
```
```
Connection
Endpoints
```
```
Universal
concept.
```
```
Extra metadata
for hazardous
area / secure
zones.
```
```
Stream
Configurati
on
```
```
Needed
everywhere to
manage
volume/frequen
cy.
```
```
Sector presets
(e.g., high-speed
FMCG vs slow
infra).
```
```
Connection
Health
Monitor
```
```
All sectors rely
on connection
uptime.
```
```
Add
geography/netw
ork dimension
for context.
Sandbox
Streams
```
```
Useful for
demos, testing
```
```
Sector-flavored
demo profiles.
```

```
across all
sectors.
```
### Feature Set 5: Asset Detail & Context

```
Feature Minin
g
```
#### O&

#### G

```
Wate
r
```
```
Pow
er
```
#### FMC

#### G

```
Cross-
Sector
Compatibili
ty
```
```
Required
Adjustments
```
```
Asset 360
View
```
```
Essential
everywhere.
```
```
Add compliance &
risk tabs per sector.
```
```
Topology &
Relationshi
ps
```
```
Works for
parent/child
;
linear/netwo
rk needs
more.
```
```
Integrate with new
Location/Topology
feature set.
```
```
Document
& Media
Attachment
s
```
```
Manuals,
certs,
drawings
etc.
```
```
Sector templates for
document types
(ASME/API/HACCP/e
tc.).
```
```
Responsibil
ity &
Ownership
```
```
All sectors
need
accountabili
ty chains.
```
```
Support multiple
owners (operations +
maintenance +
vendor).
```
```
Change Log
(Audit)
```
```
Universally
needed for
governance
and
compliance.
```
```
Tie into global
audit/security
modules.
```
### New Feature Set 6: Location, Topology & Linear Assets (proposed)

```
Feature
Category
```
```
Mining O&G Water Power FMCG Cross-Sector
Compatibility
Geo & Network
Location (GIS
hooks)
```
```
Critical for Mining, O&G,
Water, Power; useful but
less critical for FMCG.
```

```
Linear Assets
(pipelines,
lines, belts)
```
```
Linear semantics needed for
conveyors, pipelines,
feeders, trunk mains.
Mobile Asset
Tracking (GPS,
zones)
```
```
Core for Mining/O&G field;
secondary but valuable
elsewhere.
```
## 3. Refined Feature Sets (what changes)

### Feature Set 1: Discovery & Onboarding (Refined)

**Generalization Strategy**

- Keep all 5 existing features.
- Ensure **discovery jobs** can be:
     Network-based (IP ranges, gateways).
     **Topology-based** (segments of a pipeline/feeder).
     **Location-based** (geo area, zone, or facility).
- Allow agent types by sector (Mine Gateway, Pipeline RTU Gateway, WTP SCADA
    Gateway, Substation IED Gateway, Line PLC Gateway, etc.).

**Key Refinements**

- **Bulk Discovery**
     Add **“discovery scope type”** : Network / Location / Topology segment /
       Mobile fleet.
     For Mining & O&G: enable tagging discovered devices as “mobile” or “linear
       segment node.”
- **Manual Asset Capture**
     Extend form with optional:
        Geo-coordinates / network node ID.
        Hazardous area classification (O&G).
        Food-grade contact (FMCG).
- **Import from File**
     Provide **sector-specific templates** (Mining mobile fleet; Water network
       assets; Power substations; FMCG lines).


- **Discovery Review & Approval**
     Allow rules like:
        Auto-assign to site/line based on network segment or geo location.
        Auto-flag criticality if asset type & sector match patterns.

**Priority** : 🔴 MVP core + 🟡 sector templates in Phase 2.

### Feature Set 2: Portfolio Management (Refined)

**Generalization Strategy**

- Treat the current tree explorer as **one of several views** : Tree, Network, Map, Line.
- Add cross-sector portfolio KPIs (e.g., asset count by criticality, by compliance
    status).

**Key Refinements**

- **Asset Portfolio Overview**
     Sector-aware KPIs:
        Mining: mobile vs fixed, by pit/shaft.
        O&G: wells, pipelines, tanks.
        Water: plants, lift stations, DMAs.
        Power: feeders, substations, transformers.
        FMCG: production lines, packaging cells.
- **Portfolio Explorer**
     Add view types:
        **Tree** : Site → Area → Line → Asset (current).
        **Network/Topo** : nodes & edges for pipelines/lines/networks.
        **Map** : GIS layer for spatial view (Mining, O&G, Water, Power).
- **Saved Views & Segments**
     Provide sector presets:
        “Critical feeders in Nairobi region” (Power).
        “Pump stations serving hospital zones” (Water).
        “High-utilization packaging lines” (FMCG).

**Priority** :


- Tree view: 🔴 MVP
- Network/Map view: 🟡 Phase 2 (but architect for it now).

### Feature Set 3: Asset Catalog & Types (Refined)

**Generalization Strategy**

- Use **one schema** for Asset Types with:
     Sector tags.
     Role tags (fixed/mobile/linear).
     Attach **predefined property sets** per sector.

**Key Refinements**

- **Asset Type Library**
     Pre-configured libraries per sector (see Section 5).
     Tag asset types by:
        Sector(s)
        Shape: Fixed / Mobile / Linear / Network node.
- **Templates & Property Sets**
     Provide sector-specific packs:
        **Power** : nameplate (kV, kA, MVA), protection settings.
        **O&G** : pressure/temperature ratings, material class, design codes.
        **Water** : diameter, pressure class, liner/coating, water quality
          parameters.
        **FMCG** : throughput, SKU capability, hygienic design class.
        **Mining** : payload, cycle time, duty classification.
- **Lifecycle States**
     Allow tenants to extend with sector typicals:
        “Commissioning”, “Hot Standby”, “Cold Reserve”, “Mothballed”,
          “Decommissioned.”
- **Industry & Sector Profiles**
     Support **multi-sector assets** (e.g., utility that manages both Power and
       Water).

**Priority** : 🔴 MVP with a minimal seed library + 🟡 more detailed packs later.


### Feature Set 4: Connectivity & Data Points (Refined)

**Generalization Strategy**

- Single abstraction of “data point” and “endpoint,” with protocol and sector hints.

**Key Refinements**

- **Tag/Data Point Mapping**
     Support protocol-specific metadata:
        HART, Foundation Fieldbus (O&G, Process).
        DNP3, IEC 61850 (Power).
        Modbus, OPC-UA (all).
     Tag data points by use: telemetry / command / setpoint / status / quality.
- **Connection Endpoints**
     Additional fields:
        Zone classification (IT/OT/DMZ, hazardous area).
        Security posture (cert-based, VPN, etc.).
- **Stream Configuration**
     Provide sector-specific default profiles:
        High speed, short retention (FMCG lines).
        Low speed, long retention (Water networks, Power grid devices).
- **Connection Health Monitor**
     Add extra context:
        For linear assets: show affected pipeline segment / feeder / DMA.
        For mobile assets: last known geo position.

**Priority** : 🔴 MVP base; protocol details & profiles as 🟡 Phase 2.

### Feature Set 5: Asset Detail & Context (Refined)

**Generalization Strategy**

- Keep Asset 360 as canonical, but make it “tab-expandable” per sector.


**Key Refinements**

- **Asset 360 View**
     Core tabs for all:
        Overview, Telemetry, Relationships, Documents, History.
     Optional sector tabs:
        **Compliance** (API/ASME, NERC CIP, HACCP, water quality).
        **Safety & Risk** (hazardous area, SIL level, safety zones).
        **Usage & Production Context** (line, SKU, batch links).
- **Topology & Relationships**
     Integrate with new Location/Topology feature set:
        Show where the asset sits in network or line.
- **Document & Media Attachments**
     Pre-canned doc types per sector:
        P&IDs, as-built drawings, inspection reports, permits, SOPs.
- **Responsibility & Ownership**
     Support multiple layers:
        Operational owner, maintenance owner, vendor, regulator contact.
- **Change Log (Audit)**
     Mark changes relevant to regulation (e.g., safety settings, critical tags).

**Priority** : 🔴 MVP for basic tabs; 🟡 additional Compliance/Safety tabs.

### Feature Set 6 (New): Location, Topology & Linear Assets

**Purpose:** Model spatial context, networks and linear infrastructure shared by Mining, O&G,
Water, Power, and FMCG lines.

**Core Features**

1. **Geo Location & GIS Hooks (** 🔴 **/** 🟡 **)**
    a. Store coordinates, site polygons, and network nodes.
    b. Integration points for GIS systems used in Water, O&G, Mining, Power.
2. **Linear Asset Modeling (** 🔴 **/** 🟡 **)**
    a. Allow assets to be defined as **segments** (pipeline reach, feeder, conveyor
       section).


```
b. Ability to aggregate condition/alerts across a line.
```
3. **Network Topology (** 🟡 **)**
    a. Node-link modeling for:
       i. Electrical networks.
ii. Water distribution & DMAs.
iii. Pipeline networks.
4. **Mobile Asset Tracking (** 🟡 **)**
    a. Store last known position, zones, and movement trails for mobile assets:
       i. Mining fleets, field crews, portable equipment.

## 4. Sector Configuration Guide (high-level)

For each sector, you’d preconfigure:

### Mining

- **Asset Types:** haul trucks, shovels, drills, crushers, mills, conveyors, pumps, fans,
    substations.
- **Property Sets:** payload & cycle, vibration/severity, dust-proofing/ingress, explosive
    environment (if applicable).
- **Lifecycle States:** Exploration, Commissioning, Active, Standby, Rebuild, Retired.
- **Protocols:** OPC-UA, Modbus, CAN bus (via gateways), fleet management APIs.
- **Hierarchy:** Region → Mine → Pit/Shaft → Area → Line/Section → Asset.
- **Compliance:** Mine safety standards, geotechnical monitoring obligations.

### Oil & Gas

- **Asset Types:** wells, wellheads, separators, compressors, pumps, pipelines, tanks,
    columns, exchangers.
- **Property Sets:** design pressure/temp, MAOP, material class, hazardous area,
    API/ASME codes.
- **Lifecycle States:** Drilling, Completing, Producing, Shut-in, Plugged & Abandoned
    (for wells); Commissioning/Turnaround for plants.
- **Protocols:** OPC-UA, Modbus, HART, Foundation Fieldbus.
- **Hierarchy:** Field → Pad/Platform → Well / Process Unit → Asset.


- **Compliance:** API, ASME, SIL, emissions constraints.

### Water & Wastewater

- **Asset Types:** pumps, valves, meters, clarifiers, aerators, digesters, lift stations,
    reservoirs.
- **Property Sets:** diameter, pressure class, flow capacity, quality monitoring
    parameters.
- **Lifecycle States:** Commissioning, In Service, Restricted, Out of Service,
    Decommissioned.
- **Protocols:** OPC-UA, Modbus, DNP3, proprietary RTU protocols (via gateway).
- **Hierarchy:** Region → System → Plant/Zone → DMA → Asset.
- **Compliance:** Water quality reporting rules, discharge consents.

### Power Generation & Transmission

- **Asset Types:** boilers, turbines, generators, transformers, breakers, relays,
    capacitors, lines, feeders.
- **Property Sets:** kV, MVA, insulation level, fault rating, CT/PT ratios, relay settings.
- **Lifecycle States:** In Service, Standby, Outage (planned/unplanned),
    Decommissioned.
- **Protocols:** IEC 61850, DNP3, Modbus, OPC-UA.
- **Hierarchy:** Region → Grid → Plant/Substation → Bay/Feeder → Asset.
- **Compliance:** Grid codes, NERC CIP, protection & safety rules.

### FMCG Manufacturing

- **Asset Types:** fillers, cappers, labelers, packers, palletizers, conveyors, mixers, CIP
    units, utilities (compressors, chillers).
- **Property Sets:** throughput, pack size ranges, hygienic class, clean-in-place
    parameters.
- **Lifecycle States:** Available, Running, Changeover, Cleaning, Maintenance, Idle.
- **Protocols:** OPC-UA, industrial Ethernet, fieldbuses via PLC gateways.
- **Hierarchy:** Site → Area → Line → Cell → Asset.
- **Compliance:** HACCP, food safety, hygiene certifications.


## 5. Implementation Roadmap (very high-level)

#### • MVP ( 🔴 ):

```
 Core Feature Sets 1–5 with:
 Basic sector tagging.
 Seed asset type libraries.
 Basic connectivity (OPC-UA/Modbus) and Asset 360.
```
- **Phase 2 (** 🟡 **):**
     Feature Set 6 (Location & Topology).
     Protocol-specific metadata & sector property packs.
     Network/Map views in Portfolio & Asset Detail.
- **Phase 3 (** 🟢 **):**
     Deep GIS/MES/EMS/mine-planning integration.
     Advanced compliance workflows.
     Sophisticated mobile tracking & scenario analysis.


