import { describe, it, expect } from 'vitest';
import * as Index from '@/index';

const { NumberUtil } = Index;

describe('@/index.ts', () => {
  it('NumberUtilとして公開されていること', () => {
    expect(NumberUtil.formatComma(1234)).toBe('1,234');
    expect(NumberUtil.ROUNDING_MODE).toEqual({
      roundDown: 0,
      roundHalfUp: 1,
      roundHalfEven: 2,
      roundUp: 3
    });
  });
  it('内部の関数・定数を公開していないこと', () => {
    expect(Object.keys(NumberUtil)).not.toContain('calcAsBig');
    expect(Object.keys(NumberUtil)).not.toContain('MIN_LONG');
    expect(Object.keys(NumberUtil)).not.toContain('MAX_LONG');
  });
  it('RegExpMatcherはサブパス専用のためindexから公開しないこと', () => {
    expect('RegExpMatcher' in Index).toBe(false);
  });
});
