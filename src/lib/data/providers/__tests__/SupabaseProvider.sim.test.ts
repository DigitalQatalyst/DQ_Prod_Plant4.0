import { describe, it, expect, beforeAll } from 'vitest';
import { SupabaseProvider } from '../SupabaseProvider';

describe('SupabaseProvider SIM Methods', () => {
  let provider: SupabaseProvider;
  const testTenantId = '67317811-a14d-4ef8-bfc8-e6b4ac10f439'; // DEWA Transmission tenant

  beforeAll(() => {
    provider = new SupabaseProvider();
  });

  describe('SIM Boards', () => {
    it('should get SIM boards for tenant', async () => {
      const boards = await provider.getSimBoards(testTenantId);
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThan(0);
      
      // Verify board structure
      const board = boards[0];
      expect(board).toHaveProperty('id');
      expect(board).toHaveProperty('tenantId', testTenantId);
      expect(board).toHaveProperty('boardName');
      expect(board).toHaveProperty('status');
    }, 10000); // Increase timeout to 10 seconds

    it('should get SIM board by ID', async () => {
      const boards = await provider.getSimBoards(testTenantId);
      const boardId = boards[0].id;
      
      const board = await provider.getSimBoardById(boardId);
      expect(board).toBeTruthy();
      expect(board?.id).toBe(boardId);
      expect(board?.tenantId).toBe(testTenantId);
    });

    it('should get SIM KPIs for board', async () => {
      const boards = await provider.getSimBoards(testTenantId);
      const boardId = boards[0].id;
      
      const kpis = await provider.getSimKpis(boardId);
      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBeGreaterThan(0);
      
      // Verify KPI structure
      const kpi = kpis[0];
      expect(kpi).toHaveProperty('id');
      expect(kpi).toHaveProperty('boardId', boardId);
      expect(kpi).toHaveProperty('kpiCode');
      expect(kpi).toHaveProperty('kpiName');
    });
  });

  describe('Switching Orders', () => {
    it('should list switching orders for tenant', async () => {
      const orders = await provider.listSwitchingOrders(testTenantId);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      
      // Verify order structure
      const order = orders[0];
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('tenantId', testTenantId);
      expect(order).toHaveProperty('orderNo');
      expect(order).toHaveProperty('description');
      expect(order).toHaveProperty('status');
    });

    it('should get switching order by ID', async () => {
      const orders = await provider.listSwitchingOrders(testTenantId);
      const orderId = orders[0].id;
      
      const order = await provider.getSwitchingOrder(orderId);
      expect(order).toBeTruthy();
      expect(order?.id).toBe(orderId);
      expect(order?.tenantId).toBe(testTenantId);
    });
  });

  describe('Outages', () => {
    it('should list outages for tenant', async () => {
      const outages = await provider.listOutages(testTenantId);
      expect(Array.isArray(outages)).toBe(true);
      expect(outages.length).toBeGreaterThan(0);
      
      // Verify outage structure
      const outage = outages[0];
      expect(outage).toHaveProperty('id');
      expect(outage).toHaveProperty('tenantId', testTenantId);
      expect(outage).toHaveProperty('outageRef');
      expect(outage).toHaveProperty('outageType');
      expect(outage).toHaveProperty('status');
    });

    it('should get outage by ID', async () => {
      const outages = await provider.listOutages(testTenantId);
      const outageId = outages[0].id;
      
      const outage = await provider.getOutage(outageId);
      expect(outage).toBeTruthy();
      expect(outage?.id).toBe(outageId);
      expect(outage?.tenantId).toBe(testTenantId);
    });
  });

  describe('SIM Issues', () => {
    it('should list SIM issues for tenant', async () => {
      const issues = await provider.listSimIssues(testTenantId);
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      
      // Verify issue structure
      const issue = issues[0];
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('tenantId', testTenantId);
      expect(issue).toHaveProperty('issueRef');
      expect(issue).toHaveProperty('title');
      expect(issue).toHaveProperty('status');
    });
  });

  describe('SIM Actions', () => {
    it('should list SIM actions for tenant', async () => {
      const actions = await provider.listSimActions(testTenantId);
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
      
      // Verify action structure
      const action = actions[0];
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('tenantId', testTenantId);
      expect(action).toHaveProperty('actionRef');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('owner');
      expect(action).toHaveProperty('status');
    });
  });

  describe('Tenant Isolation', () => {
    it('should only return data for specified tenant', async () => {
      const boards = await provider.getSimBoards(testTenantId);
      boards.forEach(board => {
        expect(board.tenantId).toBe(testTenantId);
      });

      const orders = await provider.listSwitchingOrders(testTenantId);
      orders.forEach(order => {
        expect(order.tenantId).toBe(testTenantId);
      });

      const outages = await provider.listOutages(testTenantId);
      outages.forEach(outage => {
        expect(outage.tenantId).toBe(testTenantId);
      });
    });
  });
});