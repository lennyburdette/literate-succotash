import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { parse } from "graphql";

const server = new ApolloServer({
  schema: buildSubgraphSchema({
    typeDefs: parse(readFileSync("listing.graphql", "utf-8")),

    resolvers: {
      ProductCategoryCollection: {
        products({ categoryId }) {
          return {
            edges: [
              {
                node: {
                  __typename: "FeaturedProductCard",
                  id: "product:1",
                },
                cursor: "product:1",
              },
              {
                node: {
                  __typename: "FeaturedProductCard",
                  id: "product:2",
                },
                cursor: "product:2",
              },
              {
                node: {
                  __typename: "FeaturedProductCard",
                  id: "product:3",
                },
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
        },
      },
    },
  }),
});

const { url } = await startStandaloneServer(server, { listen: { port: 4002 } });
console.log(`🚀 Listing subgraph ready at ${url}`);
