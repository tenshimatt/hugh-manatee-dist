import { PrismaClient, WorkflowState as PrismaWorkflowState, Prisma } from '@prisma/client';

// Note: Using different enum name to avoid conflict with Prisma model name
export enum WorkflowStateEnum {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW', 
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface WorkflowStateCreateInput {
  documentId: string;
  state: WorkflowStateEnum;
  assignedToId?: string;
  comments?: Prisma.JsonValue;
  deadline?: Date;
  requirements?: Prisma.JsonValue;
}

export interface WorkflowStateUpdateInput {
  state?: WorkflowStateEnum;
  assignedToId?: string;
  comments?: Prisma.JsonValue;
  deadline?: Date;
  requirements?: Prisma.JsonValue;
}

export interface WorkflowStateQueryOptions {
  includeRelations?: {
    document?: boolean;
    assignedTo?: boolean;
  };
  orderBy?: Prisma.WorkflowStateOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface WorkflowComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string; // ISO string
  type: 'comment' | 'status_change' | 'assignment' | 'deadline_update';
  metadata?: Record<string, any>;
}

export interface WorkflowTransition {
  id: string;
  fromState: WorkflowStateEnum;
  toState: WorkflowStateEnum;
  authorId: string;
  authorName: string;
  timestamp: string; // ISO string
  reason?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowRequirements {
  reviewers?: {
    required: number;
    approved: string[]; // User IDs who approved
    minimum: number;
  };
  checklist?: {
    id: string;
    description: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: string;
  }[];
  approvalCriteria?: {
    wordCountMin?: number;
    wordCountMax?: number;
    sectionsRequired?: string[];
    templatesCompliance?: boolean;
  };
  deadline?: {
    type: 'soft' | 'hard';
    date: string;
    reminder?: {
      days: number;
      sent: boolean;
    };
  };
}

export interface WorkflowStats {
  totalDocuments: number;
  byState: Record<WorkflowStateEnum, number>;
  averageTimeInState: Record<WorkflowStateEnum, number>; // hours
  overdueTasks: number;
  completionRate: number; // percentage
}

export class WorkflowStateModel {
  private readonly VALID_TRANSITIONS: Record<WorkflowStateEnum, WorkflowStateEnum[]> = {
    [WorkflowStateEnum.DRAFT]: [WorkflowStateEnum.UNDER_REVIEW, WorkflowStateEnum.ARCHIVED],
    [WorkflowStateEnum.UNDER_REVIEW]: [WorkflowStateEnum.DRAFT, WorkflowStateEnum.APPROVED, WorkflowStateEnum.ARCHIVED],
    [WorkflowStateEnum.APPROVED]: [WorkflowStateEnum.PUBLISHED, WorkflowStateEnum.UNDER_REVIEW, WorkflowStateEnum.ARCHIVED],
    [WorkflowStateEnum.PUBLISHED]: [WorkflowStateEnum.ARCHIVED],
    [WorkflowStateEnum.ARCHIVED]: [], // Terminal state
  };

  constructor(private prisma: PrismaClient) {}

  async create(data: WorkflowStateCreateInput): Promise<PrismaWorkflowState> {
    // Check if workflow state already exists for document
    const existingState = await this.findByDocumentId(data.documentId);
    if (existingState) {
      throw new Error('Workflow state already exists for this document');
    }

    // Validate initial state requirements
    this.validateStateRequirements(data.state, data);

    const workflowState = await this.prisma.workflowState.create({
      data: {
        documentId: data.documentId,
        state: data.state,
        assignedToId: data.assignedToId,
        comments: data.comments || [],
        deadline: data.deadline,
        transitions: [],
        requirements: data.requirements || {},
      },
    });

    // Add initial transition record
    await this.addTransition(workflowState.id, {
      fromState: data.state, // Initial state
      toState: data.state,
      authorId: data.assignedToId || 'system',
      reason: 'Initial workflow state creation',
    });

    return workflowState;
  }

  async findById(id: string, options?: WorkflowStateQueryOptions): Promise<PrismaWorkflowState | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.workflowState.findUnique({
      where: { id },
      include,
    });
  }

  async findByDocumentId(documentId: string, options?: WorkflowStateQueryOptions): Promise<PrismaWorkflowState | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.workflowState.findUnique({
      where: { documentId },
      include,
    });
  }

  async findByState(state: WorkflowStateEnum, options?: WorkflowStateQueryOptions): Promise<PrismaWorkflowState[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.workflowState.findMany({
      where: { state },
      include,
      orderBy: options?.orderBy || [{ updatedAt: 'asc' }], // Oldest first for processing
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByAssignee(assignedToId: string, options?: WorkflowStateQueryOptions): Promise<PrismaWorkflowState[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.workflowState.findMany({
      where: { assignedToId },
      include,
      orderBy: options?.orderBy || [{ deadline: 'asc' }, { updatedAt: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findOverdueTasks(assignedToId?: string): Promise<PrismaWorkflowState[]> {
    const where: Prisma.WorkflowStateWhereInput = {
      deadline: {
        lt: new Date(),
      },
      state: {
        not: WorkflowStateEnum.ARCHIVED,
      },
    };

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    return this.prisma.workflowState.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ deadline: 'asc' }],
    });
  }

  async transitionState(
    documentId: string,
    newState: WorkflowStateEnum,
    authorId: string,
    options?: {
      reason?: string;
      assignedToId?: string;
      deadline?: Date;
      requirements?: WorkflowRequirements;
    }
  ): Promise<PrismaWorkflowState> {
    const workflowState = await this.findByDocumentId(documentId);
    if (!workflowState) {
      throw new Error('Workflow state not found for document');
    }

    // Validate transition
    this.validateTransition(workflowState.state as WorkflowStateEnum, newState);

    // Validate state requirements
    this.validateStateRequirements(newState, {
      assignedToId: options?.assignedToId,
      deadline: options?.deadline,
      requirements: options?.requirements,
    });

    // Record the transition
    const transitions = workflowState.transitions as WorkflowTransition[];
    const newTransition: WorkflowTransition = {
      id: this.generateId(),
      fromState: workflowState.state as WorkflowStateEnum,
      toState: newState,
      authorId,
      authorName: await this.getUserName(authorId),
      timestamp: new Date().toISOString(),
      reason: options?.reason,
    };

    transitions.push(newTransition);

    // Update workflow state
    const updateData: any = {
      state: newState,
      transitions,
      updatedAt: new Date(),
    };

    if (options?.assignedToId !== undefined) {
      updateData.assignedToId = options.assignedToId;
    }

    if (options?.deadline !== undefined) {
      updateData.deadline = options.deadline;
    }

    if (options?.requirements !== undefined) {
      updateData.requirements = options.requirements;
    }

    const updatedState = await this.prisma.workflowState.update({
      where: { documentId },
      data: updateData,
    });

    // Also update the document status to match workflow state
    await this.syncDocumentStatus(documentId, newState);

    return updatedState;
  }

  async addComment(
    documentId: string,
    authorId: string,
    content: string,
    type: WorkflowComment['type'] = 'comment'
  ): Promise<PrismaWorkflowState> {
    const workflowState = await this.findByDocumentId(documentId);
    if (!workflowState) {
      throw new Error('Workflow state not found for document');
    }

    const comments = workflowState.comments as WorkflowComment[];
    const newComment: WorkflowComment = {
      id: this.generateId(),
      authorId,
      authorName: await this.getUserName(authorId),
      content,
      timestamp: new Date().toISOString(),
      type,
    };

    comments.push(newComment);

    return this.prisma.workflowState.update({
      where: { documentId },
      data: {
        comments,
        updatedAt: new Date(),
      },
    });
  }

  async assignTo(documentId: string, assignedToId: string | null, authorId: string): Promise<PrismaWorkflowState> {
    const workflowState = await this.findByDocumentId(documentId);
    if (!workflowState) {
      throw new Error('Workflow state not found for document');
    }

    // Add assignment comment
    const assignmentMessage = assignedToId 
      ? `Assigned to ${await this.getUserName(assignedToId)}`
      : 'Assignment removed';

    await this.addComment(documentId, authorId, assignmentMessage, 'assignment');

    return this.prisma.workflowState.update({
      where: { documentId },
      data: {
        assignedToId,
        updatedAt: new Date(),
      },
    });
  }

  async updateDeadline(documentId: string, deadline: Date | null, authorId: string): Promise<PrismaWorkflowState> {
    const workflowState = await this.findByDocumentId(documentId);
    if (!workflowState) {
      throw new Error('Workflow state not found for document');
    }

    // Add deadline comment
    const deadlineMessage = deadline 
      ? `Deadline set to ${deadline.toLocaleDateString()}`
      : 'Deadline removed';

    await this.addComment(documentId, authorId, deadlineMessage, 'deadline_update');

    return this.prisma.workflowState.update({
      where: { documentId },
      data: {
        deadline,
        updatedAt: new Date(),
      },
    });
  }

  async updateRequirements(documentId: string, requirements: WorkflowRequirements): Promise<PrismaWorkflowState> {
    return this.prisma.workflowState.update({
      where: { documentId },
      data: {
        requirements: requirements as Prisma.JsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async checkRequirements(documentId: string): Promise<{
    met: boolean;
    missing: string[];
    details: Record<string, any>;
  }> {
    const workflowState = await this.findByDocumentId(documentId, {
      includeRelations: { document: true },
    });

    if (!workflowState) {
      throw new Error('Workflow state not found for document');
    }

    const requirements = workflowState.requirements as WorkflowRequirements;
    const missing: string[] = [];
    const details: Record<string, any> = {};

    // Check reviewer requirements
    if (requirements.reviewers) {
      const approvedCount = requirements.reviewers.approved?.length || 0;
      const requiredCount = requirements.reviewers.required || 1;
      
      if (approvedCount < requiredCount) {
        missing.push(`Need ${requiredCount - approvedCount} more approvals`);
      }
      
      details.reviewers = {
        approved: approvedCount,
        required: requiredCount,
        approvers: requirements.reviewers.approved,
      };
    }

    // Check checklist requirements
    if (requirements.checklist) {
      const incomplete = requirements.checklist.filter(item => !item.completed);
      if (incomplete.length > 0) {
        missing.push(`${incomplete.length} checklist items incomplete`);
      }
      
      details.checklist = {
        total: requirements.checklist.length,
        completed: requirements.checklist.length - incomplete.length,
        incomplete: incomplete.map(item => item.description),
      };
    }

    // Check approval criteria
    if (requirements.approvalCriteria && workflowState.document) {
      const criteria = requirements.approvalCriteria;
      const document = workflowState.document as any;

      if (criteria.wordCountMin && document.wordCount < criteria.wordCountMin) {
        missing.push(`Document needs at least ${criteria.wordCountMin} words`);
      }

      if (criteria.wordCountMax && document.wordCount > criteria.wordCountMax) {
        missing.push(`Document exceeds maximum ${criteria.wordCountMax} words`);
      }

      details.approvalCriteria = {
        wordCount: document.wordCount,
        wordCountMin: criteria.wordCountMin,
        wordCountMax: criteria.wordCountMax,
      };
    }

    return {
      met: missing.length === 0,
      missing,
      details,
    };
  }

  async getWorkflowStats(assignedToId?: string): Promise<WorkflowStats> {
    const where: Prisma.WorkflowStateWhereInput = {};
    
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const [totalCount, stateStats, overdueTasks] = await Promise.all([
      this.prisma.workflowState.count({ where }),
      
      this.prisma.workflowState.groupBy({
        by: ['state'],
        where,
        _count: { state: true },
      }),
      
      this.prisma.workflowState.count({
        where: {
          ...where,
          deadline: { lt: new Date() },
          state: { not: WorkflowStateEnum.ARCHIVED },
        },
      }),
    ]);

    const byState = Object.fromEntries(
      Object.values(WorkflowStateEnum).map(state => [
        state,
        stateStats.find(stat => stat.state === state)?._count.state || 0,
      ])
    ) as Record<WorkflowStateEnum, number>;

    // Calculate completion rate (published + archived / total)
    const completedCount = byState[WorkflowStateEnum.PUBLISHED] + byState[WorkflowStateEnum.ARCHIVED];
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Calculate average time in state (simplified)
    const averageTimeInState = Object.fromEntries(
      Object.values(WorkflowStateEnum).map(state => [state, 24]) // Placeholder: 24 hours
    ) as Record<WorkflowStateEnum, number>;

    return {
      totalDocuments: totalCount,
      byState,
      averageTimeInState,
      overdueTasks,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  async delete(documentId: string): Promise<PrismaWorkflowState> {
    return this.prisma.workflowState.delete({
      where: { documentId },
    });
  }

  private validateTransition(fromState: WorkflowStateEnum, toState: WorkflowStateEnum): void {
    const validTransitions = this.VALID_TRANSITIONS[fromState];
    if (!validTransitions.includes(toState)) {
      throw new Error(`Invalid transition from ${fromState} to ${toState}`);
    }
  }

  private validateStateRequirements(state: WorkflowStateEnum, data: any): void {
    switch (state) {
      case WorkflowStateEnum.UNDER_REVIEW:
        if (!data.assignedToId) {
          throw new Error('Reviewer assignment required for UNDER_REVIEW state');
        }
        break;
      
      case WorkflowStateEnum.APPROVED:
        // Could add approval validation logic here
        break;
      
      case WorkflowStateEnum.PUBLISHED:
        // Could add publication validation logic here
        break;
    }
  }

  private async syncDocumentStatus(documentId: string, workflowState: WorkflowStateEnum): Promise<void> {
    // Map workflow states to document statuses
    const statusMapping = {
      [WorkflowStateEnum.DRAFT]: 'DRAFT',
      [WorkflowStateEnum.UNDER_REVIEW]: 'UNDER_REVIEW',
      [WorkflowStateEnum.APPROVED]: 'APPROVED',
      [WorkflowStateEnum.PUBLISHED]: 'PUBLISHED',
      [WorkflowStateEnum.ARCHIVED]: 'ARCHIVED',
    };

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: statusMapping[workflowState] as any },
    });
  }

  private async addTransition(workflowStateId: string, transition: Omit<WorkflowTransition, 'id' | 'timestamp' | 'authorName'>): Promise<void> {
    const workflowState = await this.findById(workflowStateId);
    if (!workflowState) return;

    const transitions = workflowState.transitions as WorkflowTransition[];
    const newTransition: WorkflowTransition = {
      id: this.generateId(),
      ...transition,
      authorName: await this.getUserName(transition.authorId),
      timestamp: new Date().toISOString(),
    };

    transitions.push(newTransition);

    await this.prisma.workflowState.update({
      where: { id: workflowStateId },
      data: { transitions },
    });
  }

  private async getUserName(userId: string): Promise<string> {
    if (userId === 'system') return 'System';
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    
    return user?.name || 'Unknown User';
  }

  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildInclude(relations?: WorkflowStateQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      document: relations.document ? {
        select: {
          id: true,
          title: true,
          status: true,
          wordCount: true,
          updatedAt: true,
        },
      } : false,
      assignedTo: relations.assignedTo ? {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        },
      } : false,
    };
  }
}

export default WorkflowStateModel;