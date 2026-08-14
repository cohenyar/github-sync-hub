// SQL-removal pass — referenceSql dropped: it's only present on a SQL
// mission (see GameMissionContent), so it can no longer be a universally
// required field now that question missions exist.
export const MISSION_CONTENT_REQUIRED_FIELDS = ['id', 'title', 'goal', 'prompt'] as const
