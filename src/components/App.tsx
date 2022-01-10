import React, { useState } from 'react';
import '../App.css';
import AutomatonView from './AutomatonView';
import { useInput } from 'rooks';
import { Automaton } from '../lib/Automaton';

const defaultAutomatonText = `\
init_state: 0
nodes:
  - 0
  - 1
transitions:
  0:
    a: 1
    b: 0
  1:
    a: 0
    b: 1
accepting_state:
  - 0
`;
const defaultAutomaton = Automaton.parse(defaultAutomatonText);
const defaultInput = 'abbaa';

function useTextArea(arg: { default: string }): [
  string,
  {
    value: string;
    onChange: (ev: React.ChangeEvent<HTMLTextAreaElement>) => void;
  }
] {
  const [state, setState] = useState(arg.default);

  const handler = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    ev.preventDefault();
    setState(ev.target.value);
  };

  return [state, { value: state, onChange: handler }];
}

function App() {
  const [state, textAreaProps] = useTextArea({ default: defaultAutomatonText });
  const inputProps = useInput(defaultInput);
  const [automaton, setAutomaton] = useState(defaultAutomaton);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Press start');

  const textChangeHandler = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newAutomaton = Automaton.parse(ev.target.value);
      setAutomaton(newAutomaton);
    } catch (e) {
      console.log(e);
    }
  };

  const handleClick = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    setRunning(!running);
  };

  const onFinish = () => {
    setStatus('Accepted');
  };

  const onError = (msg: string) => {
    setStatus(`Not accepted: ${msg}`);
  };

  const onCurrentAlphabetChange = (msg: string) => {
    setStatus(`Current: ${msg}`);
  };

  return (
    <div>
      <h2 style={{ margin: '0px' }}>{status}</h2>
      <AutomatonView
        automaton={automaton}
        running={running}
        input={inputProps.value}
        onFinish={onFinish}
        onError={onError}
        onCurrentAlphabetChange={onCurrentAlphabetChange}
      />
      <textarea
        {...textAreaProps}
        onChange={(ev) => {
          textChangeHandler(ev);
          textAreaProps.onChange(ev);
        }}
        rows={20}
        cols={80}
      />
      <input {...inputProps} />
      <button onClick={handleClick}>{running ? 'Stop!!' : 'Start!!'}</button>
    </div>
  );
}

export default App;
