import { getSectorSpecificModalContent } from '../sectorModalUtils';

describe('getSectorSpecificModalContent', () => {
  describe('SIM Issue Modal', () => {
    it('should generate cross-sector core SIM issue modal content', () => {
      const result = getSectorSpecificModalContent('sim-issue', '', '');
      
      expect(result.type).toBe('sim-issue');
      expect(result.data.title).toBe('Log New Issue');
      expect(result.data.modalType).toBe('sim-issue');
      expect(result.data.fields).toHaveLength(5); // title, category, priority, description, assignee
      
      const titleField = result.data.fields.find(f => f.name === 'title');
      expect(titleField?.required).toBe(true);
      expect(titleField?.label).toBe('Issue Title');
    });

    it('should generate upstream-specific SIM issue modal content', () => {
      const result = getSectorSpecificModalContent('sim-issue', 'Oil & Gas', 'Upstream');
      
      expect(result.data.title).toBe('Log Upstream Issue');
      expect(result.data.sector).toBe('Oil & Gas');
      expect(result.data.subsector).toBe('Upstream');
      expect(result.data.fields).toHaveLength(7); // includes wellsAffected and productionImpact
      
      const wellsField = result.data.fields.find(f => f.name === 'wellsAffected');
      expect(wellsField?.label).toBe('Wells Affected');
      expect(wellsField?.placeholder).toBe('e.g., Alpha-7, Beta-3');
      
      const categoryField = result.data.fields.find(f => f.name === 'category');
      expect(categoryField?.options).toContain('Well Equipment');
      expect(categoryField?.options).toContain('Flow Assurance');
    });

    it('should generate transmission-specific SIM issue modal content', () => {
      const result = getSectorSpecificModalContent('sim-issue', 'Power', 'Transmission');
      
      expect(result.data.title).toBe('Log Transmission Issue');
      expect(result.data.fields).toHaveLength(7);
      
      const equipmentField = result.data.fields.find(f => f.name === 'equipmentAffected');
      expect(equipmentField?.label).toBe('Equipment Affected');
      
      const categoryField = result.data.fields.find(f => f.name === 'category');
      expect(categoryField?.options).toContain('Relay');
      expect(categoryField?.options).toContain('Transformer');
    });

    it('should generate FMCG-specific SIM issue modal content', () => {
      const result = getSectorSpecificModalContent('sim-issue', 'FMCG', 'Food & Beverage');
      
      expect(result.data.title).toBe('Log Line Issue');
      expect(result.data.fields).toHaveLength(7);
      
      const linesField = result.data.fields.find(f => f.name === 'linesAffected');
      expect(linesField?.label).toBe('Lines Affected');
      
      const categoryField = result.data.fields.find(f => f.name === 'category');
      expect(categoryField?.options).toContain('Changeover');
      expect(categoryField?.options).toContain('CIP');
    });
  });

  describe('CI Project Modal', () => {
    it('should generate cross-sector core CI project modal content', () => {
      const result = getSectorSpecificModalContent('ci-project', '', '');
      
      expect(result.type).toBe('ci-project');
      expect(result.data.title).toBe('Create CI Project');
      expect(result.data.modalType).toBe('ci-project');
      expect(result.data.fields).toHaveLength(7); // title, projectType, priority, targetKPI, targetImprovement, owner, description
      
      const projectTypeField = result.data.fields.find(f => f.name === 'projectType');
      expect(projectTypeField?.options).toContain('Process Improvement');
    });

    it('should generate upstream-specific CI project modal content', () => {
      const result = getSectorSpecificModalContent('ci-project', 'Oil & Gas', 'Upstream');
      
      expect(result.data.title).toBe('Create Upstream CI Project');
      expect(result.data.fields).toHaveLength(9); // includes wellsAffected and productionImpact
      
      const projectTypeField = result.data.fields.find(f => f.name === 'projectType');
      expect(projectTypeField?.options).toContain('Deferment Reduction');
      expect(projectTypeField?.options).toContain('Flow Assurance');
    });
  });

  describe('Optimization Scenario Modal', () => {
    it('should generate cross-sector core optimization scenario modal content', () => {
      const result = getSectorSpecificModalContent('optimization-scenario', '', '');
      
      expect(result.type).toBe('optimization-scenario');
      expect(result.data.title).toBe('Create Optimization Scenario');
      expect(result.data.modalType).toBe('optimization-scenario');
      expect(result.data.fields).toHaveLength(5); // title, category, confidence, potentialImpact, description
      
      const confidenceField = result.data.fields.find(f => f.name === 'confidence');
      expect(confidenceField?.type).toBe('number');
      expect(confidenceField?.placeholder).toBe('0-100');
    });

    it('should generate upstream-specific optimization scenario modal content', () => {
      const result = getSectorSpecificModalContent('optimization-scenario', 'Oil & Gas', 'Upstream');
      
      expect(result.data.title).toBe('Create Upstream Optimization Scenario');
      expect(result.data.fields).toHaveLength(7); // includes wellsAffected and productionUplift
      
      const categoryField = result.data.fields.find(f => f.name === 'category');
      expect(categoryField?.options).toContain('Well Performance');
      expect(categoryField?.options).toContain('Lift Optimization');
    });
  });

  describe('Modal Field Validation', () => {
    it('should mark required fields correctly', () => {
      const result = getSectorSpecificModalContent('sim-issue', '', '');
      
      const titleField = result.data.fields.find(f => f.name === 'title');
      const categoryField = result.data.fields.find(f => f.name === 'category');
      const priorityField = result.data.fields.find(f => f.name === 'priority');
      
      expect(titleField?.required).toBe(true);
      expect(categoryField?.required).toBe(true);
      expect(priorityField?.required).toBe(true);
    });

    it('should have appropriate field types', () => {
      const result = getSectorSpecificModalContent('ci-project', 'Oil & Gas', 'Upstream');
      
      const titleField = result.data.fields.find(f => f.name === 'title');
      const descriptionField = result.data.fields.find(f => f.name === 'description');
      const projectTypeField = result.data.fields.find(f => f.name === 'projectType');
      const productionImpactField = result.data.fields.find(f => f.name === 'productionImpact');
      
      expect(titleField?.type).toBe('text');
      expect(descriptionField?.type).toBe('textarea');
      expect(projectTypeField?.type).toBe('select');
      expect(productionImpactField?.type).toBe('number');
    });
  });
});