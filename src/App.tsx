import {useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Grid} from '@astryxdesign/core/Grid';
import {Layout, LayoutHeader, LayoutContent} from '@astryxdesign/core/Layout';
import {Section} from '@astryxdesign/core/Section';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {TextInput} from '@astryxdesign/core/TextInput';
import {ToggleButton, ToggleButtonGroup} from '@astryxdesign/core/ToggleButton';
import sheet from './data/sheet.json';
import extras from './data/extras.json';
import {amount, materialDetails, summarize} from './materials.mjs';

type Material = (typeof sheet.items)[number];
type MaterialLink = {label: string; url: string; kind: string};
type Photo = {filename: string; sourceUrl: string; caption?: string};
type Details = {status: string; note: string; links: MaterialLink[]; photo?: Photo};
const rooms = [...new Set(sheet.items.map(item => item.room))];
const allRooms = '전체';
const detailFor = (item: Material): Details | undefined => materialDetails(item, extras);
const priceFor = ({price, priceText}: Material) => price
  ? amount(price.min, price.max)
  : priceText || '가격 확인 필요';

function safeUrl(value?: string | null) {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function sourceLink(item: Material) {
  const url = safeUrl(item.url);
  if (!url) return null;
  const isSearch = url.hostname === 'search.shopping.naver.com';
  return {label: isSearch ? '가격 검색' : '판매처 보기', url: url.href};
}

function ExternalLink({label, url}: {label: string; url: string}) {
  const safe = safeUrl(url);
  if (!safe) return null;
  return <Button label={label} variant="ghost" size="sm" href={safe.href} target="_blank" rel="noopener noreferrer" />;
}

function ProductPhoto({item, photo, eager = false}: {item: Material; photo?: Photo; eager?: boolean}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="material-photo">
      {photo && !failed ? (
        <img src={import.meta.env.BASE_URL + 'materials/' + photo.filename} alt={photo.caption || item.name} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
      ) : (
        <figcaption>제품 사진 준비 중</figcaption>
      )}
    </figure>
  );
}

function MaterialCard({item, onOpen}: {item: Material; onOpen: () => void}) {
  const extra = detailFor(item);
  const exactSeller = extra?.links.find(link => link.kind === 'seller');
  const link = sourceLink(item);
  const quickLink = exactSeller
    ? {label: item.id === 'main-basin' ? '도기 판매처' : item.id === 'rooms-lighting' ? '실링팬 판매처' : '판매처 보기', url: exactSeller.url}
    : link;
  return (
    <Card padding={0}>
      <ProductPhoto item={item} photo={extra?.photo} />
      <Section variant="transparent" padding={4}>
        <VStack gap={2}>
          <header>
            <p className="material-status">{extra?.status ?? item.procurement}</p>
            <h3>{item.name}</h3>
          </header>
          <p className="material-spec">{item.spec}</p>
          <p className="material-price">{priceFor(item)}{item.price?.scope && <small> · {item.price.scope}만</small>}</p>
          <p className="material-meta">{item.quantity} · {item.procurement}</p>
          <HStack gap={1} wrap="wrap">
            <Button label={item.name + ' 상세 보기'} size="sm" onClick={onOpen}>상세 보기</Button>
            {quickLink && <ExternalLink {...quickLink} />}
          </HStack>
        </VStack>
      </Section>
    </Card>
  );
}

function MaterialDialog({item, onClose}: {item: Material; onClose: () => void}) {
  const extra = detailFor(item);
  const original = sourceLink(item);
  const links = extra?.links ?? [];
  return (
    <Dialog isOpen width="42rem" maxHeight="88dvh" onOpenChange={open => { if (!open) onClose(); }}>
      <Layout
        header={<DialogHeader title={item.name} subtitle={item.room} onOpenChange={open => { if (!open) onClose(); }} />}
        content={
          <LayoutContent padding={4} isScrollable>
            <VStack gap={4}>
              <ProductPhoto item={item} photo={extra?.photo} eager />
              <header>
                <p className="material-status">{extra?.status ?? item.procurement}</p>
                <h3>{item.spec}</h3>
              </header>
              <section>
                <p className="material-meta">예상 자재가</p>
                <p className="material-price">{priceFor(item)}{item.price?.scope && <small> · {item.price.scope}만</small>}</p>
                <p className="material-meta">{item.quantity} · {item.procurement}</p>
              </section>
              <section>
                <h4>자재 메모</h4>
                <p className="material-spec">{item.note.replace(/^상단 갤러리 \d+번\s*\((.*)\)$/, '$1')}</p>
                {extra?.note && <p className="detail-note">{extra.note}</p>}
              </section>
              {(['official', 'seller', 'reference'] as const).map(kind => {
                const group = links.filter(link => link.kind === kind);
                if (!group.length) return null;
                return (
                  <section key={kind}>
                    <h4>{{official: '제품 정보', seller: '판매처 보기', reference: '후보·참고 자료'}[kind]}</h4>
                    <HStack gap={1} wrap="wrap">
                      {group.map(link => <ExternalLink key={link.url} {...link} />)}
                    </HStack>
                  </section>
                );
              })}
              <HStack gap={1} wrap="wrap">
                {original && <ExternalLink {...original} />}
                {extra?.photo && <ExternalLink label="제품 사진 출처" url={extra.photo.sourceUrl} />}
              </HStack>
            </VStack>
          </LayoutContent>
        }
      />
    </Dialog>
  );
}

function Estimate({room, items, onOpen}: {room: string; items: Material[]; onOpen: (item: Material) => void}) {
  const total = summarize(items);
  return (
    <VStack gap={6}>
      <section className="estimate-banner" aria-label="예상 자재비">
        <p>{room === allRooms ? '전체 예상 자재비' : room + ' 예상 자재비'}</p>
        <strong>{total.priced ? amount(total.min, total.max) : '기재된 금액 없음'}</strong>
        <p className="material-meta">합산 {total.priced}개 · 금액 미기재 {total.unpriced}개 · 공사비 및 미기재 금액 제외</p>
      </section>
      {rooms.filter(name => room === allRooms || name === room).map(name => {
        const group = items.filter(item => item.room === name);
        const subtotal = summarize(group);
        return (
          <section key={name} aria-label={name}>
            <header className="room-heading">
              <h2>{name}</h2>
              <p>{subtotal.priced ? amount(subtotal.min, subtotal.max) : '기재된 금액 없음'}</p>
            </header>
            <ul className="estimate-list">
              {group.map(item => (
                <li key={item.id}>
                  <section>
                    <button className="estimate-item" type="button" onClick={() => onOpen(item)}>{item.name}</button>
                    <p className="material-meta">{item.quantity} · {item.procurement}</p>
                  </section>
                  <p className="estimate-price">{priceFor(item)}{item.price?.scope && <small> · {item.price.scope}만</small>}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </VStack>
  );
}

export default function App() {
  const [view, setView] = useState('materials');
  const [room, setRoom] = useState(allRooms);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Material | null>(null);
  const scoped = room === allRooms ? sheet.items : sheet.items.filter(item => item.room === room);
  const query = search.trim().toLocaleLowerCase('ko-KR');
  const filtered = scoped.filter(item => (item.name + ' ' + item.spec).toLocaleLowerCase('ko-KR').includes(query));
  const activeRooms = rooms.filter(name => room === allRooms || name === room);

  return (
    <Layout
      header={
        <LayoutHeader padding={0} hasDivider>
          <section className="masthead shell">
            <p className="wordmark">반도8차</p>
            <ToggleButtonGroup label="화면 선택" value={view} onChange={value => { if (value) setView(value); }}>
              <ToggleButton label="자재 보기" value="materials" />
              <ToggleButton label="견적 모아보기" value="estimate" />
            </ToggleButtonGroup>
          </section>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0}>
          <section className="shell page">
            <VStack gap={6}>
              <header className="intro">
                <p className="material-status">반도8차 인테리어</p>
                <h1>{view === 'materials' ? '공간별 자재 보드' : '견적 모아보기'}</h1>
                <p className="intro-copy">{view === 'materials' ? '공간을 선택해 제품 사진과 모델, 예상 자재비를 확인하세요.' : '공간별 예상 금액과 업체 견적에 포함된 항목을 확인하세요.'}</p>
              </header>
              <VStack gap={4}>
                <ToggleButtonGroup label="공간 필터" value={room} onChange={value => { if (value) setRoom(value); }}>
                  <HStack gap={1} wrap="wrap" vAlign="center">
                    {[allRooms, ...rooms].map(name => <ToggleButton key={name} label={name} value={name} />)}
                  </HStack>
                </ToggleButtonGroup>
                {view === 'materials' && (
                  <TextInput label="자재 검색" type="search" hasClear value={search} onChange={setSearch} placeholder="품목, 브랜드 또는 모델번호" />
                )}
              </VStack>
              {view === 'estimate' ? <Estimate room={room} items={scoped} onOpen={setSelected} /> : (
                <VStack gap={6}>
                  <p className="material-meta" role="status">자재 {filtered.length}개</p>
                  {!filtered.length && <p className="empty">검색 결과가 없습니다. 검색어나 공간을 바꿔보세요.</p>}
                  {activeRooms.map(name => {
                    const group = filtered.filter(item => item.room === name);
                    if (!group.length) return null;
                    const total = summarize(scoped.filter(item => item.room === name));
                    return (
                      <section key={name} aria-label={name}>
                        <header className="room-heading">
                          <h2>{name}</h2>
                          <p>{total.priced ? amount(total.min, total.max) : '기재된 금액 없음'}{total.unpriced ? ' · 금액 미기재 ' + total.unpriced + '개' : ''}</p>
                        </header>
                        <Grid columns={{minWidth: 240, max: 4}} gap={4}>
                          {group.map(item => <MaterialCard key={item.id} item={item} onOpen={() => setSelected(item)} />)}
                        </Grid>
                      </section>
                    );
                  })}
                </VStack>
              )}
              <footer className="site-footer">
                <p>데이터 반영일 {sheet.asOf} · 실측 전 현재 기준이며 변경될 수 있습니다</p>
                <ExternalLink label="원본 스프레드시트" url={sheet.sourceUrl} />
              </footer>
            </VStack>
          </section>
          {selected && <MaterialDialog key={selected.id} item={selected} onClose={() => setSelected(null)} />}
        </LayoutContent>
      }
    />
  );
}
