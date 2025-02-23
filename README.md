# lua-doc-extractor

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Extracts lua documentation from C-style comments.

## Install

### From GitHub

```
$ npm install -g lua-doc-extractor
```

## Usage

### CLI

Process files:

```sh
$ lua-doc-extractor some-file.cpp other-files/*.cpp --dest output
```

Show usage:

```sh
$ lua-doc-extractor --help
```

To add GitHub source links to the exported library. Provide the `--repo` argument.

```sh
$ lua-doc-extractor **/*.cpp --dest library --repo https://github.com/beyond-all-reason/spring/blob/62ee0b4/
```

### Annotations

Annotate your using [lua language server annotations](https://luals.github.io/wiki/annotations/) in document comment blocks (`/*** <docs> */`).

### Custom tags

Custom tags are required to generate Lua meta code.

#### `@global <name> <type>`

Defines a global variable with a given type.

#### `@function <name>`

Outputs the definition of a function.

#### `@table <name>`

Defines a global table. Add fields to the table using `@field name type [description]`.

### Example

```cpp
/***
 * Main API
 * @table Api
 * @field Version integer
 */

/***
 * The absolute path to the executable.
 * @global ExecutablePath string
 */

/***
 * @enum NameType
 * @field FirstName 1
 * @field LastName 2
 * @field FullName 3
 */

/***
 * Get name by ID
 * @function Api.GetName
 * @param id integer The integer of the person.
 * @param nameType NameType Which name to return.
 * @return string name The full or first name of the person.
 */
int SomeClass::GetName(lua_State *L)
{
```

Generates:

```lua
---@meta

---Main API
Api = {
	---@type integer
	Version = nil
}

---The absolute path to the executable.
---@type string
ExectablePath = nil

---@enum NameType
NameType = {
	FirstName = 1,
	LastName = 2,
	FullName = 3
}

---Get name by ID
---
---@param id integer The integer of the person.
---@param nameType NameType Which name to return.
---@return string name The full or first name of the person.
function Api.GetName(id, nameType) end
```

## Contributing

PRs accepted.

## License

MIT
