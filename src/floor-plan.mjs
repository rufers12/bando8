import defaultLayout from './data/floor-plan.json' with {type: 'json'};

export const planWidth = 1536;
export const planHeight = 1024;
export const minScale = 50;
export const maxScale = 160;

export const spaces = [
  {id: 'living', name: '거실', width: 258, height: 226},
  {id: 'kitchen', name: '주방', width: 176, height: 150},
  {id: 'hall-bath', name: '거실 욕실', width: 145, height: 80},
  {id: 'main-bath', name: '안방 욕실', width: 150, height: 95},
  {id: 'main-bedroom', name: '안방', width: 220, height: 177},
  {id: 'room-1', name: '작은방 1', width: 160, height: 165},
  {id: 'room-2', name: '작은방 2', width: 176, height: 173},
];

export const nextRotation = rotation => (rotation + 90) % 360;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function fitToPlan(space, placement) {
  const {rotation, scale, x, y} = placement;
  const quarterTurn = rotation % 180 !== 0;
  const halfWidth = Math.ceil((quarterTurn ? space.height : space.width) * scale / 200);
  const halfHeight = Math.ceil((quarterTurn ? space.width : space.height) * scale / 200);
  return {
    x: clamp(Math.round(x), halfWidth, planWidth - halfWidth),
    y: clamp(Math.round(y), halfHeight, planHeight - halfHeight),
    rotation,
    scale,
  };
}

export function serializeLayout(layout) {
  return JSON.stringify({version: 1, plan: 'bando-73', spaces: layout}, null, 2);
}

function validateLayout(data) {
  if (data?.version !== 1 || data.plan !== 'bando-73' || !data.spaces ||
      Object.keys(data.spaces).length !== spaces.length) throw new Error('Invalid floor plan');

  return Object.fromEntries(spaces.map(space => {
    const value = data.spaces[space.id];
    if (!value || ![value.x, value.y, value.scale].every(Number.isInteger) ||
        ![0, 90, 180, 270].includes(value.rotation) ||
        value.scale < minScale || value.scale > maxScale) throw new Error('Invalid placement');
    const placement = fitToPlan(space, value);
    if (value.x !== placement.x || value.y !== placement.y) throw new Error('Placement outside floor plan');
    return [space.id, placement];
  }));
}

export const parseLayout = json => validateLayout(JSON.parse(json));
export const initialLayout = validateLayout(defaultLayout);
