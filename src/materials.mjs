export function summarize(items) {
  return items.reduce((total, {price}) => {
    if (!price) {
      total.unpriced++;
      return total;
    }
    total.min += price.min;
    total.max += price.max;
    total.priced++;
    return total;
  }, {min: 0, max: 0, priced: 0, unpriced: 0});
}

export function materialDetails(item, extras) {
  const extra = extras[item.id];
  if (!extra || extra.sourceSpec === item.spec) return extra;
  return {
    status: '재확인 필요',
    note: '시트의 모델 또는 구성이 바뀌었습니다. 기존 제품 정보와 판매 링크를 재확인해야 합니다.',
    links: [],
  };
}

const won = new Intl.NumberFormat('ko-KR');

export function amount(min, max) {
  return min === max ? won.format(min) + '원' : won.format(min) + '~' + won.format(max) + '원';
}
