# utils

[![NPM Version](https://img.shields.io/npm/v/%40digitalwalletcorp%2Futils)](https://www.npmjs.com/package/@digitalwalletcorp/utils) [![License](https://img.shields.io/npm/l/%40digitalwalletcorp%2Futils)](https://opensource.org/licenses/MIT) [![Build Status](https://img.shields.io/github/actions/workflow/status/digitalwalletcorp/utils/ci.yml?branch=main)](https://github.com/digitalwalletcorp/utils/actions) [![Test Coverage](https://img.shields.io/codecov/c/github/digitalwalletcorp/utils.svg)](https://codecov.io/gh/digitalwalletcorp/utils)

A javascript utility.

#### ✨ Features

* **Grouped by purpose**: Each utility is exported as a namespace (e.g. `NumberUtil`).
* **No external types in the public API**: Third-party libraries are used internally only, so they can be replaced without affecting your code.
* **Fully typed**: Type definitions are included.

#### ✅ Compatibility

- ✅ **Node.js**: Fully supported on all modern Node.js versions.
- ✅ **Browsers**: Fully supported on all modern browsers that support ES2020 (`BigInt`).

#### 📦 Installation

```bash
npm install @digitalwalletcorp/utils
# or
yarn add @digitalwalletcorp/utils
```

#### 📖 Usage

```ts
import { NumberUtil } from '@digitalwalletcorp/utils';

NumberUtil.formatComma(1234567.891, 2); // '1,234,567.89'
```

#### 🧰 Utilities

| Utility | Description |
| ------- | ----------- |
| [`NumberUtil`](https://github.com/digitalwalletcorp/utils/blob/main/docs/number-util.md) | Decimal-safe arithmetic, rounding and number formatting. |
| [`RegExpMatcher`](https://github.com/digitalwalletcorp/utils/blob/main/docs/reg-exp-matcher.md) | Match-by-match string replacement, inspired by Java's `Pattern` / `Matcher`. Imported from `@digitalwalletcorp/utils/reg-exp-matcher`. |

#### 📜 License

This project is licensed under the MIT License. See the [LICENSE](https://opensource.org/licenses/MIT) file for details.
