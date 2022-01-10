import { State } from 'js-yaml';
import { Automaton, IdType, Alphabet } from './Automaton';
import { Traveler } from './Traveler';

export class Executor {
  constructor(
    private automaton: Automaton,
    private graphVisitor: Traveler
  ) {}

  async execute(input: string) {
    let cur = this.automaton.init_state;

    for (let idx = 0; idx < input.length; ++idx) {
      let alpha = input[idx] as Alphabet;
      let next = this.automaton.getNext(cur, alpha);

      if (next === undefined) {
        await this.graphVisitor.error('Cannot find next state');
        return;
      }
      cur = next;
      await this.graphVisitor.transitTo(next);
    }

    if (this.automaton.isAcceptingState(cur)) {
      return await this.graphVisitor.finish();
    } else {
      return await this.graphVisitor.error('Finished with non-accepting state');
    }
  }
}
