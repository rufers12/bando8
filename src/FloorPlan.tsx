import plan from './data/floor-plan.json';

export default function FloorPlan() {
  return (
    <figure className="plan-canvas">
      <img src={import.meta.env.BASE_URL + 'plans/bando-73.png'} alt="반도 7·8차 73㎡ 평면도와 치수"
        width={plan.width} height={plan.height} draggable={false} />
      <ul className="plan-labels" role="list" aria-label="도면에 표시된 공간">
        {plan.spaces.map(space => (
          <li className="plan-shape" key={space.name} style={{
            left: space.x / plan.width * 100 + '%',
            top: space.y / plan.height * 100 + '%',
            width: space.width / plan.width * 100 + '%',
            height: space.height / plan.height * 100 + '%',
          }}>
            <strong>{space.name}</strong>
          </li>
        ))}
      </ul>
    </figure>
  );
}
