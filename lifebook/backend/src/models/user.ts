import { PrismaClient, User, UserRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface UserCreateInput {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  role?: UserRole;
  preferences?: Prisma.JsonValue;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  avatar?: string;
  role?: UserRole;
  preferences?: Prisma.JsonValue;
  lastActiveAt?: Date;
  isActive?: boolean;
}

export interface UserAuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

export interface UserQueryOptions {
  includeRelations?: {
    createdDocuments?: boolean;
    ownedDocuments?: boolean;
    documentPermissions?: boolean;
    versions?: boolean;
    exports?: boolean;
    collaborationSessions?: boolean;
    workflowStates?: boolean;
  };
  orderBy?: Prisma.UserOrderByWithRelationInput[];
  take?: number;
  skip?: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class UserModel {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly SALT_ROUNDS: number;

  constructor(private prisma: PrismaClient) {
    this.JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    this.SALT_ROUNDS = 12;
  }

  async create(data: UserCreateInput): Promise<User> {
    // Validate email uniqueness
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate email format
    if (!this.validateEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate name length
    if (!data.name || data.name.length < 1 || data.name.length > 100) {
      throw new Error('Name must be between 1 and 100 characters');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await this.hashPassword(data.password);
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        password: hashedPassword,
        avatar: data.avatar,
        role: data.role || UserRole.VIEWER,
        preferences: data.preferences || {},
        lastActiveAt: new Date(),
        isActive: true,
      },
    });

    return user;
  }

  async findById(id: string, options?: UserQueryOptions): Promise<User | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findUnique({
      where: { id },
      include,
    });
  }

  async findByEmail(email: string, options?: UserQueryOptions): Promise<User | null> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include,
    });
  }

  async findMany(options?: UserQueryOptions): Promise<User[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findMany({
      include,
      orderBy: options?.orderBy || [{ createdAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findActiveUsers(options?: UserQueryOptions): Promise<User[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findMany({
      where: { isActive: true },
      include,
      orderBy: options?.orderBy || [{ lastActiveAt: 'desc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async findByRole(role: UserRole, options?: UserQueryOptions): Promise<User[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findMany({
      where: { role, isActive: true },
      include,
      orderBy: options?.orderBy || [{ name: 'asc' }],
      take: options?.take,
      skip: options?.skip,
    });
  }

  async authenticate(email: string, password: string): Promise<UserAuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    if (!user.password) {
      throw new Error('Password authentication not set up for this user');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last active timestamp
    await this.updateLastActive(user.id);

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      // Verify user still exists and is active
      const user = await this.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async refreshToken(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    return this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async update(id: string, data: UserUpdateInput): Promise<User> {
    // Validate email uniqueness if email is being updated
    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already exists');
      }

      if (!this.validateEmail(data.email)) {
        throw new Error('Invalid email format');
      }
    }

    // Validate name length if name is being updated
    if (data.name !== undefined) {
      if (!data.name || data.name.length < 1 || data.name.length > 100) {
        throw new Error('Name must be between 1 and 100 characters');
      }
    }

    const updateData: any = { ...data };
    if (data.email) {
      updateData.email = data.email.toLowerCase().trim();
    }
    if (data.name) {
      updateData.name = data.name.trim();
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || !user.password) {
      throw new Error('User not found or password not set');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateLastActive(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async deactivateUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivateUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getUserStats(userId: string): Promise<{
    documentsCreated: number;
    documentsOwned: number;
    totalWordCount: number;
    lastActivity: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdDocuments: {
          select: { wordCount: true },
        },
        ownedDocuments: {
          select: { wordCount: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalWordCount = [
      ...user.createdDocuments,
      ...user.ownedDocuments,
    ].reduce((sum, doc) => sum + doc.wordCount, 0);

    return {
      documentsCreated: user.createdDocuments.length,
      documentsOwned: user.ownedDocuments.length,
      totalWordCount,
      lastActivity: user.lastActiveAt,
    };
  }

  async searchUsers(query: string, options?: UserQueryOptions): Promise<User[]> {
    const include = this.buildInclude(options?.includeRelations);
    
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include,
      orderBy: [{ name: 'asc' }],
      take: options?.take || 20,
      skip: options?.skip,
    });
  }

  private generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    this.validatePasswordStrength(password);
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private buildInclude(relations?: UserQueryOptions['includeRelations']) {
    if (!relations) return undefined;

    return {
      createdDocuments: relations.createdDocuments || false,
      ownedDocuments: relations.ownedDocuments || false,
      documentPermissions: relations.documentPermissions || false,
      versions: relations.versions || false,
      exports: relations.exports || false,
      collaborationSessions: relations.collaborationSessions || false,
      workflowStates: relations.workflowStates || false,
    };
  }
}

export default UserModel;