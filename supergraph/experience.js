import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { parse } from "graphql";

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs: parse(readFileSync("experience.graphql", "utf-8")),

    resolvers: {
      Query: {
        page(_, { url }) {
          return [
            {
              __typename: "ProductCategoryCollection",
              categoryId: "category:1",
            },
          ];
        },
      },

      ProductCard: {
        blocks({ id }) {
          return [
            {
              __typename: "ProductCardTitle",
              product: { id },
            },
            {
              __typename: "ProductCardImage",
              product: { id },
            },
            {
              __typename: "ProductCardDescription",
              product: { id },
            },
            {
              __typename: "ProductCardPrice",
              product: { id },
            },
          ];
        },
      },
    },
  }),
});

const { url } = await startStandaloneServer(server, { listen: { port: 4001 } });
console.log(`🚀 Experience subgraph ready at ${url}`);
