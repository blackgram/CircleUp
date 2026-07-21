export interface UpdateRoomSettingsRequest {
  maxPlayers?: number;
  privateRoom?: boolean;
  gameOptions?: Record<string, unknown>;
}
