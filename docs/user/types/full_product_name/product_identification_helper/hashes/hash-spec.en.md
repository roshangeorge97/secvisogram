# Hash - Specification

Cryptographic hashes of value type `object` contains all information to identify a file based on its cryptographic hash
values.
Any cryptographic hashes object has the 2 mandatory properties

* [File Hashes](hash/file_hashes-spec.en.md) (`file_hashes`)
* [File Name](hash/filename-spec.en.md) (`filename`)

```
"properties": {
  "file_hashes": {
    // ...
  },
  "filename": {
    // ...
  }
}
```