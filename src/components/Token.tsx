import { Position } from 'vis-network/standalone';

const TokenView = (props: { visible: boolean; pos: Position }) => {
  const display = props.visible ? 'block' : 'none';
  const [x, y] = props.visible ? [props.pos.x, props.pos.y] : [0, 0];

  return (
    <div
      style={{
        display,
        width: '10px',
        height: '10px',
        backgroundColor: '#777',
        position: 'absolute',
        left: `${x}px`,
        top: `${y+32}px`,
        zIndex: 100,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};

export default TokenView;
