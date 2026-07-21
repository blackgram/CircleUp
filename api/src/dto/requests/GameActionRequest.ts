export interface GameActionRequest<T = unknown> {
  action: string;
  payload: T;
}
