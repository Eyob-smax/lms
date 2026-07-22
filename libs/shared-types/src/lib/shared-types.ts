export enum Role {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum LessonType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  PDF_FILE = 'PDF_FILE',
  SLIDES = 'SLIDES',
}

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum EnrollmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}
