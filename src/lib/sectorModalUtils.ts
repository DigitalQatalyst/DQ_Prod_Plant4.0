import { SectorSpecificModalData } from "@/context/AppContext";

export function getSectorSpecificModalContent(
  modalType: 'sim-issue' | 'ci-project' | 'optimization-scenario' | 'ai-recommendation' | 'optimization-playbook',
  sector: string,
  subsector: string
): { type: 'sim-issue' | 'ci-project' | 'optimization-scenario' | 'ai-recommendation' | 'optimization-playbook'; data: SectorSpecificModalData } {

  // Validate input parameters
  if (!modalType) {
    throw new Error('Modal type is required');
  }

  const baseContent: SectorSpecificModalData = {
    modalType,
    sector: sector || '',
    subsector: subsector || '',
    title: '',
    fields: []
  };

  switch (modalType) {
    case 'sim-issue':
      return {
        type: 'sim-issue',
        data: getSIMIssueModalContent(baseContent, sector, subsector)
      };

    case 'ci-project':
      return {
        type: 'ci-project',
        data: getCIProjectModalContent(baseContent, sector, subsector)
      };

    case 'optimization-scenario':
      return {
        type: 'optimization-scenario',
        data: getOptimizationModalContent(baseContent, sector, subsector)
      };

    case 'ai-recommendation':
      return {
        type: 'ai-recommendation',
        data: { ...baseContent, title: 'AI Recommendation' }
      };

    case 'optimization-playbook':
      return {
        type: 'optimization-playbook',
        data: getPlaybookModalContent(baseContent, sector, subsector)
      };

    default:
      return {
        type: modalType,
        data: baseContent
      };
  }
}

function getPlaybookModalContent(base: SectorSpecificModalData, sector: string, subsector: string): SectorSpecificModalData {
  const fields: SectorSpecificModalData['fields'] = [
    {
      name: 'title',
      label: 'Playbook Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Procedure name'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      options: ['Operational Efficiency', 'Asset Health', 'Reliability', 'Loss Reduction', 'Other'],
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Detailed procedure description'
    }
  ];

  return {
    ...base,
    title: 'Create Playbook',
    fields
  };
}


function getSIMIssueModalContent(base: SectorSpecificModalData, sector: string, subsector: string): SectorSpecificModalData {
  // Cross-sector core fields
  const fields: SectorSpecificModalData['fields'] = [
    {
      name: 'title',
      label: 'Issue Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Brief description of the issue'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      options: ['Equipment', 'Process', 'Quality', 'Safety', 'Other'],
      required: true
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select' as const,
      options: ['High', 'Medium', 'Low'],
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Detailed description of the issue'
    },
    {
      name: 'assignee',
      label: 'Assignee',
      type: 'text' as const,
      required: true,
      placeholder: 'Person responsible for resolution'
    }
  ];

  let title = 'Log New Issue';

  // Add sector-specific fields and terminology
  if (sector === 'Oil & Gas' && subsector === 'Upstream') {
    title = 'Log Upstream Issue';
    fields.splice(1, 0, {
      name: 'wellsAffected',
      label: 'Wells Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Alpha-7, Beta-3'
    });
    fields.splice(2, 0, {
      name: 'productionImpact',
      label: 'Production Impact (bbl/day)',
      type: 'number' as const,
      required: false,
      placeholder: 'Estimated production loss'
    });
    // Update category options for upstream
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['Well Equipment', 'Separator', 'Trunkline', 'Flow Assurance', 'Deferment', 'Other'];
    }
  } else if (sector === 'Power' && subsector === 'Transmission') {
    title = 'Log Transmission Issue';
    fields.splice(1, 0, {
      name: 'equipmentAffected',
      label: 'Equipment Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., TX-001, REL-002'
    });
    fields.splice(2, 0, {
      name: 'systemImpact',
      label: 'System Impact (MW)',
      type: 'text' as const,
      required: false,
      placeholder: 'Load impact or capacity affected'
    });
    // Update category options for transmission
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['Relay', 'Transformer', 'Line', 'Switching', 'Grid Stability', 'Other'];
    }
  } else if (sector === 'FMCG' && subsector === 'Food & Beverage') {
    title = 'Log Line Issue';
    fields.splice(1, 0, {
      name: 'linesAffected',
      label: 'Lines Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Line-3, Bottling Line 2'
    });
    fields.splice(2, 0, {
      name: 'throughputImpact',
      label: 'Throughput Impact (units/hour)',
      type: 'text' as const,
      required: false,
      placeholder: 'Production rate impact'
    });
    // Update category options for FMCG
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['Changeover', 'Material Shortage', 'Micro-stop', 'CIP', 'Packaging', 'Other'];
    }
  }

  return {
    ...base,
    title,
    fields
  };
}

function getCIProjectModalContent(base: SectorSpecificModalData, sector: string, subsector: string): SectorSpecificModalData {
  // Cross-sector core fields
  const fields: SectorSpecificModalData['fields'] = [
    {
      name: 'title',
      label: 'Project Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Brief description of the improvement project'
    },
    {
      name: 'projectType',
      label: 'Project Type',
      type: 'select' as const,
      options: ['Process Improvement', 'Equipment Optimization', 'Quality Enhancement', 'Cost Reduction', 'Other'],
      required: true
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select' as const,
      options: ['High', 'Medium', 'Low'],
      required: true
    },
    {
      name: 'targetKPI',
      label: 'Target KPI',
      type: 'text' as const,
      required: true,
      placeholder: 'KPI to be improved'
    },
    {
      name: 'targetImprovement',
      label: 'Target Improvement',
      type: 'text' as const,
      required: true,
      placeholder: 'Expected improvement (e.g., +5%, -10 minutes)'
    },
    {
      name: 'owner',
      label: 'Project Owner',
      type: 'text' as const,
      required: true,
      placeholder: 'Person responsible for the project'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Detailed description of the improvement opportunity'
    }
  ];

  let title = 'Create CI Project';

  // Add sector-specific fields and terminology
  if (sector === 'Oil & Gas' && subsector === 'Upstream') {
    title = 'Create Upstream CI Project';
    fields.splice(2, 0, {
      name: 'wellsAffected',
      label: 'Wells Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Alpha-7, Beta-3'
    });
    fields.splice(3, 0, {
      name: 'productionImpact',
      label: 'Expected Production Impact (bbl/day)',
      type: 'number' as const,
      required: false,
      placeholder: 'Expected production increase'
    });
    // Update project type options for upstream
    const projectTypeField = fields.find(f => f.name === 'projectType');
    if (projectTypeField) {
      projectTypeField.options = ['Deferment Reduction', 'Flow Assurance', 'Well Uptime', 'Lifting Cost', 'Produced Water', 'Other'];
    }
  } else if (sector === 'Power' && subsector === 'Transmission') {
    title = 'Create Transmission CI Project';
    fields.splice(2, 0, {
      name: 'equipmentAffected',
      label: 'Equipment Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., TX-001, REL-002'
    });
    fields.splice(3, 0, {
      name: 'reliabilityImpact',
      label: 'Expected Reliability Impact',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., SAIDI reduction of 15 minutes'
    });
    // Update project type options for transmission
    const projectTypeField = fields.find(f => f.name === 'projectType');
    if (projectTypeField) {
      projectTypeField.options = ['Relay Misoperation', 'Transmission Loss', 'Trip Investigation', 'Transformer Loading', 'Grid Reliability', 'Other'];
    }
  } else if (sector === 'FMCG' && subsector === 'Food & Beverage') {
    title = 'Create FMCG CI Project';
    fields.splice(2, 0, {
      name: 'linesAffected',
      label: 'Lines Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Line-3, Bottling Line 2'
    });
    fields.splice(3, 0, {
      name: 'changeoverImpact',
      label: 'Expected Changeover Impact (minutes saved)',
      type: 'text' as const,
      required: false,
      placeholder: 'Expected changeover time reduction'
    });
    // Update project type options for FMCG
    const projectTypeField = fields.find(f => f.name === 'projectType');
    if (projectTypeField) {
      projectTypeField.options = ['Changeover Reduction (SMED)', 'Scrap/Waste', 'Material Yield', 'Batch Consistency', 'Quality Improvement', 'Other'];
    }
  }

  return {
    ...base,
    title,
    fields
  };
}

function getOptimizationModalContent(base: SectorSpecificModalData, sector: string, subsector: string): SectorSpecificModalData {
  // Cross-sector core fields
  const fields: SectorSpecificModalData['fields'] = [
    {
      name: 'title',
      label: 'Scenario Title',
      type: 'text' as const,
      required: true,
      placeholder: 'Brief description of the optimization scenario'
    },
    {
      name: 'category',
      label: 'Optimization Category',
      type: 'select' as const,
      options: ['Performance', 'Efficiency', 'Cost Reduction', 'Quality', 'Other'],
      required: true
    },
    {
      name: 'confidence',
      label: 'Confidence Level (%)',
      type: 'number' as const,
      required: true,
      placeholder: '0-100'
    },
    {
      name: 'potentialImpact',
      label: 'Potential Impact',
      type: 'text' as const,
      required: true,
      placeholder: 'Expected improvement or savings'
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Detailed description of the optimization opportunity'
    }
  ];

  let title = 'Create Optimization Scenario';

  // Add sector-specific fields and terminology
  if (sector === 'Oil & Gas' && subsector === 'Upstream') {
    title = 'Create Upstream Optimization Scenario';
    fields.splice(2, 0, {
      name: 'wellsAffected',
      label: 'Wells Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Beta-3, Alpha-1'
    });
    fields.splice(3, 0, {
      name: 'productionUplift',
      label: 'Expected Production Uplift (bbl/day)',
      type: 'text' as const,
      required: false,
      placeholder: 'Expected production increase'
    });
    // Update category options for upstream
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['Well Performance', 'Lift Optimization', 'Gathering System', 'Energy Efficiency', 'Flow Assurance', 'Other'];
    }
  } else if (sector === 'Power' && subsector === 'Transmission') {
    title = 'Create Transmission Optimization Scenario';
    fields.splice(2, 0, {
      name: 'equipmentAffected',
      label: 'Equipment Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., TX-001, TF-003'
    });
    fields.splice(3, 0, {
      name: 'loadingImprovement',
      label: 'Expected Loading Improvement (%)',
      type: 'text' as const,
      required: false,
      placeholder: 'Expected loading optimization'
    });
    // Update category options for transmission
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['Loading Optimization', 'Congestion Relief', 'Switching Path', 'Loss Minimization', 'Grid Stability', 'Other'];
    }
  } else if (sector === 'FMCG' && subsector === 'Food & Beverage') {
    title = 'Create FMCG Optimization Scenario';
    fields.splice(2, 0, {
      name: 'linesAffected',
      label: 'Lines Affected',
      type: 'text' as const,
      required: false,
      placeholder: 'e.g., Line-2, Packaging Line 1'
    });
    fields.splice(3, 0, {
      name: 'throughputIncrease',
      label: 'Expected Throughput Increase (%)',
      type: 'text' as const,
      required: false,
      placeholder: 'Expected throughput improvement'
    });
    // Update category options for FMCG
    const categoryField = fields.find(f => f.name === 'category');
    if (categoryField) {
      categoryField.options = ['SKU Sequencing', 'Line Speed', 'Recipe Optimization', 'Packaging Material', 'Energy/Throughput', 'Other'];
    }
  }

  return {
    ...base,
    title,
    fields
  };
}