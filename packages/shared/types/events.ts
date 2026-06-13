export const LOBBY_EVENTS = {
  JOIN: 'lobby:join',
  JOINED: 'lobby:joined',
  MEMBER_JOINED: 'lobby:member_joined',
  MEMBER_LEFT: 'lobby:member_left',
  SET_PREFS: 'lobby:set_prefs',
  PREF_UPDATED: 'lobby:pref_updated',
  START: 'lobby:start',
} as const

export const SESSION_EVENTS = {
  JOIN: 'session:join',
  STARTED: 'session:started',
  SPIN: 'session:spin',
  SPIN_STARTED: 'session:spin_started',
  ACTIVITY: 'session:activity',
  VOTE: 'session:vote',
  VOTE_UPDATE: 'session:vote_update',
  VOTE_RESULT: 'session:vote_result',
  CLOSE: 'session:close',
  CLOSED: 'session:closed',
} as const