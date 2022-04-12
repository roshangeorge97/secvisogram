# File Hash - Specification

Each File hash of value type `object` contains one hash value and algorithm of the file to be identified. Any File hash
object has the 2 mandatory properties

* [Algorithm](file_hash/algorithm-spec.en.md) (`algorithm`)
* [Value](file_hash/value-spec.en.md) (`value`)

```
"properties": {
  "algorithm": {
    // ...
  },
  "value": {
    // ...
  }
}
```