# lua-doc-extractor

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Extracts lua documentation from C-style comments.

## Install

```sh
$ npm install -g lua-doc-extractor
```

## Usage

### Example

#### Input

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
 * @field FirstName 1 First name.
 * @field LastName 2 Last name.
 */

/***
 * @field NameType.FullName 3 Full name, including middle names.
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

#### Output

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
	--- First name.
	FirstName = 1,

	---Last name.
	LastName = 2,

	---Full name, including middle names.
	FullName = 3
}

---Get name by ID
---
---@param id integer The integer of the person.
---@param nameType NameType Which name to return.
---@return string name The full or first name of the person.
function Api.GetName(id, nameType) end
```

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

### Comments

Lua docs in document comment blocks (`/*** <docs> */`) will be parsed.

### Annotations

All [lua language server annotations](https://luals.github.io/wiki/annotations/) can be used, some with special handling. Some additional annotations are required by lua-doc-extractor.

#### `@global`

```
@global <name> <type> [description]
```

Defines a global variable.

#### `@field`

```
@field <name> <type> [description]
```

Add fields to a table (`@table`, `@class` or `@enum`) by including them in the same comment.

```

@field <table>.<name> <type> [description]
```

You can also add fields to a table defined in a different comment.

#### `@function`

```
@function <name> [description]
```

Defines a global function.

```
@function <table>.<name> [description]
@function <table>:<name> [description]
```

Adds a function to a [`@table`](#table) or [`@class`](#class) defined in a different comment.

Should be paired with `@param`, `@return` and `@generic` attributes.

#### `@table`

```
@table <name>
```

Defines a global table. Fields can be added with [`@field`](#field).

#### `@enum`

```
@enum <name>
```

Defines a global table marked with the `@enum` attribute. Entries can be added with [`@field`](#field).

#### `@class`

```
@class <name>
```

Defines a class. Fields can be added with [`@field`](#field), methods can be added with [`@function`](#function).

## Contributing

PRs accepted.

## License

MIT
