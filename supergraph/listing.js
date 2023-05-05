import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { parse } from "graphql";

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs: parse(readFileSync("listing.graphql", "utf-8")),

    resolvers: {
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

const { url } = await startStandaloneServer(server, { listen: { port: 4002 } });
console.log(`🚀 Listing subgraph ready at ${url}`);
