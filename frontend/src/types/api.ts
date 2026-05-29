// ── Enums ────────────────────────────────────────────────
export type Belt =
  | 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK'
  | 'GRAY_WHITE' | 'GRAY' | 'GRAY_BLACK'
  | 'YELLOW_WHITE' | 'YELLOW' | 'YELLOW_BLACK'
  | 'ORANGE_WHITE' | 'ORANGE' | 'ORANGE_BLACK'
  | 'GREEN_WHITE' | 'GREEN' | 'GREEN_BLACK'

export type TrainingType = 'GI' | 'NO_GI'
export type ClassType = 'REGULAR' | 'PRIVATE' | 'OPEN_MAT' | 'SEMINAR' | 'CAMP' | 'COMPETITION' | 'TEACHING'
export type TechniqueType = 'SUBMISSION' | 'PIN' | 'POSITION' | 'GUARD_PASS' | 'GUARD_POSITION' | 'SCAPE' | 'SWEEP' | 'TAKEDOWN' | 'GRIP'
export type TechniqueTarget =
  | 'HEAD' | 'NECK' | 'SHOULDER' | 'TORSO' | 'LEG' | 'FOOT' | 'ANKLE'
  | 'KNEE' | 'HIP' | 'BACK' | 'SPINE' | 'ARM' | 'ELBOW' | 'WRIST' | 'HAND'
  | 'GUARD_PASS' | 'GUARD_POSITION' | 'PIN' | 'TAKEDOWN' | 'SWEEP' | 'ESCAPE'
export type CheckInStatus = 'REGISTERED' | 'CONFIRMED' | 'CANCELED'
export type UserRole = 'CUSTOMER' | 'PLATFORM_MANAGER' | 'ADMIN'
export type MemberRole = 'OWNER' | 'MANAGER' | 'INSTRUCTOR' | 'STUDENT'
export type MemberStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE'
export type ClassStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELED'
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

// ── Generic ──────────────────────────────────────────────
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
  violations?: { field: string; message: string }[]
}

// ── Academy ──────────────────────────────────────────────
export interface AcademyRequest {
  name: string
  address: string
}

export interface AcademyResponse {
  id: string
  name: string
  address: string
}

export interface AcademyMemberRequest {
  userId: string
  role: MemberRole
  status?: MemberStatus
  belt?: Belt
  beltStripe?: number
}

export interface AcademyMemberResponse {
  academyId: string
  academyName: string
  academyAddress?: string
  user: ProfileResponse
  role: MemberRole
  status: MemberStatus
  belt?: Belt
  beltStripe?: number
}

export interface GraduationRequest {
  newBelt: Belt
  newStripe: number
}

// ── Profile ──────────────────────────────────────────────
export interface ProfileRequest {
  name: string
  secondName?: string
  nickname: string
  belt?: Belt
  beltStripe?: number
  startsIn?: string
}

export interface ProfileResponse {
  id: string
  name: string
  secondName?: string
  nickname: string
  belt?: Belt
  beltStripe?: number
  startsIn?: string
  photoUrl?: string
  role: UserRole
}

export interface SearchProfileResponse {
  id: string
  name: string
  secondName?: string
  nickname: string
  belt?: Belt
  beltStripe?: number
  startsIn?: string
}

// ── Technique ────────────────────────────────────────────
export interface TechniqueRequest {
  name: string
  type: TechniqueType
  target: TechniqueTarget
  parentId?: number
}

export interface TechniqueResponse {
  id: number
  name: string
  parent?: TechniqueResponse | null
  type: TechniqueType
  target: TechniqueTarget
}

// ── Scheduled Class ──────────────────────────────────────
export interface ScheduledClassRequest {
  academyId: string
  instructorId: string
  startTime: string
  durationMinutes: number
  classType: ClassType
  trainingType: TrainingType
  techniqueIds?: number[]
  templateId?: number
  status?: ClassStatus
}

export interface ScheduledClassResponse {
  id: number
  academyId: string
  academyName: string
  instructor: ProfileResponse
  startTime: string
  durationMinutes: number
  classType: ClassType
  trainingType: TrainingType
  scheduledTechniques: TechniqueResponse[]
  status: ClassStatus
}

// ── Attendance / Check-in ────────────────────────────────
export interface CheckInRequest {
  studentId: string
}

export interface CheckInResponse {
  id: number
  classId: number
  student: ProfileResponse
  status: CheckInStatus
  checkInTime: string | null
}

export interface AcademyMenberClassViewResponse {
  id: number
  scheduledClass: ScheduledClassResponse
  status: CheckInStatus
  checkInTime: string | null
}

export interface GraduationHistoryResponse {
  id: number
  academyId: string
  academyName: string
  student: ProfileResponse
  promotedBy: ProfileResponse
  oldBelt: Belt
  oldStripe: number
  newBelt: Belt
  newStripe: number
  graduationDate: string
}

// ── Training ──────────────────────────────────────────────
export interface TechniqueSummaryResponse {
  id: number
  name: string
}

export interface TrainingRequest {
  classType: ClassType
  trainingType: TrainingType
  sessionDate: string
  durationMinutes: number
  techniqueIds?: number[]
  submissionTechniqueIds?: number[]
  submissionTechniqueAllowedIds?: number[]
  totalRolls: number
  roundLengthMinutes: number
  restLengthMinutes: number
  cardioRating: number
  intensityRating: number
  taps: number
  submissions: number
  escapes: number
  sweeps: number
  takedowns: number
  guardPasses: number
  description?: string
}

export interface TrainingResponse {
  id: number
  classType: ClassType
  trainingType: TrainingType
  sessionDate: string
  durationMinutes: number
  techniques: TechniqueSummaryResponse[]
  submissionTechniques: TechniqueSummaryResponse[]
  submissionTechniquesAllowed: TechniqueSummaryResponse[]
  totalRolls: number
  roundLengthMinutes: number
  restLengthMinutes: number
  cardioRating: number
  intensityRating: number
  taps: number
  submissions: number
  escapes: number
  sweeps: number
  takedowns: number
  guardPasses: number
  profile: ProfileResponse
  description?: string
}

export interface TrainingStatsResponse {
  totalSessions: number
  totalMinutes: number
  avgCardioRating: number
  avgIntensityRating: number
  totalTaps: number
  totalSubmissions: number
  totalEscapes: number
  totalSweeps: number
  totalTakedowns: number
  totalGuardPasses: number
  totalRolls: number
}

export interface TechniqueCount {
  name: string
  count: number
  percentage: number
}

export interface DashboardResponse {
  current: TrainingStatsResponse
  previous: TrainingStatsResponse
  topAttacks: TechniqueCount[]
  topDefenses: TechniqueCount[]
}

// ── Template ─────────────────────────────────────────────
export interface ClassRecurrenceRule {
  dayOfWeek: DayOfWeek
  startTime: string  // "HH:mm:ss"
}

export interface GenerateClassesRequest {
  startDate: string  // "YYYY-MM-DD"
  endDate: string
}

export interface ClassTemplateRequest {
  name: string
  instructorId: string
  classType: ClassType
  trainingType: TrainingType
  durationMinutes: number
  techniqueIds?: number[]
  recurrenceRules: ClassRecurrenceRule[]
}

export interface ClassTemplateResponse {
  id: string
  name: string
  instructor: ProfileResponse
  classType: ClassType
  trainingType: TrainingType
  durationMinutes: number
  techniques: TechniqueResponse[]
  recurrenceRules: ClassRecurrenceRule[]
}
