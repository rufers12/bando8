import {useRef, useState, type ChangeEvent, type PointerEvent} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Slider} from '@astryxdesign/core/Slider';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {ToggleButton, ToggleButtonGroup} from '@astryxdesign/core/ToggleButton';
import {fitToPlan, initialLayout, maxScale, minScale, nextRotation, parseLayout, planHeight, planWidth, serializeLayout, spaces} from './floor-plan.mjs';

type Layout = typeof initialLayout;
type Placement = Layout[string];
type Space = (typeof spaces)[number];
type Drag = {pointerId: number; clientX: number; clientY: number; placement: Placement};

const storageKey = 'bando8-floor-plan-73-v1';
const directions = [
  {key: 'ArrowLeft', label: '← 왼쪽', x: -1, y: 0},
  {key: 'ArrowRight', label: '오른쪽 →', x: 1, y: 0},
  {key: 'ArrowUp', label: '↑ 위', x: 0, y: -1},
  {key: 'ArrowDown', label: '↓ 아래', x: 0, y: 1},
];

function loadDraft() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return {layout: parseLayout(stored), saved: true, message: '저장한 배치를 불러왔습니다.'};
  } catch {
    return {layout: initialLayout, saved: false, message: '브라우저에서 배치를 불러올 수 없습니다. 기본 배치를 표시합니다.'};
  }
  return {layout: initialLayout, saved: false, message: ''};
}

export default function FloorPlan() {
  const [draft, setDraft] = useState(loadDraft);
  const [activeId, setActiveId] = useState(spaces[0].id);
  const canvas = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const drag = useRef<Drag | null>(null);
  const active = spaces.find(space => space.id === activeId) ?? spaces[0];
  const selected = draft.layout[active.id];

  function change(space: Space, placement: Partial<Placement>) {
    setDraft(previous => {
      const current = previous.layout[space.id];
      const next = fitToPlan(space, {...current, ...placement});
      if (next.x === current.x && next.y === current.y && next.rotation === current.rotation && next.scale === current.scale) return previous;
      return {layout: {...previous.layout, [space.id]: next}, saved: false, message: ''};
    });
  }

  function nudge(space: Space, x: number, y: number, step = 8) {
    const current = draft.layout[space.id];
    setActiveId(space.id);
    change(space, {x: current.x + x * step, y: current.y + y * step});
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, space: Space) {
    if (!event.isPrimary || event.button !== 0) return;
    const {pointerId, clientX, clientY} = event;
    event.currentTarget.setPointerCapture(pointerId);
    drag.current = {pointerId, clientX, clientY, placement: draft.layout[space.id]};
    setActiveId(space.id);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>, space: Space) {
    const origin = drag.current;
    if (!origin || origin.pointerId !== event.pointerId || !canvas.current) return;
    const {width, height} = canvas.current.getBoundingClientRect();
    if (!width || !height) return;
    change(space, {
      x: origin.placement.x + (event.clientX - origin.clientX) * planWidth / width,
      y: origin.placement.y + (event.clientY - origin.clientY) * planHeight / height,
    });
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  function save() {
    try {
      localStorage.setItem(storageKey, serializeLayout(draft.layout));
      setDraft({...draft, saved: true, message: '이 브라우저에 배치를 저장했습니다.'});
    } catch {
      setDraft({...draft, message: '브라우저에 저장할 수 없습니다. 배치 파일을 내려받아 보관하세요.'});
    }
  }

  function download() {
    const file = new Blob([serializeLayout(draft.layout)], {type: 'application/json'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bando8-floor-plan.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importLayout(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error('File too large');
      const layout = parseLayout(await file.text());
      setDraft({layout, saved: false, message: '파일의 배치를 불러왔습니다. 브라우저에도 남기려면 배치를 저장하세요.'});
    } catch {
      setDraft(previous => ({...previous, message: '이 도면의 배치 파일을 열 수 없습니다. 기존 배치를 유지합니다.'}));
    }
  }

  return (
    <section className="plan-editor" aria-label="73㎡ 도면 편집">
      <VStack gap={3}>
        <p className="material-meta" id="plan-instructions">공간 이름은 초안입니다. 도형을 끌어 옮기거나 이동 버튼으로 조정하세요.</p>
        <figure className="plan-canvas" ref={canvas}>
          <img src={import.meta.env.BASE_URL + 'plans/bando-73.png'} alt="반도 7·8차 73㎡ 평면도와 치수" width={planWidth} height={planHeight} draggable={false} />
          {spaces.map(space => {
            const {x, y, rotation, scale} = draft.layout[space.id];
            return (
              <button key={space.id} type="button" className="plan-shape" aria-pressed={space.id === active.id}
                aria-describedby="plan-instructions"
                style={{left: x / planWidth * 100 + '%', top: y / planHeight * 100 + '%',
                  width: space.width * scale / planWidth + '%', height: space.height * scale / planHeight + '%',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`}}
                onClick={() => setActiveId(space.id)}
                onPointerDown={event => startDrag(event, space)}
                onPointerMove={event => moveDrag(event, space)}
                onLostPointerCapture={endDrag}
                onKeyDown={event => {
                  const direction = directions.find(item => item.key === event.key);
                  if (!direction) return;
                  event.preventDefault();
                  nudge(space, direction.x, direction.y, event.shiftKey ? 32 : 8);
                }}>
                <strong style={{transform: `rotate(${-rotation}deg)`}}>{space.name}</strong>
              </button>
            );
          })}
        </figure>
      </VStack>
      <section className="plan-controls" aria-label="배치 조정">
        <VStack gap={4}>
          <ToggleButtonGroup label="공간 선택" value={active.id} onChange={value => { if (value) setActiveId(value); }}>
            <HStack gap={1} wrap="wrap">
              {spaces.map(space => <ToggleButton key={space.id} label={space.name} value={space.id} />)}
            </HStack>
          </ToggleButtonGroup>
          <h2>{active.name} 배치</h2>
          <HStack gap={1} wrap="wrap">
            {directions.map(direction => (
              <Button key={direction.key} size="sm" label={direction.label} onClick={() => nudge(active, direction.x, direction.y)} />
            ))}
          </HStack>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <Button size="sm" label="시계방향 90° 회전" onClick={() => change(active, {rotation: nextRotation(selected.rotation)})} />
            <output className="material-meta" aria-live="polite">현재 {selected.rotation}°</output>
          </HStack>
          <Slider label="도형 크기" min={minScale} max={maxScale} value={selected.scale} valueDisplay="text"
            formatValue={value => value + '%'} onChange={value => change(active, {scale: value})} />
          <HStack gap={1} wrap="wrap">
            <Button label="배치 저장" variant="primary" onClick={save} />
            <Button label="파일 내려받기" onClick={download} />
            <Button label="파일 불러오기" variant="ghost" onClick={() => fileInput.current?.click()} />
            <input hidden type="file" accept=".json,application/json" ref={fileInput} onChange={importLayout} />
          </HStack>
          <p className="material-meta" role="status">{draft.message || (draft.saved ? '저장된 배치' : '저장하지 않은 배치')}</p>
        </VStack>
      </section>
    </section>
  );
}
