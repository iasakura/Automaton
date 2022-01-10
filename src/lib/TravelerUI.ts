import { Position } from "vis-network/standalone";

export interface TravelerUI {
  onTokenMove(point: Position): Promise<void>;
  onFinish(): Promise<void>;
  onError(msg: string): Promise<void>;
  onCurrentAlphabetChange(msg: string): Promise<void>;
}
