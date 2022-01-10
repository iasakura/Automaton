import { IdType } from './Automaton';

export interface Traveler {
  transitTo(next: IdType): Promise<void>;
  getCurrent(): IdType;
  finish(): Promise<void>;
  error(msg: string): Promise<void>;
}
