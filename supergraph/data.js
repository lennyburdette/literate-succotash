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
        __resolveReference({ id }) {
          return {
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
          }[id];
        },
      },
    },
  }),
});

const { url } = await startStandaloneServer(server, { listen: { port: 4003 } });
console.log(`🚀 Data subgraph ready at ${url}`);
