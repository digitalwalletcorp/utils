import { Big } from 'big.js';

/**
 * 数値として扱える値の型
 */
export type NumberSource = number | string | bigint;

// 64bit整数の範囲
const MIN_LONG = Big('-9223372036854775808');
const MAX_LONG = Big('9223372036854775807');

/**
 * 丸めモード
 * 公開APIに内部の算術ライブラリ(big.js)の型を出さないよう、値を直接定義する(big.jsの丸めモードと同じ値)
 */
export const ROUNDING_MODE = {
  /**
   * Rounds towards zero.
   * I.e. truncate, no rounding.
   */
  roundDown: 0,
  /**
   * Rounds towards nearest neighbour.
   * If equidistant, rounds away from zero.
   */
  roundHalfUp: 1,
  /**
   * Rounds towards nearest neighbour.
   * If equidistant, rounds towards even neighbour.
   */
  roundHalfEven: 2,
  /**
   * Rounds away from zero.
   */
  roundUp: 3
} as const;

export type RoundingMode = typeof ROUNDING_MODE[keyof typeof ROUNDING_MODE];

/** 数値パターン */
const NUMBER_PATTERN = new RegExp('([\+\-]?)([0-9]*)[\.]?([0-9]*)');

/** 数値として解釈できる文字列のパターン(符号・小数点・指数表記) */
const NUMERIC_STRING_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

function toBig(value: NumberSource): Big {
  // @types/big.js の型定義が bigint を含まないため、文字列にして渡す
  return Big(typeof value === 'bigint' ? value.toString() : value);
}

/**
 * long(64bit)の範囲(-9223372036854775808〜9223372036854775807)の値か判定する
 * Javascriptのnumberの範囲は(-9007199254740991〜9007199254740991)である
 *
 * @param {string | bigint} value
 * @param {*} [options]
 *   ├ minValue number 最小値を指定する場合(0を指定すると負数の場合falseを返す)
 *       不正な値を指定した場合は無視される(最小値を-9223372036854775808とみなす)
 * @returns {boolean}
 * @see Number.MAX_SAFE_INTEGER
 * @see Number.MIN_SAFE_INTEGER
 */
export function isLongValue(value: string | bigint, options?: {
  minValue?: number;
}): boolean {
  let min;
  if (options?.minValue != null) {
    try {
      min = Big(options.minValue);
    } catch (error) {
      min = MIN_LONG;
    }
  } else {
    min = MIN_LONG;
  }
  try {
    // -9223372036854775808 <= value <= 9223372036854775807
    return min.lte(value.toString()) && MAX_LONG.gte(value.toString());
  } catch (error) {
    // 数値以外やnullが渡された場合エラーになるためfalseを返却([big.js] Invalid number)
    return false;
  }
}

/**
 * 3桁ごとカンマ区切りした文字列を返す
 * 指数表記の値(1e21など)は通常の表記に展開してから区切る
 * 数値として解釈できない文字列はそのまま返し、NaN/Infinityは "NaN"/"Infinity"/"-Infinity" を返す
 *
 * @param {NumberSource | null | undefined} value 値
 * @param {number} [scale] 小数点桁数(補助桁数)
 * @param {RoundingMode} [roundingMode] 丸めモード デフォルトはROUNDING_MODE.roundHalfUp(四捨五入・half-away-from-zero)
 * @returns {string}
 */
export function formatComma(value: NumberSource | null | undefined, scale?: number, roundingMode?: RoundingMode): string {
  if (value == null || value === '') {
    // 空文字を返却
    return '';
  }
  let strValue: string;
  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) {
        // "NaN" / "Infinity" / "-Infinity" を返却
        return String(value);
      }
      // toString()は1e21以上や1e-7以下を指数表記にするため、Bigで通常の表記に展開する
      strValue = Big(value).toFixed();
      break;
    case 'string':
      strValue = removeComma(value).trim();
      if (!NUMERIC_STRING_PATTERN.test(strValue)) {
        // 元の文字列を返却
        return value;
      }
      if (/e/i.test(strValue)) {
        // 指数表記を通常の表記に展開する。Big.jsは '+' を受け付けないため外して渡し、表示用に付け直す
        const plusSign = strValue.startsWith('+') ? '+' : '';
        strValue = `${plusSign}${Big(strValue.replace(/^\+/, '')).toFixed()}`;
      }
      break;
    default:
      // bigintの場合
      strValue = value.toString();
  }
  const matches = NUMBER_PATTERN.exec(strValue) as RegExpExecArray;
  const sign = matches[1];
  let natural = matches[2] || '0';
  let decimal = matches[3];
  let dp: number;
  // Big.jsに渡すとき '+' が付いているとエラーになる
  let big = new Big(`${sign === '-' ? '-' : ''}${natural}.${decimal}`);
  if (scale != null) {
    big = big.round(scale, roundingMode ?? ROUNDING_MODE.roundHalfUp);
    const roundedMatches = NUMBER_PATTERN.exec(big.toFixed()) as RegExpExecArray;
    natural = roundedMatches[2];
    decimal = roundedMatches[3];
    dp = scale;
  } else {
    dp = decimal.length;
  }
  // 丸めた結果がゼロになる場合('-0.001' を小数2桁にするなど)に "-0.00" とならないよう、丸めた後の値で判定する
  const displaySign = big.eq(0) ? '' : sign;
  natural = natural.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  decimal = `${decimal}${'0'.repeat(dp)}`.substring(0, dp);
  return decimal === ''
    ? `${displaySign}${natural}`
    : `${displaySign}${natural}.${decimal}`;
}

/**
 * カンマを除去する
 *
 * @param {string} value 入力値
 * @returns {string} カンマを取り除いた文字列
 */
export function removeComma(value: string): string {
  return value.replace(/,/g, '');
}

/**
 * 数値を表示ロケールの短縮表記にする。
 * en は 1.2K/3.4M/5.6B、ja は 12万/34億 のように単位が切り替わる。
 *
 * @param {number} value 値
 * @param {string} locale 表示ロケール(例 'ja' / 'en')
 * @returns {string} 短縮表記の文字列
 */
export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
}

export type Operator = 'add' | 'sub' | 'times' | 'div';

export interface OperationItem {
  operator: Operator;
  value: NumberSource | null | undefined;
}

// null/undefined/空文字/NaNはtrueを返す
const isLikelyUndefined = (b: NumberSource | null | undefined): b is null | undefined | '' => b == null || b === '' || (typeof b === 'number' && Number.isNaN(b));

// 演算の初期値。null/undefined/空文字/NaNはゼロとみなす
const toInitialBig = (value: NumberSource | null | undefined): Big => isLikelyUndefined(value) ? Big(0) : toBig(value);

const operators: Record<Operator, (a: Big, b: NumberSource | null | undefined) => Big> = {
  // null/undefined/空文字/NaNはゼロとみなす
  add: (a, b) => a.add(isLikelyUndefined(b) ? 0 : toBig(b)),
  // null/undefined/空文字/NaNはゼロとみなす
  sub: (a, b) => a.sub(isLikelyUndefined(b) ? 0 : toBig(b)),
  /**
   * 乗算の場合の'b'の値は、計算したい対象によってゼロとみなすのか無視して元の値を保持したいのかの概念が異なる
   * ゼロとみなしたい場合の例：
   *   手数料 x 件数
   *     → このとき件数が未定義(≒ 0)だったら手数料総計は0が適切
   * 無視して元の値を保持したい場合の例：
   *   商品価格 x 割引率
   *     → このとき割引率が未定義(≒ 1)だったら販売価格は元の値(商品価格)が適切
   *
   * この関数のデフォルトの挙動は「ゼロとみなす」とする
   * 1とみなすと、第1引数のnullはゼロとみなすため times(3, null) = 3、times(null, 3) = 0 のように引数の順序で結果が変わってしまう
   * 元の値を保持したいケースでは
   *   NumberUtil.times(price, discount ?? 1)
   * のように、discountが未定義だった場合のフォールバック値を指定する
   */
  // null/undefined/空文字/NaNはゼロとみなす
  times: (a, b) => a.times(isLikelyUndefined(b) ? 0 : toBig(b)),
  /**
   * 除算の場合`isLikelyUndefined(b) = true`をゼロとみなす挙動にすると、0, null, undefined, 空文字などすべてゼロ除算エラーになってしまうため
   * 割る値に限り1とみなし、元の値を保持する挙動とする(明示的に0を指定した場合はゼロ除算エラー)
   *   例) 割引率で割る計算で、割引率が未定義なら元の値が適切
   */
  // null/undefined/空文字/NaNは1とみなす(a / 1 = a)。0を演算対象にするとゼロ除算エラーが発生する
  div: (a, b) => isLikelyUndefined(b) ? a : a.div(toBig(b))
};

function calcAsBig(initialValue: NumberSource | null | undefined, operationItems: OperationItem[]): Big {
  let bigvalue = toInitialBig(initialValue);
  for (const item of operationItems) {
    bigvalue = operators[item.operator](bigvalue, item.value);
  }
  return bigvalue;
}

/**
 * 複数の演算をまとめて計算する
 * 計算途中は精度を保持し、最後にnumberへ変換する
 * この関数では四則演算の優先順位はなく、与えられた配列の順で計算を行う
 * * 優先順位やカッコの概念がある場合は事前に計算したうえでこの関数を利用する
 *
 * 例)
 * calc(
 *   '123',
 *   [
 *     { operator: 'add', value: '123' },
 *     { operator: 'sub', value: 100 },
 *     { operator: 'times', value: 2 },
 *     { operator: 'div', value: 3 }
 *   ]
 * )
 * 123 + 123 = 246
 * 246 - 100 = 146
 * 146 * 2 = 292
 * 292 / 3 = 97.33333333
 *
 * 数学的な感覚だと 123 + 123 - ((100 * 2) / 3) = 229.33333333 となるが、この関数はそのような計算を行わない
 * null等の扱いは add / sub / times / div と同じ
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} initialValue
 * @param {OperationItem[]} operationItems
 *   ├ operator: Operator
 *   ├ value: NumberSource | null | undefined
 * @param {*} [options]
 *   ├ scale 計算結果を丸める小数桁数。指定しない場合は丸めない
 *   ├ roundingMode 丸めモード デフォルトはROUNDING_MODE.roundHalfUp(四捨五入・half-away-from-zero)
 * @returns {number}
 */
export function calc(initialValue: NumberSource | null | undefined, operationItems: OperationItem[], options?: {
  scale?: number;
  roundingMode?: RoundingMode;
}): number {
  let bigvalue = calcAsBig(initialValue, operationItems);
  if (options?.scale != null) {
    bigvalue = bigvalue.round(options.scale, options.roundingMode ?? ROUNDING_MODE.roundHalfUp);
  }
  return bigvalue.toNumber();
}

/**
 * 加算を行う
 * null/undefined/空文字/NaNは0と見做されるため、演算結果に影響しない
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} value1
 * @param {(NumberSource | null | undefined)[]} value2
 * @returns {number}
 */
export function add(value1: NumberSource | null | undefined, ...value2: (NumberSource | null | undefined)[]): number {
  let bigvalue = toInitialBig(value1);
  for (const value of value2) {
    bigvalue = operators.add(bigvalue, value);
  }
  return bigvalue.toNumber();
}

/**
 * 減算を行う
 * null/undefined/空文字/NaNは0と見做されるため、演算結果に影響しない
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} value1
 * @param {(NumberSource | null | undefined)[]} value2
 * @returns {number}
 */
export function sub(value1: NumberSource | null | undefined, ...value2: (NumberSource | null | undefined)[]): number {
  let bigvalue = toInitialBig(value1);
  for (const value of value2) {
    bigvalue = operators.sub(bigvalue, value);
  }
  return bigvalue.toNumber();
}

/**
 * 乗算を行う
 * null/undefined/空文字/NaNは0と見做されるため、演算結果は0になる
 * 元の値を保持したい場合は times(price, discount ?? 1) のようにフォールバック値を指定する
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} value1
 * @param {(NumberSource | null | undefined)[]} value2
 * @returns {number}
 */
export function times(value1: NumberSource | null | undefined, ...value2: (NumberSource | null | undefined)[]): number {
  let bigvalue = toInitialBig(value1);
  for (const value of value2) {
    bigvalue = operators.times(bigvalue, value);
  }
  return bigvalue.toNumber();
}

/**
 * 除算を行う
 * 割る値のnull/undefined/空文字/NaNは1と見做されるため、演算結果に影響しない
 * 割る値に0を指定した場合はゼロ除算エラーになる
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} value1
 * @param {(NumberSource | null | undefined)[]} value2
 * @returns {number}
 */
export function div(value1: NumberSource | null | undefined, ...value2: (NumberSource | null | undefined)[]): number {
  let bigvalue = toInitialBig(value1);
  for (const value of value2) {
    bigvalue = operators.div(bigvalue, value);
  }
  return bigvalue.toNumber();
}

/**
 * 数値を指定した桁で丸める
 * null/undefined/空文字はnull、数値として解釈できない文字列はNaNを返す
 * NaN/Infinityはそのまま返す
 * 戻り値はnumberのため、Number.MAX_SAFE_INTEGERを超える結果は精度が落ちる
 *
 * @param {NumberSource | null | undefined} value
 * @param {number} scale
 * @param {RoundingMode} roundingMode
 *   0 切り捨て
 *   1 四捨五入
 *   2 ISO丸め
 *   3 切り上げ
 * @returns {number | null}
 * @see ROUNDING_MODE
 */
export function round(
  value: NumberSource | null | undefined,
  scale: number,
  roundingMode: RoundingMode
): number | null {
  if (value == null) {
    return null;
  }
  switch (typeof value) {
    case 'number':
      if (!Number.isFinite(value)) {
        // Big.jsはNaN/Infinityを扱えないため
        return value;
      }
      return Big(value).round(scale, roundingMode).toNumber();
    case 'string': {
      const trimmed = value.trim();
      if (trimmed === '') {
        // 空文字は値なしとしてnullと同じ扱いにする
        return null;
      }
      try {
        return Big(trimmed).round(scale, roundingMode).toNumber();
      } catch (error) {
        // 数値として解釈できない文字列([big.js] Invalid number)
        return Number.NaN;
      }
    }
    default:
      return toBig(value).round(scale, roundingMode).toNumber();
  }
}

/**
 * 数値文字列に変換する
 * 指数表記にはならず、通常の表記で返す
 * 数値として解釈できない値はString(value)を返す
 *
 * @param {NumberSource | null | undefined} value
 * @param {*} [options]
 *   ├ scale 小数桁数。指定しない場合は丸めずにすべての桁を返す
 *   ├ roundingMode 丸めモード デフォルトはROUNDING_MODE.roundHalfUp(四捨五入・half-away-from-zero)
 * @returns {string}
 * @see ROUNDING_MODE
 */
export function toString(
  value: NumberSource | null | undefined,
  options?: {
    scale?: number;
    roundingMode?: RoundingMode;
  }
): string {
  if (value == null) {
    return '';
  }
  try {
    const big = toBig(value);
    return options?.scale != null
      ? big.toFixed(options.scale, options.roundingMode ?? ROUNDING_MODE.roundHalfUp)
      : big.toFixed();
  } catch (error) {
    return String(value);
  }
}

/**
 * 数値型をビットの配列に変換する
 * 例)
 * 7 => [1, 2, 4]
 *
 * 第二引数に候補値の配列を渡した場合、対象リストの中から該当するもののうち、値の大きなものから抽出して配列で返す
 * 例)
 * 86, [2, 4, 80] => [2, 4, 80]
 * この例で第二引数を渡さない場合は 86 => [2, 4, 16, 64] になる
 * 候補値はそのビットがすべて立っている場合のみ該当とする(16, [80] => [])
 * いずれの候補値にも分類できないビットは無視される
 * 小数は切り捨て、0以下は空配列を返す
 *
 * @param {number} a
 * @param {(number | string)[]} [candidates]
 * @returns {number[]}
 */
export function bitArray(a: number, candidates?: (number | string)[]): number[] {
  const array: number[] = [];
  const integer = Math.trunc(a);
  if (!Number.isFinite(integer) || integer < 1) {
    return array;
  }
  // ビット演算子は値を32bit整数に切り詰めるため、2^32以上で判定が狂い無限ループになる。BigIntで演算する
  let val = BigInt(integer);
  if (candidates) {
    const cloneArray = candidates.map(a => Number(a)).filter(a => Number.isInteger(a) && 0 < a);
    cloneArray.sort((a: number, b: number) => {
      return b - a;
    });
    for (const clone of cloneArray) {
      const bits = BigInt(clone);
      if ((val & bits) === bits) {
        array.push(clone);
        val -= bits;
      }
    }
    array.sort((a: number, b: number) => {
      return a - b;
    });
  } else {
    const zero = BigInt(0);
    let bit = BigInt(1);
    while (zero < val) {
      if ((val & bit) !== zero) {
        array.push(Number(bit));
        val -= bit;
      }
      bit *= BigInt(2);
    }
  }
  return array;
}

/**
 * 渡されたバイト数値を桁数に応じてMB,GBなどに単位を変更する
 *
 * @param {NumberSource} bytes
 * @param {*} [options]
 *   ┝ scale 小数以下桁数 デフォルト:2
 *   ┝ roundingMode 丸めモード デフォルトはROUNDING_MODE.roundHalfUp(四捨五入・half-away-from-zero)
 *   ┝ format フォーマットするか。trueを指定した場合、3桁カンマ区切り＋小数末尾0の桁揃え
 * @returns {[string, string]} 精度以下を丸めた数値(文字列)と単位をタプルで返す
 */
export function formatBytes(
  bytes: NumberSource,
  options?: {
    scale?: number;
    roundingMode?: RoundingMode;
    format?: boolean;
  }
): [string, string] {
  if (bytes == null || bytes === '') {
    return [String(bytes), ''];
  }
  let bigValue: Big;
  switch (typeof bytes) {
    case 'number':
      if (Number.isNaN(bytes)) {
        // "NaN" を返却
        return ['NaN', ''];
      }
      bigValue = Big(bytes);
      break;
    case 'string':
      try {
        bigValue = Big(removeComma(bytes));
      } catch (error) {
        // 元の文字列を返却
        return [bytes, ''];
      }
      break;
    default:
      // bigintの場合
      bigValue = toBig(bytes);
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bigValue.gte(1024) && i < units.length - 1) {
    bigValue = bigValue.div(1024);
    i++;
  }
  const scale = options?.scale ?? 2;
  const roundingMode = options?.roundingMode ?? ROUNDING_MODE.roundHalfUp;
  if (options?.format) {
    return [formatComma(bigValue.toFixed(), scale, roundingMode), units[i]];
  }
  return [bigValue.round(scale, roundingMode).toString(), units[i]];
}
