# lua-doc-extractor

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Extracts lua documentation from C-style comments.

## Install

### From GitHub

```
$ npm install rhys-vdw/lua-doc-extractor
```

Note: Global install from GitHub fails.

## Usage

### Lua language server

Annotate your code using [lua language server annotations](https://luals.github.io/wiki/annotations/) in C-style code blocks that start with `/***`.

### Custom tags

Custom tags are required to generate Lua meta code.

#### `@function <name>`

Required with any function to output

#### Example

```cpp
/***
 * Get name by ID
 * @function Api.GetNames
 * @param id integer The integer of the person.
 * @param boolean firstNameOnly Return only first name.
 * @return string name The full or first name of the person.
 */
int SomeClasss::GetNames(lua_State *L)
{
  // ...
```

### CLI

#### Usage guide

```
$ npx lua-doc-extractor -h
```

## Contributing

PRs accepted.

## License

MIT

```

```
