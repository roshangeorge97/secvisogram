# Relationship - Specification

The Relationship item is of value type `object` and has four mandatory properties:

* [Relationship category](relationship/category-spec.en.md) (`category`)
* [Full Product Name](relationship/full_product_name-spec.en.md) (`full_product_name`)
* [Product Reference](relationship/product_reference-spec.en.md) (`product_reference`)
* [Relates to Product Reference](relationship/relates_to_product_reference-spec.en.md) (`relates_to_product_reference`)

The Relationship item establishes a link between two existing `full_product_name_t` elements, allowing the document
producer to define a combination of two products that form a new `full_product_name` entry.

```
"properties": {
  "category": {
    // ...
  },
  "full_product_name": {
    // ...
  },
  "product_reference": {
    // ...
  },
  "relates_to_product_reference": {
    // ...
  }
}
```

> The situation where a need for declaring a Relationship arises, is given when a product is e.g. vulnerable only when
> installed together with another, or to describe operating system components.