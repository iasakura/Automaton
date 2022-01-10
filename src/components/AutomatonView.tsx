import { MutableRefObject, useEffect, useRef, useState } from 'react';
import { Network, Options, Position } from 'vis-network/standalone';
import { Automaton } from '../lib/Automaton';
import { usePreviousImmediate } from 'rooks';
import { Executor } from '../lib/Executor';
import { TravelerUI } from '../lib/TravelerUI';
import { VisTraveler } from '../lib/VisTraveler';
import TokenView from './Token';

const options: Options = {
  autoResize: true,
  height: '400px',
  width: '800px',
  locale: 'en',
  edges: {
    arrows: 'to',
  },
};

class TravelerUIImpl implements TravelerUI {
  constructor(
    private handler: {
      onTokenMove(point: Position): Promise<void>;
      onFinish(): Promise<void>;
      onError(msg: string): Promise<void>;
      onCurrentAlphabetChange(msg: string): Promise<void>;
    }
  ) {}

  onTokenMove(point: Position): Promise<void> {
    return this.handler.onTokenMove(point);
  }
  onFinish(): Promise<void> {
    return this.handler.onFinish();
  }
  onError(msg: string): Promise<void> {
    return this.handler.onError(msg);
  }
  onCurrentAlphabetChange(msg: string): Promise<void> {
    return this.handler.onCurrentAlphabetChange(msg);
  }
}

const AutomatonView = (props: {
  automaton: Automaton;
  running: boolean;
  input: string;
  onFinish: () => void;
  onError: (msg: string) => void;
  onCurrentAlphabetChange: (msg: string) => void;
}) => {
  const domNode = useRef<HTMLDivElement>(null);
  const network = useRef<Network>();
  const [tokenPos, setTokenPos] = useState<Position>({ x: 0, y: 0 });
  const previousRunning = usePreviousImmediate(props.running);

  const onFinish = async () => {
    props.onFinish();
  };

  const onError = async (msg: string) => {
    props.onError(msg);
  };

  const onTokenMove = async (position: Position) => {
    setTokenPos(position);
  };

  const onCurrentAlphabetChange = async (msg: string) => {
    props.onCurrentAlphabetChange(msg);
  };

  useEffect(() => {
    if (domNode.current !== null) {
      network.current = props.automaton.asVisNetwork(domNode.current, options);
    }
  }, [options, props.automaton]);

  useEffect(() => {
    if (network.current !== undefined && !previousRunning && props.running) {
      const ui = new TravelerUIImpl({
        onTokenMove,
        onFinish,
        onError,
        onCurrentAlphabetChange,
      });
      const traveler = new VisTraveler(
        props.automaton.init_state,
        ui,
        network.current,
        props.automaton
      );
      const executor = new Executor(props.automaton, traveler);
      executor.execute(props.input);
    }
  }, [props.running, props.automaton, props.input]);

  return (
    <>
      <div ref={domNode} />
      <TokenView visible={props.running} pos={tokenPos} />
    </>
  );
};

export default AutomatonView;
