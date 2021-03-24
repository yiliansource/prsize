# prsize

![npm](https://img.shields.io/npm/v/prsize)
![GitHub branch checks state](https://img.shields.io/github/checks-status/yiliansource/prsize/main)
![npm bundle size](https://img.shields.io/bundlephobia/min/prsize)
![npm](https://img.shields.io/npm/dt/prsize)
![supports](https://img.shields.io/badge/supports-.js%2C%20.ts-green)

---

This is a tool to quickly measure the size of your coding project, in terms of executable code, code-to-comment proportions and file size. Nothing that actually aids in development - just fun metrics here!

The tool currently supports `.js` and `.ts` files. More to come?

You can easily run the tool via `npx` (bundled with `npm` since 5.2):

```sh
npx prsize
```

Alternatively, you can globally install the tool into your commandline:

```sh
npm i -g prsize
prsize
```

## Usage

The default usage is to call the tool the following way:

```sh
npx prsize [path] [options]
```

`path` defaults to the current working directory (`.`), and you can use the [options](#options) below to customize the output.

## Options

| Name       | Default Value | Description                                                                                                                |
| :--------- | :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| `--depth`  | `-1`          | How deep to show the tree. Note that regardless of this, the entire project will be scanned. `-1` to show the entire tree. |
| `--nodirs` | `false`       | Whether to hide directory statistics. Note that the directories themselves will be shown regardless.                       |

## License

The project is licensed under a [MIT license](./license.md).
