import { storage } from './storage';
import { db } from './db';
import { systemLogs, alerts, aiRecommendations } from '@shared/schema';

interface ReactorScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  phases: ScenarioPhase[];
  safeguards: string[];
  procedures: string[];
}

interface ScenarioPhase {
  name: string;
  duration: number;
  sensorModifications: SensorModification[];
  alertConditions: AlertCondition[];
  procedureSteps: string[];
}

interface SensorModification {
  nodeId: string;
  valueChange: number;
  statusChange?: string;
  reason: string;
}

interface AlertCondition {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  nodeId?: string;
  triggerCondition: string;
}

export class ReactorScenarioManager {
  private activeScenario: ReactorScenario | null = null;
  private currentPhase: number = 0;
  private scenarioStartTime: Date | null = null;
  private phaseTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeScenarios();
  }

  private scenarios: ReactorScenario[] = [
    {
      id: 'refueling-outage',
      name: 'Planned Refueling Outage',
      description: 'Complete reactor shutdown and refueling operation following NRC procedures',
      duration: 2160, // 36 hours simulated in accelerated time
      phases: [
        {
          name: 'Mode 1 to Mode 2 Transition',
          duration: 15,
          sensorModifications: [
            { nodeId: 'NEUTRON-01', valueChange: -50, reason: 'Control rod insertion beginning' },
            { nodeId: 'CORE-TEMP-01', valueChange: -20, reason: 'Reactor power reduction' },
            { nodeId: 'CONTROL-ROD-01', valueChange: 25, reason: 'Rod insertion sequence initiated' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Reactor shutdown sequence initiated - Mode 1 to Mode 2', triggerCondition: 'power_reduction' }
          ],
          procedureSteps: [
            'Verify all control rods fully operational',
            'Begin controlled power reduction at 3%/minute',
            'Monitor neutron flux and temperature response',
            'Confirm reactor subcritical conditions'
          ]
        },
        {
          name: 'Mode 3 - Hot Shutdown',
          duration: 20,
          sensorModifications: [
            { nodeId: 'NEUTRON-01', valueChange: -80, reason: 'Reactor subcritical' },
            { nodeId: 'CORE-TEMP-01', valueChange: -50, reason: 'Natural cooldown beginning' },
            { nodeId: 'CONTROL-ROD-01', valueChange: 50, reason: 'All rods inserted' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: -5, reason: 'Pressure reduction' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Reactor in Mode 3 - Hot Shutdown achieved', triggerCondition: 'subcritical' },
            { severity: 'warning', message: 'Monitor decay heat removal systems', triggerCondition: 'temperature_monitoring' }
          ],
          procedureSteps: [
            'Verify reactor subcritical by at least 1% delta-k',
            'Monitor decay heat removal capability',
            'Begin cooldown at rate not exceeding 50°C/hour',
            'Maintain RCS inventory and pressure'
          ]
        },
        {
          name: 'Mode 4 - Hot Standby',
          duration: 25,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: -100, reason: 'Continued cooldown' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: -15, reason: 'Depressurization sequence' },
            { nodeId: 'COOLANT-FLOW-01', valueChange: -30, reason: 'Reduced flow requirements' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Mode 4 - Hot Standby conditions established', triggerCondition: 'temperature_pressure' }
          ],
          procedureSteps: [
            'RCS temperature below 200°C (392°F)',
            'Maintain adequate shutdown margin',
            'Verify residual heat removal system operation',
            'Prepare for Mode 5 transition'
          ]
        },
        {
          name: 'Mode 5 - Cold Shutdown',
          duration: 30,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: -200, reason: 'Cold shutdown temperature achieved' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: -25, reason: 'Near atmospheric pressure' },
            { nodeId: 'COOLANT-FLOW-01', valueChange: -50, reason: 'Minimum flow for decay heat removal' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Mode 5 - Cold Shutdown achieved - Ready for refueling', triggerCondition: 'cold_shutdown' }
          ],
          procedureSteps: [
            'RCS temperature below 93°C (200°F)',
            'Verify all safety systems operable',
            'Begin fuel pool preparation',
            'Coordinate refueling crew readiness'
          ]
        },
        {
          name: 'Mode 6 - Refueling Operations',
          duration: 45,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: -250, reason: 'Reactor vessel head removed' },
            { nodeId: 'RAD-MONITOR-01', valueChange: 15, reason: 'Fuel handling operations' },
            { nodeId: 'COOLANT-FLOW-01', valueChange: -70, reason: 'Cavity flooding complete' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Mode 6 - Refueling operations in progress', triggerCondition: 'refueling_mode' },
            { severity: 'warning', message: 'Enhanced radiation monitoring during fuel moves', triggerCondition: 'fuel_handling' }
          ],
          procedureSteps: [
            'Reactor vessel head removed and stored',
            'Fuel transfer canal flooded',
            'Begin spent fuel removal sequence',
            'Install fresh fuel assemblies per core loading map',
            'Verify proper fuel assembly seating'
          ]
        }
      ],
      safeguards: [
        'Shutdown margin maintained > 1% delta-k at all times',
        'Decay heat removal systems continuously monitored',
        'Radiation protection controls for refueling operations',
        'Fuel handling crane interlocks active',
        'Boron concentration maintained per technical specifications'
      ],
      procedures: [
        'GOP-003: Reactor Shutdown from Power Operation',
        'SOP-012: Residual Heat Removal System Operation',
        'FHP-001: Fuel Handling Procedures',
        'RPP-005: Radiation Protection During Outage'
      ]
    },
    {
      id: 'steam-line-break',
      name: 'Steam Line Break Accident',
      description: 'Main steam line rupture simulation with automatic safety system response',
      duration: 45,
      phases: [
        {
          name: 'Initial Break Event',
          duration: 2,
          sensorModifications: [
            { nodeId: 'STEAM-PRESS-01', valueChange: -40, statusChange: 'critical', reason: 'Steam line rupture' },
            { nodeId: 'STEAM-TEMP-01', valueChange: -30, reason: 'Steam blowdown cooling' },
            { nodeId: 'CORE-TEMP-01', valueChange: 15, reason: 'Increased reactor power from cooldown' }
          ],
          alertConditions: [
            { severity: 'critical', message: 'STEAM LINE BREAK DETECTED - Main Steam Isolation Signal', triggerCondition: 'pressure_drop' },
            { severity: 'critical', message: 'Reactor Trip Signal Generated', triggerCondition: 'safety_system' }
          ],
          procedureSteps: [
            'Reactor trip automatically initiated',
            'Main steam isolation valves close',
            'Safety injection signal generated',
            'Emergency diesel generators start'
          ]
        },
        {
          name: 'Emergency Core Cooling Response',
          duration: 8,
          sensorModifications: [
            { nodeId: 'NEUTRON-01', valueChange: -90, reason: 'Reactor trip successful' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: 20, reason: 'Safety injection flow' },
            { nodeId: 'COOLANT-FLOW-01', valueChange: 40, reason: 'Emergency core cooling activation' }
          ],
          alertConditions: [
            { severity: 'warning', message: 'Emergency Core Cooling System activated', triggerCondition: 'eccs_actuation' },
            { severity: 'info', message: 'Core cooling restored and maintained', triggerCondition: 'cooling_adequate' }
          ],
          procedureSteps: [
            'Verify reactor trip and safety injection',
            'Monitor emergency core cooling flow',
            'Assess steam generator levels',
            'Begin emergency operating procedures'
          ]
        },
        {
          name: 'Stabilization and Recovery',
          duration: 35,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: -30, reason: 'Emergency cooling effectiveness' },
            { nodeId: 'STEAM-PRESS-01', valueChange: 10, reason: 'Isolation effective, pressure stabilizing' },
            { nodeId: 'RAD-MONITOR-01', valueChange: 5, reason: 'Minor containment radiation increase' }
          ],
          alertConditions: [
            { severity: 'info', message: 'Plant conditions stabilized', triggerCondition: 'stable_conditions' },
            { severity: 'warning', message: 'Continue monitoring for radiation release', triggerCondition: 'rad_monitoring' }
          ],
          procedureSteps: [
            'Establish long-term core cooling',
            'Monitor containment integrity',
            'Assess need for emergency plan activation',
            'Prepare for plant recovery operations'
          ]
        }
      ],
      safeguards: [
        'Automatic reactor trip on steam line break signal',
        'Main steam isolation valve closure',
        'Emergency core cooling system activation',
        'Containment isolation systems',
        'Emergency diesel generator automatic start'
      ],
      procedures: [
        'EOP-001: Reactor Trip Response',
        'EOP-003: Steam Line Break',
        'SAG-001: Severe Accident Guidelines',
        'EPP-001: Emergency Plan Implementation'
      ]
    },
    {
      id: 'station-blackout',
      name: 'Station Blackout Event',
      description: 'Loss of all AC power with emergency diesel generator failure',
      duration: 60,
      phases: [
        {
          name: 'AC Power Loss',
          duration: 1,
          sensorModifications: [
            { nodeId: 'PRIMARY-PRESS-01', valueChange: -10, statusChange: 'warning', reason: 'Reactor coolant pump coastdown' },
            { nodeId: 'COOLANT-FLOW-01', valueChange: -80, reason: 'Pumps tripping on power loss' },
            { nodeId: 'NEUTRON-01', valueChange: -85, reason: 'Automatic reactor trip' }
          ],
          alertConditions: [
            { severity: 'critical', message: 'STATION BLACKOUT - All AC power lost', triggerCondition: 'power_loss' },
            { severity: 'critical', message: 'Emergency diesel generators failed to start', triggerCondition: 'backup_power_failure' }
          ],
          procedureSteps: [
            'Reactor automatically trips on loss of power',
            'Verify emergency diesel generator status',
            'Assess DC power availability',
            'Implement FLEX strategies if available'
          ]
        },
        {
          name: 'Battery Power Phase',
          duration: 15,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: 25, reason: 'Loss of normal cooling, decay heat buildup' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: 15, reason: 'Steam generator dryout beginning' },
            { nodeId: 'STEAM-TEMP-01', valueChange: 20, reason: 'Natural circulation effects' }
          ],
          alertConditions: [
            { severity: 'warning', message: 'Operating on battery power - Limited time available', triggerCondition: 'battery_operation' },
            { severity: 'warning', message: 'Steam generator inventory decreasing', triggerCondition: 'sg_level_low' }
          ],
          procedureSteps: [
            'Monitor battery voltage and load',
            'Secure non-essential DC loads',
            'Monitor steam generator levels',
            'Prepare for potential core damage'
          ]
        },
        {
          name: 'Extended Blackout',
          duration: 44,
          sensorModifications: [
            { nodeId: 'CORE-TEMP-01', valueChange: 80, statusChange: 'critical', reason: 'Core heat up continues' },
            { nodeId: 'RAD-MONITOR-01', valueChange: 25, reason: 'Potential fuel damage indicators' },
            { nodeId: 'PRIMARY-PRESS-01', valueChange: 30, reason: 'Steam formation in vessel' }
          ],
          alertConditions: [
            { severity: 'critical', message: 'Core temperature approaching damage limits', triggerCondition: 'core_damage_threat' },
            { severity: 'critical', message: 'Implement severe accident management guidelines', triggerCondition: 'emergency_response' }
          ],
          procedureSteps: [
            'Monitor core exit thermocouples',
            'Assess containment conditions',
            'Implement SAMG procedures',
            'Consider emergency plan escalation'
          ]
        }
      ],
      safeguards: [
        'Battery power for critical instrumentation',
        'Natural circulation cooling capability',
        'FLEX equipment deployment',
        'Severe accident management guidelines',
        'Emergency response organization activation'
      ],
      procedures: [
        'EOP-008: Loss of All AC Power',
        'SAMG-001: Severe Accident Management',
        'FLEX-001: Diverse and Flexible Coping',
        'EPP-002: Site Area Emergency Declaration'
      ]
    }
  ];

  async startScenario(scenarioId: string): Promise<boolean> {
    const scenario = this.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      console.error(`Scenario ${scenarioId} not found`);
      return false;
    }

    // Stop any active scenario
    if (this.activeScenario) {
      this.stopScenario();
    }

    this.activeScenario = scenario;
    this.currentPhase = 0;
    this.scenarioStartTime = new Date();

    // Log scenario start
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Nuclear Scenario Started: ${scenario.name}`,
      source: 'scenario-manager'
    });

    // Create initial scenario alert
    await storage.createAlert({
      nodeId: 'SCENARIO-CONTROL',
      message: `SCENARIO ACTIVE: ${scenario.name} - ${scenario.description}`,
      severity: 'info',
      isActive: true,
      acknowledgedAt: null
    });

    console.log(`Starting nuclear scenario: ${scenario.name}`);
    this.executeCurrentPhase();
    return true;
  }

  private async executeCurrentPhase() {
    if (!this.activeScenario || this.currentPhase >= this.activeScenario.phases.length) {
      return this.completeScenario();
    }

    const phase = this.activeScenario.phases[this.currentPhase];
    console.log(`Executing scenario phase: ${phase.name}`);

    // Log phase start
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Scenario Phase ${this.currentPhase + 1}: ${phase.name}`,
      source: 'scenario-manager'
    });

    // Apply sensor modifications
    for (const mod of phase.sensorModifications) {
      await this.applySensorModification(mod);
    }

    // Generate alerts
    for (const alert of phase.alertConditions) {
      await storage.createAlert({
        nodeId: alert.nodeId || 'SCENARIO-EVENT',
        message: alert.message,
        severity: alert.severity,
        isActive: true,
        acknowledgedAt: null
      });
    }

    // Generate AI recommendation
    await storage.createAiRecommendation({
      type: 'operational',
      priority: 'high',
      title: `${this.activeScenario.name} - Phase ${this.currentPhase + 1}`,
      description: `Current phase: ${phase.name}. Recommended actions: ${phase.procedureSteps.join('; ')}`,
      confidence: 95,
      estimatedImpact: 'operational_safety'
    });

    // Set timer for next phase
    this.phaseTimer = setTimeout(() => {
      this.currentPhase++;
      this.executeCurrentPhase();
    }, phase.duration * 1000); // Convert minutes to milliseconds
  }

  private async applySensorModification(mod: SensorModification) {
    // This would integrate with the sensor data generation system
    console.log(`Applying sensor modification: ${mod.nodeId} - ${mod.reason}`);
    
    // For now, we'll create a system log documenting the change
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Sensor ${mod.nodeId}: ${mod.reason} (Value change: ${mod.valueChange > 0 ? '+' : ''}${mod.valueChange})`,
      source: 'scenario-modification'
    });
  }

  private async completeScenario() {
    if (!this.activeScenario) return;

    console.log(`Completing nuclear scenario: ${this.activeScenario.name}`);

    // Log scenario completion
    await db.insert(systemLogs).values({
      level: 'info',
      message: `Nuclear Scenario Completed: ${this.activeScenario.name}`,
      source: 'scenario-manager'
    });

    // Create completion alert
    await storage.createAlert({
      nodeId: 'SCENARIO-CONTROL',
      message: `SCENARIO COMPLETED: ${this.activeScenario.name} - All phases executed successfully`,
      severity: 'info',
      isActive: true,
      acknowledgedAt: null
    });

    // Reset scenario state
    this.activeScenario = null;
    this.currentPhase = 0;
    this.scenarioStartTime = null;
  }

  async stopScenario(): Promise<void> {
    if (!this.activeScenario) return;

    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }

    // Log scenario stop
    await db.insert(systemLogs).values({
      level: 'warning',
      message: `Nuclear Scenario Stopped: ${this.activeScenario.name} (Phase ${this.currentPhase + 1})`,
      source: 'scenario-manager'
    });

    this.activeScenario = null;
    this.currentPhase = 0;
    this.scenarioStartTime = null;
  }

  getActiveScenario(): ReactorScenario | null {
    return this.activeScenario;
  }

  getCurrentPhase(): ScenarioPhase | null {
    if (!this.activeScenario || this.currentPhase >= this.activeScenario.phases.length) {
      return null;
    }
    return this.activeScenario.phases[this.currentPhase];
  }

  getScenarioProgress(): { current: number; total: number; phase: string } | null {
    if (!this.activeScenario) return null;

    return {
      current: this.currentPhase + 1,
      total: this.activeScenario.phases.length,
      phase: this.activeScenario.phases[this.currentPhase]?.name || 'Completed'
    };
  }

  getAllScenarios(): ReactorScenario[] {
    return this.scenarios;
  }

  private initializeScenarios() {
    console.log(`Initialized ${this.scenarios.length} nuclear reactor scenarios`);
  }
}

export const scenarioManager = new ReactorScenarioManager();