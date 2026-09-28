import * as NumberUtil from '@/number-util';

describe('@/number-util.ts', () => {

  describe('isLongValue', () => {
    it('MIN_01', () => {
      const result = NumberUtil.isLongValue('-9223372036854775808');
      expect(result).toBe(true);
    });
    it('MIN_02', () => {
      const result = NumberUtil.isLongValue('-9223372036854775809');
      expect(result).toBe(false);
    });
    it('MAX_01', () => {
      const result = NumberUtil.isLongValue('9223372036854775807');
      expect(result).toBe(true);
    });
    it('MAX_02', () => {
      const result = NumberUtil.isLongValue('9223372036854775808');
      expect(result).toBe(false);
    });
    it('ゼロ', () => {
      const result = NumberUtil.isLongValue('0');
      expect(result).toBe(true);
    });
    it('null', () => {
      const result = NumberUtil.isLongValue(null as any);
      expect(result).toBe(false);
    });
    it('空文字', () => {
      const result = NumberUtil.isLongValue('');
      expect(result).toBe(false);
    });
    it('数値以外', () => {
      const result = NumberUtil.isLongValue('abc');
      expect(result).toBe(false);
    });
    it('最小値指定_01', () => {
      const result = NumberUtil.isLongValue('0', {
        minValue: 0
      });
      expect(result).toBe(true);
    });
    it('最小値指定_02', () => {
      const result = NumberUtil.isLongValue('-1', {
        minValue: 0
      });
      expect(result).toBe(false);
    });
    it('最小値指定_03', () => {
      // minValueは不正な値、数値はBigIntの範囲内
      const result = NumberUtil.isLongValue('-1', {
        minValue: 'a' as any
      });
      expect(result).toBe(true);
    });
    it('最小値指定_04', () => {
      // minValueは不正な値、数値はBigIntの範囲外
      const result = NumberUtil.isLongValue('-9223372036854775809', {
        minValue: 'a' as any
      });
      expect(result).toBe(false);
    });
  });

  describe('formatComma', () => {
    it('カンマなし', () => {
      const result = NumberUtil.formatComma(100);
      expect(result).toBe('100');
    });
    it('カンマあり', () => {
      const result = NumberUtil.formatComma(1000);
      expect(result).toBe('1,000');
    });
    it('桁数補正・四捨五入_01', () => {
      const result = NumberUtil.formatComma(1234.12345, 3, NumberUtil.ROUNDING_MODE.roundHalfUp);
      expect(result).toBe('1,234.123');
    });
    it('桁数補正・四捨五入_02', () => {
      const result = NumberUtil.formatComma(1234.12345, 4, NumberUtil.ROUNDING_MODE.roundHalfUp);
      expect(result).toBe('1,234.1235');
    });
    it('+記号付き', () => {
      const result = NumberUtil.formatComma('+12345');
      expect(result).toBe('+12,345');
    });
    it('−記号付き', () => {
      const result = NumberUtil.formatComma('-12345');
      expect(result).toBe('-12,345');
    });
    it('小数点末尾ゼロ', () => {
      const result = NumberUtil.formatComma(1234.12, 4);
      expect(result).toBe('1,234.1200');
    });
    it('null', () => {
      const result = NumberUtil.formatComma(null);
      expect(result).toBe('');
    });
    it('不正な数値', () => {
      const result = NumberUtil.formatComma('abc');
      expect(result).toBe('abc');
    });
    it('NaN', () => {
      const result = NumberUtil.formatComma(Number.NaN);
      expect(result).toBe('NaN');
    });
    it('Infinity', () => {
      expect(NumberUtil.formatComma(Infinity)).toBe('Infinity');
      expect(NumberUtil.formatComma(-Infinity)).toBe('-Infinity');
      expect(NumberUtil.formatComma('Infinity')).toBe('Infinity');
    });
    it('指数表記(number)', () => {
      expect(NumberUtil.formatComma(1e21)).toBe('1,000,000,000,000,000,000,000');
      expect(NumberUtil.formatComma(1e-7)).toBe('0.0000001');
      expect(NumberUtil.formatComma(-1e-7, 8)).toBe('-0.00000010');
    });
    it('指数表記(string)', () => {
      expect(NumberUtil.formatComma('1e5')).toBe('100,000');
      expect(NumberUtil.formatComma('+1.5e3')).toBe('+1,500');
    });
    it('bigint', () => {
      expect(NumberUtil.formatComma(10n ** 21n)).toBe('1,000,000,000,000,000,000,000');
      expect(NumberUtil.formatComma(-1234567n, 2)).toBe('-1,234,567.00');
    });
    it('前後に空白を含む文字列', () => {
      const result = NumberUtil.formatComma(' 1234 ');
      expect(result).toBe('1,234');
    });
    it('空白のみの文字列', () => {
      const result = NumberUtil.formatComma(' ');
      expect(result).toBe(' ');
    });
    it('16進数表記の文字列', () => {
      const result = NumberUtil.formatComma('0x10');
      expect(result).toBe('0x10');
    });
    it('丸めた結果がゼロになる負数', () => {
      const result = NumberUtil.formatComma('-0.001', 2);
      expect(result).toBe('0.00');
    });
    it('+記号付き小数', () => {
      const result = NumberUtil.formatComma('+1234.5');
      expect(result).toBe('+1,234.5');
    });
  });

  describe('removeComma', () => {
    it('001', () => {
      const result = NumberUtil.removeComma('1,234');
      expect(result).toBe('1234');
    });
    it('002', () => {
      const result = NumberUtil.removeComma('1234');
      expect(result).toBe('1234');
    });
  });

  describe('formatCompact', () => {
    it('1000_ja', () => {
      const result = NumberUtil.formatCompact(1000, 'ja');
      expect(result).toBe('1000');
    });
    it('10000000_ja', () => {
      const result = NumberUtil.formatCompact(10000000, 'ja');
      expect(result).toBe('1000万');
    });
    it('10000000000_ja', () => {
      const result = NumberUtil.formatCompact(10000000000, 'ja');
      expect(result).toBe('100億');
    });
    it('1000_en', () => {
      const result = NumberUtil.formatCompact(1000, 'en');
      expect(result).toBe('1K');
    });
    it('10000000_en', () => {
      const result = NumberUtil.formatCompact(10000000, 'en');
      expect(result).toBe('10M');
    });
    it('10000000000_en', () => {
      const result = NumberUtil.formatCompact(10000000000, 'en');
      expect(result).toBe('10B');
    });
  });

  describe('calc', () => {
    it('calc.001', () => {
      const result = NumberUtil.calc(
        '123',
        [
          { operator: 'add', value: '123' },
          { operator: 'sub', value: 100 },
          { operator: 'times', value: 2 },
          { operator: 'div', value: 3 }
        ]
      );
      expect(result).toBe(97.33333333333333);
    });
    it('丸め指定', () => {
      const result = NumberUtil.calc(1, [{ operator: 'div', value: 3 }], { scale: 4 });
      expect(result).toBe(0.3333);
    });
    it('丸め指定(丸めモード)', () => {
      expect(NumberUtil.calc(2, [{ operator: 'div', value: 3 }], { scale: 2 })).toBe(0.67);
      expect(NumberUtil.calc(2, [{ operator: 'div', value: 3 }], { scale: 2, roundingMode: NumberUtil.ROUNDING_MODE.roundDown })).toBe(0.66);
    });
    it('演算なし', () => {
      expect(NumberUtil.calc('1.5', [])).toBe(1.5);
      expect(NumberUtil.calc(null, [])).toBe(0);
    });
    it('bigint', () => {
      const result = NumberUtil.calc(10n, [{ operator: 'times', value: 3n }, { operator: 'sub', value: 1 }]);
      expect(result).toBe(29);
    });
    it('null等の扱いは四則演算の関数と同じ', () => {
      const result = NumberUtil.calc(100, [
        { operator: 'add', value: null },
        { operator: 'div', value: null },
        { operator: 'sub', value: Number.NaN }
      ]);
      expect(result).toBe(100);
      expect(NumberUtil.calc(100, [{ operator: 'times', value: undefined }])).toBe(0);
    });
  });

  describe('add', () => {
    it('string', () => {
      const result = NumberUtil.add('123', '123');
      expect(result).toBe(246);
    });
    it('number', () => {
      const result = NumberUtil.add(123, 123);
      expect(result).toBe(246);
    });
    it('NaN', () => {
      const result = NumberUtil.add(123, Number.NaN);
      expect(result).toBe(123);
    });
    it('null', () => {
      const result = NumberUtil.add(123, null);
      expect(result).toBe(123);
    });
    it('undefined', () => {
      const result = NumberUtil.add(123, undefined);
      expect(result).toBe(123);
    });
  });

  describe('sub', () => {
    it('string', () => {
      const result = NumberUtil.sub('123', '100');
      expect(result).toBe(23);
    });
    it('number', () => {
      const result = NumberUtil.sub(123, 100);
      expect(result).toBe(23);
    });
    it('NaN', () => {
      const result = NumberUtil.sub(123, Number.NaN);
      expect(result).toBe(123);
    });
    it('null', () => {
      const result = NumberUtil.sub(123, null);
      expect(result).toBe(123);
    });
    it('undefined', () => {
      const result = NumberUtil.sub(123, undefined);
      expect(result).toBe(123);
    });
  });

  describe('times', () => {
    it('string', () => {
      const result = NumberUtil.times('123', '100');
      expect(result).toBe(12300);
    });
    it('number', () => {
      const result = NumberUtil.times(123, 100);
      expect(result).toBe(12300);
    });
    it('NaN', () => {
      const result = NumberUtil.times(123, Number.NaN);
      expect(result).toBe(0);
    });
    it('null', () => {
      const result = NumberUtil.times(123, null);
      expect(result).toBe(0);
    });
    it('undefined', () => {
      const result = NumberUtil.times(123, undefined);
      expect(result).toBe(0);
    });
    it('nullの位置によらず結果が同じ', () => {
      expect(NumberUtil.times(3, null)).toBe(0);
      expect(NumberUtil.times(null, 3)).toBe(0);
    });
    it('フォールバック値の指定', () => {
      const discount: number | null = null;
      const result = NumberUtil.times(100, discount ?? 1);
      expect(result).toBe(100);
    });
  });

  describe('div', () => {
    it('string', () => {
      const result = NumberUtil.div('100', '4');
      expect(result).toBe(25);
    });
    it('number', () => {
      const result = NumberUtil.div(100, 4);
      expect(result).toBe(25);
    });
    it('割る値のnull/undefined/空文字/NaNは1とみなす', () => {
      expect(NumberUtil.div(100, null)).toBe(100);
      expect(NumberUtil.div(100, undefined)).toBe(100);
      expect(NumberUtil.div(100, '')).toBe(100);
      expect(NumberUtil.div(100, Number.NaN)).toBe(100);
      expect(NumberUtil.div(100, 2, null, 5)).toBe(10);
    });
    it('割られる値のnullはゼロとみなす', () => {
      const result = NumberUtil.div(null, 4);
      expect(result).toBe(0);
    });
    it('0で割るとゼロ除算エラー', () => {
      expect(() => NumberUtil.div(100, 0)).toThrow();
    });
  });

  describe('round', () => {
    it('ゼロ', () => {
      const result = NumberUtil.round(0, 2, 1);
      expect(result).toBe(0);
    });
    it('null', () => {
      const result = NumberUtil.round(null as any, 2, 1);
      expect(result).toBe(null);
    });
    it('undefined', () => {
      const result = NumberUtil.round(undefined as any, 2, 1);
      expect(result).toBe(null);
    });
    it('NaN', () => {
      const result = NumberUtil.round(Number.NaN, 2, 1);
      expect(result).toBe(Number.NaN);
    });
    it('切り捨て_01', () => {
      const result = NumberUtil.round(0.4456535, 4, 0);
      expect(result).toBe(0.4456);
    });
    it('切り捨て_02', () => {
      const result = NumberUtil.round(0.4456435, 4, 0);
      expect(result).toBe(0.4456);
    });
    it('四捨五入_01', () => {
      const result = NumberUtil.round(0.4456535, 4, 1);
      expect(result).toBe(0.4457);
    });
    it('四捨五入_02', () => {
      const result = NumberUtil.round(0.4456435, 4, 1);
      expect(result).toBe(0.4456);
    });
    it('ISO丸め_01', () => {
      const result = NumberUtil.round(11.5, 0, 2);
      expect(result).toBe(12);
    });
    it('ISO丸め_02', () => {
      const result = NumberUtil.round(12.5, 0, 2);
      expect(result).toBe(12);
    });
    it('切り上げ_01', () => {
      const result = NumberUtil.round(0.4456335, 4, 3);
      expect(result).toBe(0.4457);
    });
    it('切り上げ_02', () => {
      const result = NumberUtil.round(0.4456535, 4, 3);
      expect(result).toBe(0.4457);
    });
    it('空文字', () => {
      expect(NumberUtil.round('', 0, 1)).toBe(null);
      expect(NumberUtil.round(' ', 0, 1)).toBe(null);
    });
    it('前後に空白を含む文字列', () => {
      const result = NumberUtil.round(' 12.5 ', 0, 1);
      expect(result).toBe(13);
    });
    it('数値として解釈できない文字列', () => {
      expect(NumberUtil.round('abc', 0, 1)).toBe(Number.NaN);
      expect(NumberUtil.round('0x10', 0, 1)).toBe(Number.NaN);
      expect(NumberUtil.round('Infinity', 0, 1)).toBe(Number.NaN);
    });
    it('Infinity', () => {
      expect(NumberUtil.round(Infinity, 2, 1)).toBe(Infinity);
      expect(NumberUtil.round(-Infinity, 2, 1)).toBe(-Infinity);
    });
    it('bigint', () => {
      const result = NumberUtil.round(123n, 0, 1);
      expect(result).toBe(123);
    });
  });

  describe('toString', () => {
    it('scale指定なし', () => {
      expect(NumberUtil.toString(1.5)).toBe('1.5');
      expect(NumberUtil.toString('1.50')).toBe('1.5');
      expect(NumberUtil.toString(1e21)).toBe('1000000000000000000000');
      expect(NumberUtil.toString(1e-7)).toBe('0.0000001');
      expect(NumberUtil.toString(12345678901234567890n)).toBe('12345678901234567890');
    });
    it('roundingMode指定なし', () => {
      const result = NumberUtil.toString(1.235, { scale: 2 });
      expect(result).toBe('1.24');
    });
    it('数値として解釈できない値', () => {
      expect(NumberUtil.toString('abc')).toBe('abc');
      expect(NumberUtil.toString(Infinity)).toBe('Infinity');
    });
    it('ゼロ', () => {
      const result = NumberUtil.toString(0, { scale: 2, roundingMode: 1 });
      expect(result).toBe('0.00');
    });
    it('null', () => {
      const result = NumberUtil.toString(null as any, { scale: 2, roundingMode: 1 });
      expect(result).toBe('');
    });
    it('undefined', () => {
      const result = NumberUtil.toString(undefined as any, { scale: 2, roundingMode: 1 });
      expect(result).toBe('');
    });
    it('NaN', () => {
      const result = NumberUtil.toString(Number.NaN, { scale: 2, roundingMode: 1 });
      expect(result).toBe('NaN');
    });
    it('切り捨て_01', () => {
      const result = NumberUtil.toString(0.4456535, { scale: 4, roundingMode: 0 });
      expect(result).toBe('0.4456');
    });
    it('切り捨て_02', () => {
      const result = NumberUtil.toString(0.4456435, { scale: 4, roundingMode: 0 });
      expect(result).toBe('0.4456');
    });
    it('四捨五入_01', () => {
      const result = NumberUtil.toString(0.4456535, { scale: 4, roundingMode: 1 });
      expect(result).toBe('0.4457');
    });
    it('四捨五入_02', () => {
      const result = NumberUtil.toString(0.4456435, { scale: 4, roundingMode: 1 });
      expect(result).toBe('0.4456');
    });
    it('ISO丸め_01', () => {
      const result = NumberUtil.toString(11.5, { scale: 0, roundingMode: 2 });
      expect(result).toBe('12');
    });
    it('ISO丸め_02', () => {
      const result = NumberUtil.toString(12.5, { scale: 0, roundingMode: 2 });
      expect(result).toBe('12');
    });
    it('切り上げ_01', () => {
      const result = NumberUtil.toString(0.4456335, { scale: 4, roundingMode: 3 });
      expect(result).toBe('0.4457');
    });
    it('切り上げ_02', () => {
      const result = NumberUtil.toString(0.4456535, { scale: 4, roundingMode: 3 });
      expect(result).toBe('0.4457');
    });
  });

  describe('bitArray', () => {
    it('candidatesなし_01', () => {
      const result = NumberUtil.bitArray(7);
      expect(result).toEqual([1, 2, 4]);
    });
    it('candidatesなし_02', () => {
      const result = NumberUtil.bitArray(86);
      expect(result).toEqual([2, 4, 16, 64]);
    });
    it('candidatesなし_03', () => {
      const result = NumberUtil.bitArray(100);
      expect(result).toEqual([4, 32, 64]);
    });
    it('candidatesあり_01', () => {
      const result = NumberUtil.bitArray(7, [1, 4, 8]);
      expect(result).toEqual([1, 4]);
    });
    it('candidatesあり_02', () => {
      const result = NumberUtil.bitArray(86, [2, 4, 80]);
      expect(result).toEqual([2, 4, 80]);
    });
    it('candidatesあり_03', () => {
      const result = NumberUtil.bitArray(100, [1, 2, 4, 8, 16, 64]);
      expect(result).toEqual([4, 64]);
    });
    it('candidates(string)あり_04', () => {
      const candidates = ['4', '8', '1', '2', '16', '64'];
      const result = NumberUtil.bitArray(100, candidates);
      expect(result).toEqual([4, 64]);
      // candidatesの配列に変更が加えられていないこと
      expect(candidates).toEqual(['4', '8', '1', '2', '16', '64']);
    });
    it('2^32以上', () => {
      expect(NumberUtil.bitArray(2 ** 32)).toEqual([2 ** 32]);
      expect(NumberUtil.bitArray(2 ** 32 + 5)).toEqual([1, 4, 2 ** 32]);
      expect(NumberUtil.bitArray(2 ** 40 + 2, [2, 2 ** 40])).toEqual([2, 2 ** 40]);
    });
    it('小数は切り捨て', () => {
      expect(NumberUtil.bitArray(0.5)).toEqual([]);
      expect(NumberUtil.bitArray(7.9)).toEqual([1, 2, 4]);
    });
    it('0以下・NaN・Infinity', () => {
      expect(NumberUtil.bitArray(0)).toEqual([]);
      expect(NumberUtil.bitArray(-7)).toEqual([]);
      expect(NumberUtil.bitArray(Number.NaN)).toEqual([]);
      expect(NumberUtil.bitArray(Infinity)).toEqual([]);
    });
    it('候補値のビットが一部しか立っていない場合は該当しない', () => {
      expect(NumberUtil.bitArray(16, [80])).toEqual([]);
      expect(NumberUtil.bitArray(86, [16, 80])).toEqual([80]);
    });
    it('整数でない候補値は無視する', () => {
      const result = NumberUtil.bitArray(7, ['abc', 1.5, 4]);
      expect(result).toEqual([4]);
    });
  });

  describe('formatBytes', () => {

    let formatBytes = NumberUtil.formatBytes;

    describe('正常系: 基本的な単位変換', () => {
      it('B（バイト）単位のまま返却されること', () => {
        expect(formatBytes(500)).toEqual(['500', 'B']);
        expect(formatBytes(0)).toEqual(['0', 'B']);
      });

      it('KB, MB, GB, TB に変換されること', () => {
        expect(formatBytes(1024)).toEqual(['1', 'KB']);
        expect(formatBytes(1048576)).toEqual(['1', 'MB']);
        expect(formatBytes(1073741824)).toEqual(['1', 'GB']);
        expect(formatBytes(1099511627776)).toEqual(['1', 'TB']);
      });

      it('TB を超える大きな値は TB で留まること', () => {
        expect(formatBytes(1125899906842624)).toEqual(['1024', 'TB']);
      });
    });

    describe('正常系: さまざまな型の入力', () => {
      it('bigint 型を受け入れられること', () => {
        expect(formatBytes(1024n)).toEqual(['1', 'KB']);
        expect(formatBytes(1073741824000000000000n)).toEqual(['976562500', 'TB']);
      });

      it('文字列（数値表現）を受け入れられること', () => {
        expect(formatBytes('2048')).toEqual(['2', 'KB']);
      });

      it('カンマ区切りの文字列を受け入れられること', () => {
        expect(formatBytes('1,024')).toEqual(['1', 'KB']);
        expect(formatBytes('1,048,576')).toEqual(['1', 'MB']);
      });
    });

    describe('オプション指定: scale & roundingMode (format: false または未指定)', () => {
      it('format 未指定時はデフォルト桁数 (scale: 2) で切り捨てられ、末尾の0は削除されること', () => {
        // 1,000,000,000 B / 1024 / 1024 = 953.67431640625 MB
        // scale: 2 (デフォルト) かつ roundDown のため 953.67 になる
        expect(formatBytes(1000000000)).toEqual(['953.67', 'MB']);

        // 1,572,864 B = 1.5 MB -> 2桁丸めだと本来 1.50 だが、
        // toString() により末尾の 0 がカットされて '1.5' になる
        expect(formatBytes(1572864)).toEqual(['1.5', 'MB']);
      });

      it('scale を指定した場合、その小数桁数で丸められること', () => {
        // 1500 / 1024 = 1.46484375 KB
        expect(formatBytes(1500, { scale: 3 })).toEqual(['1.465', 'KB']);
        expect(formatBytes(1500, { scale: 0 })).toEqual(['1', 'KB']);
      });

      it('roundingMode が正しく適用されること', () => {
        // 1500 / 1024 = 1.46484375 KB (scale: 2)
        expect(formatBytes(1500, { scale: 2, roundingMode: NumberUtil.ROUNDING_MODE.roundUp })).toEqual(['1.47', 'KB']);
        expect(formatBytes(1500, { scale: 2, roundingMode: NumberUtil.ROUNDING_MODE.roundHalfUp })).toEqual(['1.46', 'KB']);
        expect(formatBytes(1500, { scale: 3, roundingMode: NumberUtil.ROUNDING_MODE.roundHalfUp })).toEqual(['1.465', 'KB']);
      });
    });

    describe('オプション指定: format: true (3桁カンマ区切り＋末尾0の桁揃え)', () => {
      it('format: true かつスケール未指定(scale: 2)のとき、末尾0埋めとカンマ区切りが適用されること', () => {
        // 1,125,899,906,842,624 B = 1024 TB -> '1,024.00'
        expect(formatBytes(1125899906842624, { format: true })).toEqual(['1,024.00', 'TB']);
      });

      it('format: true かつスケール指定(scale: 3)のとき、末尾0埋めとカンマ区切りが適用されること', () => {
        // 1,125,899,906,842,624 B = 1,024 TB -> 3桁カンマ区切り + 小数部3桁0埋め
        expect(formatBytes(1125899906842624, { format: true, scale: 3 })).toEqual(['1,024.000', 'TB']);
      });
    });

    describe('異常系・エッジケース', () => {
      it('null または undefined の場合は文字列化して空単位を返すこと', () => {
        // @ts-expect-error テスト用に無効な値を渡す
        expect(formatBytes(null)).toEqual(['null', '']);
        // @ts-expect-error テスト用に無効な値を渡す
        expect(formatBytes(undefined)).toEqual(['undefined', '']);
      });

      it('空文字の場合は空文字と空単位を返すこと', () => {
        expect(formatBytes('')).toEqual(['', '']);
      });

      it('NaN の場合は ["NaN", ""] を返すこと', () => {
        expect(formatBytes(NaN)).toEqual(['NaN', '']);
      });

      it('数値化できない文字列の場合は元の文字列と空単位を返すこと', () => {
        expect(formatBytes('invalid-number')).toEqual(['invalid-number', '']);
        expect(formatBytes('abc')).toEqual(['abc', '']);
      });
    });
  });
});
