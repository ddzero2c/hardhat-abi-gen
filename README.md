# Hardhat ABI Generator

Export Solidity smart contract ABIs and generate javascript objects on compilation via Hardhat. 

## Installation

```bash
yarn add --dev @symblox/hardhat-abi-gen
```

## Usage

Load plugin in Hardhat config:

```javascript
require('@symblox/hardhat-abi-gen');
```

Add configuration under the `abiExporter` key:

| option | description | default |
|-|-|-|
| `path` | path to ABI export directory (relative to Hardhat root) | `'./abi'` |
| `clear` | whether to delete old files in `path` on compilation | `false` |
| `flat` | whether to flatten output directory (may cause name collisions) | `false` |
| `only` | `Array` of `String` matchers used to select included contracts, defaults to all contracts if `length` is 0 | `[]` |
| `except` | `Array` of `String` matchers used to exclude contracts | `[]` |
| `spacing` | number of spaces per indentation level of formatted output | `2` |

```javascript
abiExporter: {
  path: './data/abi',
  clear: true,
  flat: true,
  only: [':ERC20$'],
  spacing: 2
}
```

The `path` directory will be created if it does not exist.

The `clear` option is set to `false` by default because it represents a destructive action, but should be set to `true` in most cases.

ABIs files are saved in the format `[CONTRACT_NAME].json`.
