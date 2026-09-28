#### NumberUtil

Decimal-safe arithmetic, rounding and number formatting.
Calculations are performed internally with arbitrary-precision decimals, so results such as `0.1 + 0.2` are exact.

```ts
import { NumberUtil } from '@digitalwalletcorp/utils';

NumberUtil.add(0.1, 0.2);                   // 0.3
NumberUtil.formatComma(1234.5, 2);          // '1,234.50'
NumberUtil.calc(1, [{ operator: 'div', value: 3 }], { scale: 4 }); // 0.3333
```

##### 📝 Types

| Type | Definition | Description |
| ---- | ---------- | ----------- |
| `NumberSource` | `number \| string \| bigint` | A value that can be treated as a number. |
| `RoundingMode` | `0 \| 1 \| 2 \| 3` | A rounding mode. Use `ROUNDING_MODE` instead of the raw values. |
| `Operator` | `'add' \| 'sub' \| 'times' \| 'div'` | An operator of `calc`. |
| `OperationItem` | `{ operator: Operator; value: NumberSource \| null \| undefined; }` | An operation of `calc`. |

##### 🎯 ROUNDING_MODE

| Name | Description |
| ---- | ----------- |
| `ROUNDING_MODE.roundDown` | Rounds towards zero (truncates). |
| `ROUNDING_MODE.roundHalfUp` | Rounds to the nearest neighbour. If equidistant, rounds away from zero. The default of the functions that take an optional rounding mode. |
| `ROUNDING_MODE.roundHalfEven` | Rounds to the nearest neighbour. If equidistant, rounds to the even neighbour. |
| `ROUNDING_MODE.roundUp` | Rounds away from zero. |

##### ⚠️ Handling of empty values in arithmetic

`add` / `sub` / `times` / `div` / `calc` treat `null`, `undefined`, `''` and `NaN` as follows.

| Position | Treated as |
| -------- | ---------- |
| The first argument (initial value) | `0` |
| A value of `add` / `sub` / `times` | `0` |
| The divisor of `div` | `1` (the value is kept). Passing `0` explicitly throws a division by zero error. |

Multiplication treats an empty value as `0` so that the result does not depend on the order of the arguments (`times(3, null)` and `times(null, 3)` are both `0`).
When an empty value should keep the original value, specify the fallback explicitly.

```ts
NumberUtil.times(100, null);            // 0
NumberUtil.times(100, discount ?? 1);   // 100 when discount is null
NumberUtil.div(100, null);              // 100
NumberUtil.div(100, 0);                 // throws an error
```

The arithmetic functions return `number`, so results beyond `Number.MAX_SAFE_INTEGER` lose precision even when `bigint` values are passed.

##### 🧮 Arithmetic

###### `add(value1, ...values)` / `sub(value1, ...values)` / `times(value1, ...values)` / `div(value1, ...values)`

Adds, subtracts, multiplies or divides the values in order.

```ts
NumberUtil.add(0.1, 0.2);          // 0.3
NumberUtil.add(100, null, '50');   // 150
NumberUtil.sub(0.3, 0.1);          // 0.2
NumberUtil.times(1.1, 3);          // 3.3
NumberUtil.div(1, 3);              // 0.3333333333333333
```

###### `calc(initialValue, operationItems, options?)`

Calculates the operations in the order of the array, keeping precision until the end.
There is no operator precedence; calculate grouped expressions beforehand.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `scale` | `number` | The number of decimal places of the result. The result is not rounded when omitted. |
| `roundingMode` | `RoundingMode` | Defaults to `ROUNDING_MODE.roundHalfUp`. |

```ts
// ((123 + 123) - 100) * 2 / 3
NumberUtil.calc('123', [
  { operator: 'add', value: '123' },
  { operator: 'sub', value: 100 },
  { operator: 'times', value: 2 },
  { operator: 'div', value: 3 }
]); // 97.33333333333333

NumberUtil.calc(1, [{ operator: 'div', value: 3 }], { scale: 4 }); // 0.3333
```

###### `round(value, scale, roundingMode)`

Rounds a value to `scale` decimal places.
Returns `null` for `null`, `undefined` and blank strings, and `NaN` for strings that cannot be parsed as a number. `NaN` and `Infinity` are returned as they are.

```ts
NumberUtil.round(1.235, 2, NumberUtil.ROUNDING_MODE.roundHalfUp);   // 1.24
NumberUtil.round(12.5, 0, NumberUtil.ROUNDING_MODE.roundHalfEven);  // 12
NumberUtil.round('', 2, NumberUtil.ROUNDING_MODE.roundHalfUp);      // null
NumberUtil.round('abc', 2, NumberUtil.ROUNDING_MODE.roundHalfUp);   // NaN
```

##### 🔤 Formatting

###### `formatComma(value, scale?, roundingMode?)`

Formats a value with thousands separators.
Values in exponential notation are expanded. Strings that cannot be parsed as a number are returned as they are, and `NaN` / `Infinity` are returned as `'NaN'` / `'Infinity'`.
`roundingMode` defaults to `ROUNDING_MODE.roundHalfUp`.

```ts
NumberUtil.formatComma(1234567);                                          // '1,234,567'
NumberUtil.formatComma(1234.5, 2);                                        // '1,234.50'
NumberUtil.formatComma('1234.567', 2, NumberUtil.ROUNDING_MODE.roundDown); // '1,234.56'
NumberUtil.formatComma(1e21);                                             // '1,000,000,000,000,000,000,000'
NumberUtil.formatComma('abc');                                            // 'abc'
NumberUtil.formatComma(null);                                             // ''
```

###### `removeComma(value)`

Removes commas from a string.

```ts
NumberUtil.removeComma('1,234'); // '1234'
```

###### `formatCompact(value, locale)`

Formats a number in the compact notation of the locale.

```ts
NumberUtil.formatCompact(12000, 'en'); // '12K'
NumberUtil.formatCompact(12000, 'ja'); // '1.2万'
```

###### `toString(value, options?)`

Converts a value to a string without exponential notation.
Returns `''` for `null` and `undefined`, and `String(value)` for values that cannot be converted.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `scale` | `number` | The number of decimal places. All digits are returned when omitted. |
| `roundingMode` | `RoundingMode` | Defaults to `ROUNDING_MODE.roundHalfUp`. |

```ts
NumberUtil.toString(1e21);                    // '1000000000000000000000'
NumberUtil.toString(12345678901234567890n);   // '12345678901234567890'
NumberUtil.toString(0.1, { scale: 3 });       // '0.100'
NumberUtil.toString(null);                    // ''
```

###### `formatBytes(bytes, options?)`

Converts a number of bytes to `B` / `KB` / `MB` / `GB` / `TB` (1 KB = 1024 B) and returns the value and the unit as a tuple.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `scale` | `number` | The number of decimal places. Defaults to `2`. |
| `roundingMode` | `RoundingMode` | Defaults to `ROUNDING_MODE.roundHalfUp`. |
| `format` | `boolean` | Applies thousands separators and pads the decimal places with zeros. |

```ts
NumberUtil.formatBytes(1536);                                  // ['1.5', 'KB']
NumberUtil.formatBytes(1125899906842624, { format: true });    // ['1,024.00', 'TB']
```

##### 🔍 Others

###### `isLongValue(value, options?)`

Checks whether a value is within the 64-bit integer range (`-9223372036854775808` to `9223372036854775807`).
Returns `false` for values that cannot be parsed as a number.

| Option | Type | Description |
| ------ | ---- | ----------- |
| `minValue` | `number` | Overrides the minimum value (e.g. `0` rejects negative values). |

```ts
NumberUtil.isLongValue('9223372036854775807');      // true
NumberUtil.isLongValue('9223372036854775808');      // false
NumberUtil.isLongValue('-1', { minValue: 0 });      // false
```

###### `bitArray(value, candidates?)`

Splits a number into its bit values.
With `candidates`, returns the candidates whose bits are all set, taken from the largest one. Bits that match no candidate are ignored.
Decimals are truncated, and `0` or less returns an empty array.

```ts
NumberUtil.bitArray(86);              // [2, 4, 16, 64]
NumberUtil.bitArray(86, [2, 4, 80]);  // [2, 4, 80]
NumberUtil.bitArray(16, [80]);        // []
```
