import { DataSet, Network, Options } from 'vis-network/standalone';
import jsyaml from 'js-yaml';

export type IdType = string;
export type Alphabet = string & { length: 1 };

class State {
  next: Map<Alphabet, IdType>;
  constructor(public id: IdType) {
    this.next = new Map();
  }

  push(char: Alphabet, state: IdType) {
    this.next.set(char, state);
  }

  getNext(alpha: Alphabet): IdType | undefined {
    return this.next.get(alpha);
  }
}

export class Automaton {
  constructor(
    public init_state: IdType,
    private states: Map<IdType, State>,
    private accepting_state: Set<IdType>
  ) {}

  getNext(cur: IdType, input: Alphabet): IdType | undefined {
    return this.states.get(cur)?.getNext(input);
  }

  getTransition(cur: IdType): Map<Alphabet, IdType> | undefined {
    return this.states.get(cur)?.next;
  }

  isAcceptingState(state: IdType) {
    return this.accepting_state.has(state);
  }

  static parse(text: string): Automaton {
    let states = new Map<IdType, State>();

    const yaml = jsyaml.load(text) as {
      init_state: Object;
      nodes: Object[];
      transitions: Record<string, Record<string, Object>>;
      accepting_state: Object[];
    };

    if (yaml.init_state === undefined) {
      throw Error('Cannot find init_state');
    }
    const init_state = yaml.init_state.toString();

    if (yaml.accepting_state === undefined) {
      throw Error('Cannot find accepting_state');
    }
    const accepting_state = new Set(
      yaml.accepting_state.map((s) => s.toString())
    );

    for (const state of yaml.nodes) {
      const s = state.toString();
      states.set(s, new State(s));
    }

    for (const [from, alpha_to] of Object.entries(yaml.transitions)) {
      for (const [alpha, to] of Object.entries(alpha_to)) {
        if (alpha.length !== 1) {
          throw Error('The length of alpha should be 1');
        }
        if (!states.has(from)) {
          throw Error(`The state ${from} doesn't exists`);
        }
        states.get(from)?.push(alpha as Alphabet, to.toString());
      }
    }

    return new Automaton(init_state, states, accepting_state);
  }

  asVisNetwork(container: HTMLElement, options: Options): Network {
    const nodes = Array.from(this.states.keys()).map((id) => {
      return { id: id, label: id };
    });

    let edges: { from: string; to: string; label: string }[] = [];
    this.states.forEach((state, from) => {
      state.next.forEach((next, alpha) => {
        edges.push({ from, to: next, label: alpha });
      });
    });

    return new Network(
      container,
      {
        nodes: new DataSet(nodes),
        edges: new DataSet(edges),
      },
      options
    );
  }
}
