#### RegExpMatcher

Builds a replaced string match by match. Inspired by Java's `Pattern` / `Matcher`.
Use it when each match needs its own replacement logic, or when the unmatched parts also need to be transformed.

`RegExpMatcher` is exported from its own subpath only. It is not part of the root export.

```ts
import { RegExpMatcher } from '@digitalwalletcorp/utils/reg-exp-matcher';

const regExpMatcher = new RegExpMatcher(/\{([^}]+)\}/g);
regExpMatcher.reset('Hello {name}, you have {count} messages.');
while (regExpMatcher.find()) {
  regExpMatcher.appendReplacement(values[regExpMatcher.group(1) ?? ''] ?? '');
}
regExpMatcher.appendTail();
regExpMatcher.toString(); // 'Hello Taro, you have 3 messages.'
```

##### 📝 Types

| Type | Definition | Description |
| ---- | ---------- | ----------- |
| `Replacement` | `string \| ((matcher: RegExpExecArray) => string)` | A replacement string, or a function that returns one from the current match. |

##### 🏗️ Constructor

###### `new RegExpMatcher(pattern)`

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `pattern` | `string \| RegExp` | A string is compiled with the `g` flag. A `RegExp` may or may not have the `g` flag; it is copied, so its `lastIndex` is never touched. |

##### 🔍 Scanning

###### `reset(str)`

Sets the string to scan and resets the position and the buffer. The same instance can be reused for several strings.

###### `find()`

Advances to the next match and returns `true`, or returns `false` when there are no more matches.
Once it has returned `false`, it keeps returning `false` until `reset()` is called.
An empty match (e.g. `/x*/g`) advances by one character (one code point with the `u` or `v` flag) so that scanning always terminates, the same as `String.prototype.replaceAll`.

###### `group(index?)` / `getMatcher()`

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `group()` | `string` | The whole current match. |
| `group(index)` | `string \| null` | The capture group `index`. `null` when the group did not take part in the match. |
| `getMatcher()` | `RegExpExecArray \| null` | The current `exec` result. `null` when there is no match. |

`group()` throws an `Error` when there is no current match, and a `RangeError` when the group `index` does not exist.

##### ✏️ Building the result

###### `appendReplacement(replace, notMatchReplacer?)`

Appends the unmatched text before the current match (optionally transformed by `notMatchReplacer`) and then the replacement.
Throws an `Error` when there is no current match, and a `RangeError` when it has already been called for the current match.

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `replace` | `Replacement` | The replacement for the current match. A string is output as-is: unlike `String.prototype.replace`, `$1` and `$&` are not interpreted, so pass a function to use a capture group. An empty string is respected. |
| `notMatchReplacer` | `(notMatch: string) => string` | Optional. Transforms the unmatched text before the match. |

###### `appendTail(tailReplacer?)`

Appends the text after the last replaced match (optionally transformed by `tailReplacer`).

###### `toString()`

Returns the built string.

```ts
// Transform the unmatched parts too: keep ASCII words, romanize the rest
const regExpMatcher = new RegExpMatcher(/[!-~]+/g);
regExpMatcher.reset('やまだ Taro');
while (regExpMatcher.find()) {
  regExpMatcher.appendReplacement(regExpMatcher.group(), (notMatch) => romanize(notMatch));
}
regExpMatcher.appendTail((tail) => romanize(tail));
```
