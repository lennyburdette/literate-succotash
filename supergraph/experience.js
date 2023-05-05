import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { readFileSync } from "fs";
import { parse } from "graphql";

const server = new ApolloServer({
  plugins: [
    {
      async requestDidStart(ctx) {
        // console.log(ctx.request.query);
        return {};
      },
    },
  ],
  schema: buildSubgraphSchema({
    typeDefs: parse(readFileSync("experience.graphql", "utf-8")),

    resolvers: {
      Query: {
        page(_, { url }) {
          return [
            {
              __typename: "ProductCategoryCollection",
              categoryId: "category:1",
              template: { id: "template:1" },
            },
            {
              __typename: "ProductCategoryCollection",
              categoryId: "category:2",
              template: { id: "template:2" },
            },
          ];
        },
      },

      ProductEdge: {
        blocks({ node: { id }, template }) {
          if (!template?.id) {
            return [
              {
                __typename: "ProductCardTitle",
                product: { id },
              },
            ];
          }
          if (template?.id === "template:1") {
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
          } else if (template?.id === "template:2") {
            return [
              {
                __typename: "ProductCardTitle",
                product: { id },
              },
              {
                __typename: "ProductCardPrice",
                product: { id },
              },
              {
                __typename: "ProductCardDescription",
                product: { id },
              },
            ];
          }
        },
      },

      ProductCardTitle: {
        title({ product: { name } }) {
          return `TITLE: ${name}`;
        },
      },

      ProductCardDescription: {
        description({ product: { description } }) {
          return `Description: ${description}`;
        },
      },

      ProductCardImage: {
        imageUrl({ product: { imageUrl } }) {
          return imageUrl;
        },
      },

      ProductCardPrice: {
        priceFormatted({ product: { price } }) {
          return `${price.currency} ${price.value}`;
        },
      },
    },
  }),
});

const { url } = await startStandaloneServer(server, { listen: { port: 4001 } });
console.log(`🚀 Experience subgraph ready at ${url}`);
