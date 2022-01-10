import { Automaton } from './Automaton';

test('has even a', () => {
  // let states = '0 1';
  let transition = `\
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

  const automaton = Automaton.parse(transition);

  console.log(JSON.stringify(automaton));

  expect(automaton).toMatchSnapshot();
});
