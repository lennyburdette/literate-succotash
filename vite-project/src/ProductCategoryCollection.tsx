import { gql } from "@apollo/client";
import FeaturedProductCard, { FeaturedProductCardFragment } from "./FeaturedProductCard";

export const ProductCategoryCollectionFragment = gql`
  ${FeaturedProductCardFragment}

  fragment ProductCategoryCollectionFragment on ProductCategoryCollection {
    categoryId
    products {
      edges {
        node {
          ...FeaturedProductCardFragment
        }
      }
    }
  }
`;

export default function ProductCategoryCollection({ collection }: any) {
  return <div className="border rounded p-4">
    <h2>Product category collection</h2>
    <div className="flex gap-4">
    {collection.products.edges.map(({ node }: any, i: number) => {
      switch (node.__typename) {
        case "FeaturedProductCard": {
          return <FeaturedProductCard key={i} product={node} />;
        }
      }
    })}
    </div>
  </div>;
}
