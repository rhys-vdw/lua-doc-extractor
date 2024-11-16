# lua-doc-extractor

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Extracts lua documentation from C-style comments.

## Install

### From GitHub

```
$ npm install rhys-vdw/lua-doc-extractor
```

## Usage

### CLI

Process files:

```
$ npx lua-doc-extractor some-file.cpp other-files/*.cpp ---dest output
```

Show usage:

```
$ npx lua-doc-extractor --help
```

### Annotations

Annotate your code using [lua language server annotations](https://luals.github.io/wiki/annotations/) in C-style comment blocks that start with exactly `/**`.

> [!IMPORTANT]
> Blocks that start with `/*` or `/***` will _not_ be processed.

### Custom tags

Custom tags are required to generate Lua meta code.

#### `@function <name>`

Outputs the function definition of a function. This is required for any function.

#### `@metatable <name>`

Defines a global table.

### Example

```cpp
/**
 * Main API
 * @metatable Api
 */

/**
 * Get name by ID
 * @function Api.GameName
 * @param id integer The integer of the person.
 * @param firstNameOnly boolean Return only first name.
 * @return string name The full or first name of the person.
 */
int SomeClass::GameName(lua_State *L)
{
```

Generates:

```lua
---@meta

---Main API
Api = {}

---Get name by ID
---@param id integer The integer of the person.
---@param firstNameOnly boolean Return only first name.
---@return string name The full or first name of the person.
function Api.GameName(id, firstNameOnly) end
```

## Contributing

PRs accepted.

## License

MIT
