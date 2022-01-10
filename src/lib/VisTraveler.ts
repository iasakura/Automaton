import { EdgeBase } from 'vis-network/declarations/network/modules/components/edges';
import { IdType as VisIdType, Network, Position } from 'vis-network/standalone';
import { Traveler } from './Traveler';
import { Automaton, IdType } from './Automaton';
import { TravelerUI } from './TravelerUI';

// leak private field `Network.body.edges`
type HackedNetwork = Network & {
  body: { edges: { [index: string]: { edgeType: EdgeBase } } };
};

const getEdgeFromId = (network: Network, id: VisIdType) => {
  return (network as HackedNetwork).body.edges[id].edgeType;
};

type TokenState =
  | {
      state: 'inEdge';
      edgeId: IdType;
      nextId: IdType;
      elapsed: number;
    }
  | {
      state: 'inFromNode';
      fromPos: Position;
      toPos: Position;
      nodeId: IdType;
      nextId: IdType;
      elapsed: number;
    }
  | {
      state: 'inToNode';
      fromPos: Position;
      toPos: Position;
      elapsed: number;
    };

const updateState = (
  state: TokenState,
  network: Network
): TokenState | undefined => {
  // Finish
  if (state.elapsed >= 1.0) {
    if (state.state == 'inFromNode') {
      const edgeId = findEdge(network, state.nodeId, state.nextId);
      if (typeof edgeId === 'number') {
        fail('edge id should be string');
      }
      return { state: 'inEdge', edgeId, nextId: state.nextId, elapsed: 0 };
    } else if (state.state === 'inToNode') {
      // Finish transition
      return undefined;
    } else if (state.state === 'inEdge') {
      const fromPos = getEdgeFromId(network, state.edgeId).getPoint(1);
      const toPos = network.getPosition(state.nextId);
      return {
        state: 'inToNode',
        fromPos,
        toPos,
        elapsed: 0,
      };
    } else {
      // never
      return state;
    }
  } else {
    return {
      ...state,
      elapsed: state.elapsed + (state.state === 'inEdge' ? 0.02 : 0.1),
    };
  }
};

const computeTokenPos = (state: TokenState, network: Network): Position => {
  let canvasPos;
  if (state.state === 'inEdge') {
    canvasPos = getEdgeFromId(network, state.edgeId).getPoint(state.elapsed);
  } else if (state.state === 'inFromNode' || state.state === 'inToNode') {
    canvasPos = {
      x: state.fromPos.x + state.elapsed * (state.toPos.x - state.fromPos.x),
      y: state.fromPos.y + state.elapsed * (state.toPos.y - state.fromPos.y),
    };
  } else {
    // never
    return state;
  }

  return network.canvasToDOM(canvasPos);
};

const findEdge = (network: Network, from: IdType, to: IdType) => {
  const edges = network.getConnectedEdges(from).filter((edgeId) => {
    const [edge_from, edge_to] = network.getConnectedNodes(
      edgeId
    ) as VisIdType[];
    return from === edge_from && to == edge_to;
  });
  if (edges.length === 0) {
    throw Error('Cannot find edges');
  } else if (edges.length > 1) {
    throw Error('TODO: find more than 1 edges');
  }
  return edges[0];
};

export class VisTraveler implements Traveler {
  private current: IdType;
  constructor(
    init: IdType,
    private ui: TravelerUI,
    private network: Network,
    private automaton: Automaton
  ) {
    this.current = init;
  }

  transitTo(nextId: IdType): Promise<void> {
    const fromPos = this.network.getPosition(this.current);
    const toPos = getEdgeFromId(
      this.network,
      findEdge(this.network, this.current, nextId)
    ).getPoint(0);
    let tokenState: TokenState = {
      state: 'inFromNode',
      fromPos,
      toPos,
      nodeId: this.current,
      nextId,
      elapsed: 0,
    };

    return new Promise((resolve, _reject) => {
      const intervalId = window.setInterval(() => {
        console.log(tokenState.state);
        const pos = computeTokenPos(tokenState, this.network);
        this.ui.onTokenMove(pos);

        const next = updateState(tokenState, this.network);
        if (next === undefined) {
          clearInterval(intervalId);
          this.current = nextId;
          resolve();
        } else {
          let msg;
          if (next.state === 'inEdge') {
            let tr = this.automaton.getTransition(this.current);
            if (tr === undefined) {
              fail('tr must not be undefined');
            }
            const st = Array.from(tr.entries()).find(
              ([a, st]) => st === next.nextId
            );
            if (st === undefined) {
              fail('Cannot find next state');
            }
            msg = `Read ${st[0]}`;
          } else if (next.state === 'inFromNode') {
            msg = `Current ${this.current}`;
          } else if (next.state === 'inToNode') {
            msg = `Current ${nextId}`;
          } else {
            // never
            msg = next;
          }
          this.ui.onCurrentAlphabetChange(msg);
          tokenState = next;
        }
      }, 20);
    });
  }

  getCurrent(): IdType {
    return this.current;
  }

  async finish() {
    return this.ui.onFinish();
  }

  async error(msg: string) {
    return this.ui.onError(msg);
  }
}
