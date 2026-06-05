export type SessionStatus = 'waiting' | 'spinning' | 'voted' | 'closed'
export type SpinResult = 'pending' | 'accepted' | 'rejected'

export interface ActivityDto {
  id: string
  title: string
  category: string
  tags: string[]
  minPlayers: number
  maxPlayers: number
}

export interface MemberDto {
  id: string
  guestName?: string
  username?: string
  isHost: boolean
}

export interface VoteResultDto {
  spinId: string
  result: SpinResult
  activity: ActivityDto
  yes: number
  no: number
}