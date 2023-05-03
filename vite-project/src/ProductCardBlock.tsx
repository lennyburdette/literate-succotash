import { gql } from "@apollo/client";
import ProductCardDescription, { ProductCardDescriptionFragment } from "./ProductCardDescription";
import ProductCardTitle, { ProductCardTitleFragment } from "./ProductCardTitle";
import ProductCardImage, { ProductCardImageFragment } from "./ProductCardImage";
import ProductCardPrice, { ProductCardPriceFragment } from "./ProductCardPrice";
import FeaturedProductCard from "./FeaturedProductCard";

export const ProductCardBlockFragment = gql`
  ${ProductCardTitleFragment}
  ${ProductCardDescriptionFragment}
  ${ProductCardImageFragment}
  ${ProductCardPriceFragment}

  fragment ProductCardBlockFragment on ProductCardBlock {
    ...ProductCardTitleFragment
    ...ProductCardDescriptionFragment
    ...ProductCardImageFragment
    ...ProductCardPriceFragment
  }
`;

export default function ProductCardBlock({ products }: any) {
  return <>
    {products.edges.map(({ node }: any, i: number) => {
      switch (node.__typename) {
        case "FeaturedProductCard": {
          return <FeaturedProductCard key={i} product={node} />;
        }
      }
    })}
  </>
}
