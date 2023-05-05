import test from "node:test";
import assert from "node:assert";
import {
  injectNecessaryContextSelections,
  fieldsToSelectionSet,
} from "./coprocessor.js";
import { buildSchema, parse, print } from "graphql";

test("injectNecessaryContextSelections", async (t) => {
  const schema = buildSchema(`
    type Query {
      foo: Foo
    }
    type Foo {
      bar: Bar
      baz: String
    }

    type Bar {
      quux: String
    }
  `);
  const result = injectNecessaryContextSelections(
    parse(`query { foo { baz } }`),
    schema,
    new Map([
      [
        "Foo",
        [
          {
            key: "x",
            selectionSets: fieldsToSelectionSet("bar { quux }"),
            graphs: ["graph"],
            typeName: "Foo",
            keyGetter: () => "x",
          },
        ],
      ],
    ]),
    "graph"
  );

  assert.strictEqual(
    print(result),
    `{
  foo {
    baz
    bar {
      quux
    }
  }
}`
  );
});
