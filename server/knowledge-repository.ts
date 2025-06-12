import { db } from './db';
import { systemLogs } from '@shared/schema';

interface KnowledgeDocument {
  id: string;
  title: string;
  source: string;
  url: string;
  content: string;
  category: 'regulation' | 'safety' | 'technical' | 'procedure' | 'standard';
  lastUpdated: Date;
  relevanceScore: number;
  tags: string[];
}

interface RegulatorySources {
  nrc: {
    baseUrl: string;
    endpoints: {
      regulations: string;
      safeguards: string;
      reactorOversight: string;
      technicalReports: string;
      emergencyPrep: string;
    };
  };
  ieee: {
    baseUrl: string;
    standards: string[];
  };
  asme: {
    baseUrl: string;
    codes: string[];
  };
}

export class NuclearKnowledgeRepository {
  private documents: Map<string, KnowledgeDocument> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeRepository();
  }

  private async initializeRepository() {
    try {
      console.log('Initializing Nuclear Regulatory Knowledge Repository...');
      
      // Load critical nuclear regulatory documents
      await this.loadNRCRegulations();
      await this.loadIEEEStandards();
      await this.loadASMECodes();
      await this.loadOperationalProcedures();
      
      // Start periodic updates every 24 hours
      this.startPeriodicUpdates();
      
      await db.insert(systemLogs).values({
        level: 'info',
        message: `Knowledge repository initialized with ${this.documents.size} regulatory documents`,
        source: 'knowledge-repo'
      });

      console.log(`Knowledge repository initialized with ${this.documents.size} documents`);
    } catch (error) {
      console.error('Error initializing knowledge repository:', error);
      
      await db.insert(systemLogs).values({
        level: 'error',
        message: `Failed to initialize knowledge repository: ${error}`,
        source: 'knowledge-repo'
      });
    }
  }

  private async loadNRCRegulations() {
    const nrcDocuments = [
      {
        id: 'nrc-10cfr50',
        title: '10 CFR Part 50 - Domestic Licensing of Production and Utilization Facilities',
        source: 'NRC',
        url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part050/',
        category: 'regulation' as const,
        content: `This regulation establishes the domestic licensing requirements for nuclear power reactors and includes:

LICENSING REQUIREMENTS:
- Construction permits and operating licenses for nuclear power plants
- Design criteria for nuclear power plants and testing requirements
- Reactor site criteria including population density and seismic considerations
- Quality assurance requirements for nuclear power plants

SAFETY SYSTEMS REQUIREMENTS:
- Emergency core cooling systems (ECCS) performance criteria
- Containment systems design requirements
- Protection systems and instrumentation requirements
- Fire protection requirements

TECHNICAL SPECIFICATIONS:
- Limiting conditions for operation (LCOs)
- Surveillance requirements for safety systems
- Administrative controls and procedures
- Reactor trip system requirements

REACTOR PROTECTION SYSTEMS:
- Single failure criterion requirements
- Independence and redundancy requirements
- Testability and reliability standards
- Setpoint determination methodologies

This regulation forms the foundation for nuclear reactor safety in the United States and establishes the regulatory framework for reactor licensing, operation, and oversight.`,
        tags: ['licensing', 'safety-systems', 'reactor-protection', 'technical-specifications']
      },
      {
        id: 'nrc-10cfr73',
        title: '10 CFR Part 73 - Physical Protection of Plants and Materials',
        source: 'NRC',
        url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part073/',
        category: 'safety' as const,
        content: `Nuclear facility security requirements including:

PHYSICAL PROTECTION SYSTEMS:
- Security zone requirements and barriers
- Detection and assessment systems
- Armed response capabilities
- Cyber security requirements for critical digital assets

ACCESS AUTHORIZATION:
- Personnel security clearance requirements
- Background investigations and fitness for duty
- Trustworthiness and reliability determinations
- Insider threat mitigation programs

SAFEGUARDS INFORMATION:
- Protection of sensitive security information
- Need-to-know access controls
- Information handling and storage requirements
- Cybersecurity for nuclear facilities

DESIGN BASIS THREAT:
- Threat characteristics that facilities must defend against
- Vehicle bomb protection requirements
- Aircraft impact assessments
- Coordinated attack scenarios`,
        tags: ['security', 'physical-protection', 'access-control', 'cyber-security']
      },
      {
        id: 'nrc-reg-guide-1.97',
        title: 'Regulatory Guide 1.97 - Accident Monitoring Instrumentation',
        source: 'NRC',
        url: 'https://www.nrc.gov/reading-rm/doc-collections/reg-guides/power-reactors/rg/',
        category: 'technical' as const,
        content: `Requirements for nuclear accident monitoring instrumentation:

ACCIDENT MONITORING REQUIREMENTS:
- Type A variables: Primary safety parameters required for safe reactor shutdown
- Type B variables: Important for indication of breach of barriers to fission product release
- Type C variables: Information to indicate reactor core cooling and core geometry
- Type D variables: Information for long-term surveillance
- Type E variables: Information for evaluation of radioactivity release and control

INSTRUMENTATION CHARACTERISTICS:
- Range requirements to cover accident conditions
- Accuracy and response time requirements
- Environmental qualification for accident conditions
- Power supply requirements and backup power
- Display and recording requirements

SENSOR QUALIFICATION:
- Harsh environment testing requirements
- Seismic qualification Category I requirements
- Electromagnetic interference immunity
- Radiation exposure qualification

This guidance ensures operators have necessary information during accident conditions to take appropriate protective actions for public health and safety.`,
        tags: ['accident-monitoring', 'instrumentation', 'environmental-qualification', 'safety-parameters']
      },
      {
        id: 'nrc-nureg-0800',
        title: 'NUREG-0800 - Standard Review Plan for Nuclear Power Plants',
        source: 'NRC',
        url: 'https://www.nrc.gov/reading-rm/doc-collections/nuregs/staff/sr0800/',
        category: 'procedure' as const,
        content: `Standard Review Plan providing guidance for NRC staff review of nuclear power plant applications:

INSTRUMENTATION AND CONTROLS REVIEW:
- Reactor trip system design review criteria
- Engineered safety features actuation system review
- Control systems review including interaction with protection systems
- Display instrumentation review requirements

REVIEW ACCEPTANCE CRITERIA:
- IEEE Standard 603 compliance for safety systems
- Single failure criterion verification
- Independence and isolation requirements
- Environmental and seismic qualification verification

TECHNICAL REVIEW AREAS:
- Chapter 7.1: Introduction to Instrumentation and Controls
- Chapter 7.2: Reactor Trip System
- Chapter 7.3: Engineered Safety Features Systems
- Chapter 7.4: Safe Shutdown Systems
- Chapter 7.5: Information Systems Important to Safety
- Chapter 7.6: Interlock Systems Important to Safety
- Chapter 7.7: Control Systems
- Chapter 7.8: Diverse Instrumentation and Control Systems
- Chapter 7.9: Data Communication Systems

This document ensures consistent and thorough review of nuclear plant safety systems.`,
        tags: ['review-criteria', 'safety-systems', 'instrumentation', 'licensing-review']
      }
    ];

    for (const doc of nrcDocuments) {
      const document: KnowledgeDocument = {
        ...doc,
        lastUpdated: new Date(),
        relevanceScore: 95
      };
      this.documents.set(doc.id, document);
    }
  }

  private async loadIEEEStandards() {
    const ieeeStandards = [
      {
        id: 'ieee-603',
        title: 'IEEE Std 603 - Standard Criteria for Safety Systems for Nuclear Power Generating Stations',
        source: 'IEEE',
        url: 'https://standards.ieee.org/standard/603-2018.html',
        category: 'standard' as const,
        content: `IEEE 603 establishes minimum functional and design criteria for safety systems in nuclear power plants:

SAFETY SYSTEM CRITERIA:
- Single failure criterion - safety systems must be designed to accomplish their safety functions in spite of any single detectable failure
- Independence - safety systems must be independent from other systems to prevent common cause failures
- Test capability - safety systems must be designed to permit testing during power operation
- Completion of protective action - safety systems must be designed to complete their intended function once initiated

DESIGN REQUIREMENTS:
- Equipment qualification for environmental conditions including temperature, pressure, humidity, radiation
- Seismic Category I design for earthquake resistance
- Separation criteria to prevent interaction between redundant channels
- Power supply requirements including independence and capacity

INSTRUMENTATION REQUIREMENTS:
- Sensor independence and diversity requirements
- Signal processing and logic design requirements
- Actuated equipment design requirements
- Maintenance and surveillance requirements

QUALITY ASSURANCE:
- Design control and verification requirements
- Configuration management requirements
- Software quality assurance for digital systems
- Hardware/software integration requirements

This standard is fundamental to nuclear safety system design and is referenced in 10 CFR 50.55a(h).`,
        tags: ['safety-systems', 'single-failure', 'independence', 'testing', 'qualification']
      },
      {
        id: 'ieee-7-4.3.2',
        title: 'IEEE Std 7-4.3.2 - Standard Criteria for Digital Computers in Safety Systems',
        source: 'IEEE',
        url: 'https://standards.ieee.org/standard/7-4_3_2-2010.html',
        category: 'standard' as const,
        content: `IEEE 7-4.3.2 provides criteria for digital computer systems used in nuclear power plant safety systems:

DIGITAL SYSTEM REQUIREMENTS:
- Software development lifecycle requirements including planning, requirements analysis, design, implementation, testing
- Verification and validation requirements for software systems
- Configuration management for digital systems
- Hardware/software integration requirements

SOFTWARE QUALITY ASSURANCE:
- Software requirements specification requirements
- Software design documentation requirements
- Software testing including unit testing, integration testing, system testing
- Software maintenance and modification control

SYSTEM INTEGRATION:
- Hardware/software interface requirements
- System integration testing requirements
- Factory acceptance testing requirements
- Site acceptance testing requirements

CYBER SECURITY:
- Digital system security requirements
- Network security for digital systems
- Access control and authentication requirements
- Incident response for digital systems

VALIDATION AND VERIFICATION:
- Independent verification and validation requirements
- Test coverage requirements for software
- Requirements traceability matrix requirements
- Software reliability demonstration

This standard ensures digital systems meet the same safety criteria as analog systems in nuclear applications.`,
        tags: ['digital-systems', 'software-quality', 'cyber-security', 'verification', 'validation']
      }
    ];

    for (const standard of ieeeStandards) {
      const document: KnowledgeDocument = {
        ...standard,
        lastUpdated: new Date(),
        relevanceScore: 90
      };
      this.documents.set(standard.id, document);
    }
  }

  private async loadASMECodes() {
    const asmeCodes = [
      {
        id: 'asme-bpv-iii',
        title: 'ASME Boiler and Pressure Vessel Code Section III - Nuclear Power Plant Components',
        source: 'ASME',
        url: 'https://www.asme.org/codes-standards/find-codes-standards/bpvc-iii-bpv-code-nuclear-power-plant-components',
        category: 'standard' as const,
        content: `ASME Section III provides rules for construction of nuclear facility components:

NUCLEAR COMPONENT DESIGN:
- Class 1 components: Reactor coolant pressure boundary components including reactor vessel, steam generators, pressurizer
- Class 2 components: Important to safety components not in reactor coolant pressure boundary
- Class 3 components: Other safety-related components
- Class MC components: Metal containment vessels
- Class CC components: Concrete containment vessels

DESIGN REQUIREMENTS:
- Design by analysis requirements including stress analysis, fatigue analysis, fracture mechanics
- Material requirements including material specifications, testing, and qualification
- Fabrication requirements including welding, heat treatment, and forming
- Examination requirements including non-destructive testing methods
- Pressure testing requirements for component verification

QUALITY ASSURANCE:
- Design control requirements including design verification and validation
- Material control requirements including traceability and testing
- Fabrication control requirements including procedure qualification
- Examination and testing requirements for quality verification

SAFETY CLASSIFICATION:
- Safety-related vs non-safety-related classification criteria
- Seismic Category I design requirements
- Quality Group classification requirements
- Environmental qualification requirements

This code ensures nuclear components meet stringent safety and reliability requirements.`,
        tags: ['pressure-vessels', 'component-design', 'material-requirements', 'quality-assurance']
      }
    ];

    for (const code of asmeCodes) {
      const document: KnowledgeDocument = {
        ...code,
        lastUpdated: new Date(),
        relevanceScore: 85
      };
      this.documents.set(code.id, document);
    }
  }

  private async loadOperationalProcedures() {
    const procedures = [
      {
        id: 'emergency-operating-procedures',
        title: 'Emergency Operating Procedures (EOPs) - Nuclear Power Plant Response',
        source: 'Nuclear Industry',
        url: 'https://www.nrc.gov/reading-rm/doc-collections/gen-comm/info-notices/',
        category: 'procedure' as const,
        content: `Emergency Operating Procedures provide systematic approach to nuclear power plant emergency response:

EMERGENCY CLASSIFICATION:
- Notification of Unusual Event (NOUE): Conditions that indicate potential degradation in plant safety
- Alert: Conditions that represent actual or potential substantial degradation in plant safety
- Site Area Emergency: Conditions that represent actual or likely major failures of plant safety functions
- General Emergency: Conditions that represent actual or imminent substantial core degradation with potential for loss of containment

CRITICAL SAFETY FUNCTIONS:
- Subcriticality: Ensuring reactor is shutdown and remains shutdown
- Core cooling: Maintaining adequate core cooling to prevent fuel damage
- Heat sink: Ensuring adequate heat removal from reactor coolant system
- Reactor coolant system integrity: Maintaining primary system pressure boundary
- Containment integrity: Ensuring containment function to limit radioactive release
- Radioactivity control: Monitoring and controlling radioactive releases

OPERATOR ACTIONS:
- Immediate operator actions for reactor trip or safety injection
- Diagnostic procedures for emergency condition assessment
- Recovery procedures for restoration of critical safety functions
- Severe accident management guidelines for beyond design basis events

COMMAND AND CONTROL:
- Emergency response organization activation
- Technical support center operations
- Operations support center functions
- Emergency operations facility coordination

These procedures ensure systematic response to protect public health and safety during emergencies.`,
        tags: ['emergency-procedures', 'safety-functions', 'operator-actions', 'emergency-classification']
      },
      {
        id: 'reactor-physics-fundamentals',
        title: 'Reactor Physics and Nuclear Safety Fundamentals',
        source: 'Nuclear Engineering',
        url: 'https://www.nrc.gov/reading-rm/basic-ref/teachers/reactor-physics.html',
        category: 'technical' as const,
        content: `Fundamental principles of reactor physics and nuclear safety:

REACTOR PHYSICS PRINCIPLES:
- Neutron multiplication factor (k-effective): Ratio of neutrons produced to neutrons absorbed
- Criticality control: Maintaining k-eff at exactly 1.0 for steady-state operation
- Reactivity control: Using control rods, chemical shim, and burnable poisons
- Neutron flux distribution: Spatial and temporal neutron flux patterns in reactor core
- Delayed neutrons: Critical for reactor control and safety due to their delay time

REACTOR KINETICS:
- Point kinetics equations for reactor power changes
- Reactivity coefficients including temperature and void feedback
- Reactor period and doubling time relationships
- Subcritical multiplication and source range operation

THERMAL HYDRAULICS:
- Heat generation and removal in nuclear fuel
- Coolant flow and heat transfer mechanisms
- Critical heat flux and departure from nucleate boiling
- Natural circulation and forced circulation cooling
- Steam generator thermal performance

FISSION PRODUCT BEHAVIOR:
- Fission product generation and decay
- Noble gas and iodine release mechanisms
- Fuel cladding integrity and barrier effectiveness
- Containment performance and radioactive release pathways

SAFETY ANALYSIS:
- Design basis accidents including loss of coolant accident (LOCA)
- Reactivity insertion accidents and their consequences
- Steam line break and feed line break analyses
- Station blackout and loss of ultimate heat sink scenarios

Understanding these principles is essential for safe reactor operation and emergency response.`,
        tags: ['reactor-physics', 'thermal-hydraulics', 'safety-analysis', 'fission-products']
      }
    ];

    for (const procedure of procedures) {
      const document: KnowledgeDocument = {
        ...procedure,
        lastUpdated: new Date(),
        relevanceScore: 88
      };
      this.documents.set(procedure.id, document);
    }
  }

  private startPeriodicUpdates() {
    // Update knowledge base every 24 hours
    this.updateInterval = setInterval(async () => {
      try {
        console.log('Performing periodic knowledge repository update...');
        await this.updateDocuments();
        
        await db.insert(systemLogs).values({
          level: 'info',
          message: 'Knowledge repository periodic update completed',
          source: 'knowledge-repo'
        });
      } catch (error) {
        console.error('Error during periodic update:', error);
        
        await db.insert(systemLogs).values({
          level: 'error',
          message: `Knowledge repository update failed: ${error}`,
          source: 'knowledge-repo'
        });
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  private async updateDocuments() {
    // In a production system, this would fetch updated documents from regulatory sources
    // For now, we'll update the lastUpdated timestamp and check for new regulatory releases
    
    for (const [id, document] of this.documents.entries()) {
      // Simulate checking for updates (in production, this would make HTTP requests to regulatory sites)
      const updatedDocument = { ...document, lastUpdated: new Date() };
      this.documents.set(id, updatedDocument);
    }
  }

  public searchDocuments(query: string, category?: string): KnowledgeDocument[] {
    const searchTerms = query.toLowerCase().split(' ');
    const results: Array<{ document: KnowledgeDocument; score: number }> = [];

    for (const document of this.documents.values()) {
      if (category && document.category !== category) continue;

      let score = 0;
      const searchText = `${document.title} ${document.content} ${document.tags.join(' ')}`.toLowerCase();

      // Score based on search term matches
      for (const term of searchTerms) {
        const titleMatches = (document.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const contentMatches = (document.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const tagMatches = document.tags.filter(tag => tag.toLowerCase().includes(term)).length;

        score += titleMatches * 10 + contentMatches * 2 + tagMatches * 5;
      }

      // Add relevance score
      score += document.relevanceScore * 0.1;

      if (score > 0) {
        results.push({ document, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(result => result.document);
  }

  public getDocumentById(id: string): KnowledgeDocument | undefined {
    return this.documents.get(id);
  }

  public getDocumentsByCategory(category: string): KnowledgeDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.category === category)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public getAllDocuments(): KnowledgeDocument[] {
    return Array.from(this.documents.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public getRecentlyUpdated(hours: number = 24): KnowledgeDocument[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.documents.values())
      .filter(doc => doc.lastUpdated > cutoff)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }

  public generateKnowledgeSummary(): string {
    const categories = ['regulation', 'safety', 'technical', 'procedure', 'standard'];
    const summary = categories.map(category => {
      const docs = this.getDocumentsByCategory(category);
      return `${category.toUpperCase()}: ${docs.length} documents`;
    }).join(' | ');

    return `Knowledge Repository Status: ${this.documents.size} total documents (${summary})`;
  }

  public async logKnowledgeAccess(documentId: string, userId?: string) {
    const document = this.getDocumentById(documentId);
    if (document) {
      await db.insert(systemLogs).values({
        level: 'info',
        message: `Knowledge document accessed: ${document.title} (${documentId})`,
        source: 'knowledge-repo'
      });
    }
  }

  public stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const knowledgeRepository = new NuclearKnowledgeRepository();