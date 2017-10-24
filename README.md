# FoxyDoc

Docblock parser with custom tags. Automatically generates markdown files.

Allows any type of docblock tag e.g. @param, @option, @foo, @bar

# Install

```
npm install foxydoc -g
```

# Usage

```
foxydoc --included-paths foo bar --exclude-pattern demo --output-directory docs
```

# Command Line Arguments

| Name                | Type    | Description                            |
| --------------------|---------|----------------------------------------|
| `--included-paths`  | `Array` | Paths to generate from                 |
| `--exclude-pattern` | `String`| Regex pattern to exclude               |
| `--output-directory`| `String`| Location of markdown output            |
