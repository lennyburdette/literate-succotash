import express from "express";
import bodyParser from "body-parser";
import { z } from "zod";
import {
  GraphQLSchema,
  Kind,
  TypeInfo,
  buildSchema,
  isCompositeType,
  isEnumType,
  isNamedType,
  isObjectType,
  isUnionType,
  parse,
  print,
  visit,
  visitWithTypeInfo,
} from "graphql";
import { getDirective } from "@graphql-tools/utils";
import { default as Hasher } from "node-object-hash";

const hasher = Hasher.hasher();

const app = express();
app.use(bodyParser.json());

/** @type {GraphQLSchema} */
let schema;
/** @type {Map<string, string>} */
let graphNameMap;
/** @type {ReturnType<findSetContext>} */
let setContextMap;
/** @type {ReturnType<findFromContext>} */
let fromContextMap;

const CONTEXT_KEY = "test::context";

app.post("/", async (_req, res) => {
  try {
    const result = InboundSchema.safeParse(_req.body);

    if (!result.success) {
      console.log(result);
      res.json(_req.body);
      return;
    }

    const { data: req } = result;

    switch (req.stage) {
      case "RouterRequest":
        schema = buildSchema(req.sdl);
        graphNameMap = findGraphNames(schema);
        setContextMap = findSetContext(schema);
        fromContextMap = findFromContext(schema);
        break;

      case "SubgraphRequest":
        {
          if (
            req.body.variables?.representations &&
            Array.isArray(req.body.variables?.representations)
          ) {
            console.log(req.body.variables.representations);
            for (const rep of req.body.variables.representations) {
              const hash = hasher.hash(rep);
              const contextValue = req.context.entries[CONTEXT_KEY][hash];
              if (contextValue) {
                for (const [key, value] of Object.entries(contextValue)) {
                  rep[key] = value;
                }
              }
            }
          }

          req.body.query = print(
            injectNecessaryContextSelections(
              parse(req.body.query),
              schema,
              setContextMap,
              req.serviceName
            )
          );
        }
        break;

      case "SubgraphResponse":
        const results = extractContextValues(req.body.data, setContextMap);

        if (results.size > 0) {
          if (!req.context.entries[CONTEXT_KEY])
            req.context.entries[CONTEXT_KEY] = {};
          for (const [key, { value }] of results.entries()) {
            req.context.entries[CONTEXT_KEY][key] = value;
          }
        }
        break;
      default:
        throw new Error("invalid request");
    }

    res.json(req);
  } catch (e) {
    console.log(e);
  }
});

app.listen(4999, () => {
  console.log("Coprocessor listening at http://localhost:4999/");
});

const InboundSchema = z.discriminatedUnion("stage", [
  z.object({
    version: z.literal(1),
    stage: z.literal("RouterRequest"),
    control: z.literal("continue"),
    id: z.string(),
    context: z.object({
      entries: z.record(z.string(), z.any()),
    }),
    sdl: z.string(),
  }),
  z.object({
    version: z.literal(1),
    stage: z.literal("SubgraphRequest"),
    control: z.literal("continue"),
    id: z.string(),
    body: z.object({
      query: z.string(),
      variables: z.record(z.string(), z.any()).optional(),
      operationName: z.string().optional(),
    }),
    context: z.object({
      entries: z.record(z.string(), z.any()),
    }),
    serviceName: z.string(),
  }),
  z.object({
    version: z.literal(1),
    stage: z.literal("SubgraphResponse"),
    // control: z.literal("continue"),
    id: z.string(),
    body: z.object({
      data: z.record(z.string(), z.any()).optional(),
      error: z.array(z.object({ message: z.string() })).optional(),
    }),
    context: z.object({
      entries: z.record(z.string(), z.any()),
    }),
    serviceName: z.string(),
  }),
]);

const SetContextSchema = z.object({
  name: z.string(),
  from: z.string(),
});

const JoinGraphSchema = z.object({
  graph: z.string(),
});

const JoinFieldSchema = z.object({
  graph: z.string(),
});

const JoinType = z.object({
  graph: z.string(),
  key: z.string(),
});

/**
 * @param {GraphQLSchema} schema
 */
function findSetContext(schema) {
  /** @type {Map<string, {
   *  key: string;
   *  selectionSets: import("graphql").SelectionSetNode;
   *  graphs: string[];
   *  typeName: string;
   *  keyGetter: (data: any) => any;
   * }[]>} */
  const results = new Map();
  for (const [name, type] of Object.entries(schema.getTypeMap())) {
    if (!isObjectType(type)) continue;

    const setContextDirectives =
      getDirective(schema, type, "setContext")?.map((d) =>
        SetContextSchema.parse(d)
      ) ?? [];

    if (!setContextDirectives.length) continue;

    const keys = new Set(
      getDirective(schema, type, "join__type")
        ?.map((d) => JoinType.parse(d))
        ?.map((d) => d.key) ?? []
    );

    if (keys.size > 1) {
      throw new Error("only one @key directive is supported");
    }

    const configs = [];
    for (const directive of setContextDirectives) {
      const key = directive.name;
      const selections = directive.from;
      /** @type {string[]} */
      let graphs = [];

      const joinGraph =
        getDirective(schema, type, "join__graph")?.map((d) =>
          JoinGraphSchema.parse(d)
        ) ?? [];

      for (const fieldName of fieldNamesFromSelection(selections)) {
        const field = type.getFields()[fieldName];
        if (!field) continue;

        const joinFieldDirectives =
          getDirective(schema, field, "join__field")?.map((d) =>
            JoinFieldSchema.parse(d)
          ) ?? [];

        graphs = joinFieldDirectives.flatMap(
          (d) => graphNameMap.get(d.graph) ?? []
        );
        if (!joinFieldDirectives.length) {
          graphs = joinGraph.flatMap((d) => graphNameMap.get(d.graph) ?? []);
        }
      }

      configs.push({
        key,
        selectionSets: fieldsToSelectionSet(selections),
        graphs,
        typeName: type.name,
        keyGetter: (/** @type {any} */ data) => {
          const masked = applyFragmentMask(
            data,
            fieldsToSelectionSet([...keys][0])
          );
          return { ...masked, __typename: type.name };
        },
      });
    }

    if (configs.length) {
      results.set(name, configs);
    }
  }
  return results;
}

const FromContextSchema = z.object({
  name: z.string(),
});

/**
 * @param {GraphQLSchema} schema
 */
function findFromContext(schema) {
  /** @type {Map<string, z.infer<FromContextSchema>[]>} */
  const results = new Map();
  for (const [name, type] of Object.entries(schema.getTypeMap())) {
    if (isCompositeType(type) && !isUnionType(type)) {
      for (const [f, field] of Object.entries(type.getFields())) {
        for (const arg of field.args) {
          const fromContextDirectives = getDirective(
            schema,
            arg,
            "fromContext"
          )?.map((d) => FromContextSchema.parse(d));

          if (fromContextDirectives) {
            results.set(`${name}.${f}(${arg.name}:)`, fromContextDirectives);
          }
        }
      }
    }
  }
  return results;
}

/**
 * @param {import("graphql").DocumentNode} doc
 * @param {GraphQLSchema} schema
 * @param {Required<typeof setContextMap>} setContextMap
 * @param {string} serviceName
 */
export function injectNecessaryContextSelections(
  doc,
  schema,
  setContextMap,
  serviceName
) {
  const typeInfo = new TypeInfo(schema);

  return visit(
    doc,
    visitWithTypeInfo(typeInfo, {
      SelectionSet(node) {
        const type = typeInfo.getType();

        if (isNamedType(type)) {
          const contextSelections = setContextMap.get(type.name);

          if (!contextSelections) return;

          const relevantContextSelections = contextSelections.filter((c) =>
            c.graphs.includes(serviceName)
          );

          return {
            ...node,
            selections: [
              ...node.selections,
              {
                kind: Kind.FIELD,
                name: { kind: Kind.NAME, value: "__typename" },
              },
              ...relevantContextSelections.flatMap(
                (c) => c.selectionSets.selections
              ),
            ],
          };
        }
      },
    })
  );
}

/**
 * @param {any} data
 * @param {Required<typeof setContextMap>} setContextMap
 */
function extractContextValues(data, setContextMap, results = new Map()) {
  if (data === null) return results;
  if (data === undefined) return results;
  if (typeof data !== "object") return results;

  if (Array.isArray(data)) {
    data.forEach((v) => extractContextValues(v, setContextMap, results));
  }

  for (const [typeName, configs] of setContextMap.entries()) {
    if (data.__typename === typeName) {
      for (const config of configs) {
        const contextValue = applyFragmentMask(data, config.selectionSets);
        if (!contextValue) continue;

        const key = config.keyGetter(data);
        results.set(hasher.hash(key), { key, value: contextValue });
      }
    }
  }

  for (const [_, value] of Object.entries(data)) {
    extractContextValues(value, setContextMap, results);
  }

  return results;
}

/**
 * @param {GraphQLSchema} schema
 */
function findGraphNames(schema) {
  const graphEnum = schema.getTypeMap()["join__Graph"];
  if (!isEnumType(graphEnum)) {
    throw new Error("join__Graph enum not found");
  }

  return new Map(
    graphEnum.getValues().map((v) => {
      const directive = getDirective(schema, v, "join__graph")?.[0];
      return [v.name, directive?.name];
    })
  );
}

/**
 * @param {string} string
 */
export function fieldsToSelectionSet(string) {
  const op = parse(`{ ${string} }`).definitions[0];

  if (op.kind === Kind.OPERATION_DEFINITION) {
    return op.selectionSet;
  }

  throw new Error("invalid selection set");
}

/**
 * @param {string} selections
 */
function fieldNamesFromSelection(selections) {
  return fieldsToSelectionSet(selections).selections.flatMap((s) =>
    s.kind === Kind.FIELD ? s.name.value : []
  );
}

/**
 * @param {any} data
 * @param {import("graphql").SelectionSetNode} [selectionSet]
 * @returns {any}
 */
function applyFragmentMask(data, selectionSet) {
  if (data === null) return null;
  if (data === undefined) return undefined;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((v) => applyFragmentMask(v, selectionSet));
  }

  if (!selectionSet) {
    return data;
  }

  /**
   * @type {Record<string, any>}
   */
  const result = {};
  for (const s of selectionSet.selections) {
    if (s.kind === Kind.FIELD) {
      const name = s.name.value;
      const value = data[name];
      if (!value) continue;
      result[name] = applyFragmentMask(value, s.selectionSet);
    }
  }

  if (!Object.keys(result).length) return null;
  return result;
}
