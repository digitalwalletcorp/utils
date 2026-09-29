/**
 * 置換文字列、または現在のマッチ情報から置換文字列を返す関数
 */
export type Replacement = string | ((matcher: RegExpExecArray) => string);

/**
 * マッチ箇所ごとに置換内容を決めながら文字列を組み立てる。
 *
 * 例)
 * const regExpMatcher = new RegExpMatcher(/\:([^/?]+)/g);
 * regExpMatcher.reset('/EWM/WalletID/:WalletID/Job/:JobID');
 * while (regExpMatcher.find()) {
 *   const match = regExpMatcher.group();
 *   if (match === ':WalletID') {
 *     regExpMatcher.appendReplacement('12345');
 *   }
 *   if (match === ':JobID') {
 *     regExpMatcher.appendReplacement('99999999');
 *   }
 * }
 * regExpMatcher.appendTail();
 * regExpMatcher.toString(); // '/EWM/WalletID/12345/Job/99999999'
 */
export class RegExpMatcher {

  private readonly regexp: RegExp;
  private matcher: RegExpExecArray | null = null;
  private str = '';
  private appendPosition = 0;
  private exhausted = false;
  private buffer: string[] = [];

  /**
   * @param {string | RegExp} pattern 文字列の場合はglobal属性を付与して解釈する。RegExpの場合はglobal属性の有無を問わない
   */
  constructor(pattern: string | RegExp) {
    // 走査にはglobal属性が必要。呼び出し側のRegExpのlastIndexを汚さないよう、渡されたRegExpは使わず複製する
    this.regexp = typeof pattern === 'string'
      ? new RegExp(pattern, 'g')
      : new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  }

  /**
   * 走査対象の文字列を設定し、走査位置とバッファを先頭に戻す
   *
   * @param {string} str
   */
  public reset(str: string): void {
    this.str = str;
    this.matcher = null;
    this.appendPosition = 0;
    this.exhausted = false;
    this.buffer = [];
    this.regexp.lastIndex = 0;
  }

  /**
   * 次のマッチ箇所へ進める
   * これ以上マッチしなくなった後は、reset()するまでfalseを返し続ける
   *
   * @returns {boolean} マッチした場合はtrue
   */
  public find(): boolean {
    if (this.exhausted) {
      return false;
    }
    this.matcher = this.regexp.exec(this.str);
    if (!this.matcher) {
      // execは失敗するとlastIndexを0に戻し、次の呼び出しで先頭から再びマッチしてしまうため、走査済みとして止める
      this.exhausted = true;
      return false;
    }
    if (this.matcher[0] === '') {
      // 空文字にマッチするとlastIndexが進まず同じ位置を繰り返すため、1文字(u/v属性ありならコードポイント1つ)進める
      // v属性ではunicodeがfalseになるためflagsで判定する。サロゲートペアの途中から走査すると先頭に戻ってしまい無限ループになる
      const isUnicode = /[uv]/.test(this.regexp.flags);
      const codePoint = this.str.codePointAt(this.regexp.lastIndex);
      this.regexp.lastIndex += isUnicode && codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
    }
    return true;
  }

  /**
   * 現在のマッチ文字列を返す
   *
   * @param {number} [index] キャプチャグループの番号。省略時はマッチ全体
   * @returns {string | null} グループがマッチに参加しなかった場合はnull
   * @throws {Error} マッチしていない場合
   * @throws {RangeError} 存在しないグループ番号を指定した場合
   */
  public group(): string;
  public group(index: number): string | null;
  public group(index = 0): string | null {
    const matcher = this.currentMatcher();
    if (index < 0 || matcher.length <= index) {
      throw new RangeError(`No group ${index}`);
    }
    return matcher[index] ?? null;
  }

  /**
   * 現在のマッチ情報を返す
   *
   * @returns {RegExpExecArray | null} マッチしていない場合はnull
   */
  public getMatcher(): RegExpExecArray | null {
    return this.matcher;
  }

  /**
   * 前回の置換位置から現在のマッチ箇所までの不一致文字列と、マッチ箇所の置換文字列をバッファに追加する
   *
   * @param {Replacement} replace 置換文字列、または置換関数。置換文字列の `$1` などは解釈せずそのまま出力するため、グループを参照する場合は置換関数を渡す
   * @param {(notMatch: string) => string} [notMatchReplacer] 不一致文字列の置換関数
   * @throws {Error} マッチしていない場合
   * @throws {RangeError} 現在のマッチに対して既に呼び出している場合
   */
  public appendReplacement(replace: Replacement, notMatchReplacer?: (notMatch: string) => string): void {
    const matcher = this.currentMatcher();
    if (matcher.index < this.appendPosition) {
      throw new RangeError('appendReplacement has already been called for the current match');
    }
    const notMatch = this.str.slice(this.appendPosition, matcher.index);
    this.buffer.push(notMatchReplacer ? notMatchReplacer(notMatch) : notMatch);
    this.buffer.push(typeof replace === 'function' ? replace(matcher) : replace);
    this.appendPosition = matcher.index + matcher[0].length;
  }

  /**
   * 前回の置換位置から末尾までの文字列をバッファに追加する
   *
   * @param {(tail: string) => string} [tailReplacer] 末尾文字列の置換関数
   */
  public appendTail(tailReplacer?: (tail: string) => string): void {
    const tail = this.str.slice(this.appendPosition);
    this.buffer.push(tailReplacer ? tailReplacer(tail) : tail);
  }

  /**
   * バッファに追加した文字列を連結して返す
   *
   * @returns {string}
   */
  public toString(): string {
    return this.buffer.join('');
  }

  private currentMatcher(): RegExpExecArray {
    if (!this.matcher) {
      throw new Error('No match available');
    }
    return this.matcher;
  }
}
