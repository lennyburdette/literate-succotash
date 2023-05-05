import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { parse } from "graphql";

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs: parse(readFileSync("data.graphql", "utf-8")),

    resolvers: {
      Product: {
        /**
         * @param {{ id: string }} ref
         * @returns {typeof PRODUCTS[keyof typeof PRODUCTS]}
         */
        __resolveReference({ id }) {
          return PRODUCTS[id];
        },
      },

      ProductCategory: {
        products({ id, template }) {
          if (id === "category:1") {
            return {
              edges: [
                {
                  node: {
                    id: "product:1",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:1",
                },
                {
                  node: {
                    id: "product:2",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:2",
                },
                {
                  node: {
                    id: "product:3",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:3",
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: "product:1",
                endCursor: "product:3",
              },
            };
          } else {
            return {
              edges: [
                {
                  node: {
                    id: "product:3",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:3",
                },
                {
                  node: {
                    id: "product:5",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:5",
                },
                {
                  node: {
                    id: "product:6",
                  },
                  template,
                  kind: "FEATURED",
                  cursor: "product:6",
                },
              ],
              pageInfo: {
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: "product:4",
                endCursor: "product:6",
              },
            };
          }
        },
      },
    },
  }),
});

/** @type {Record<string, any>} */
const PRODUCTS = {
  "product:1": {
    id: "product:1",
    name: "Product 1",
    description: "Product 1 description",
    imageUrl: "https://picsum.photos/200/300",
    price: { value: 100, currency: "USD" },
  },
  "product:2": {
    id: "product:2",
    name: "Product 2",
    description: "Product 2 description",
    imageUrl: "https://picsum.photos/200/300",
    price: { value: 200, currency: "USD" },
  },
  "product:3": {
    id: "product:3",
    name: "Product 3",
    description: "Product 3 description",
    imageUrl: "https://picsum.photos/200/300",
    price: { value: 300, currency: "USD" },
  },
};

const { url } = await startStandaloneServer(server, { listen: { port: 4003 } });
console.log(`🚀 Data subgraph ready at ${url}`);
