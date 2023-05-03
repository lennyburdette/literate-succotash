import { gql } from "@apollo/client";
import ProductCardDescription, { ProductCardDescriptionFragment } from "./ProductCardDescription";
import ProductCardTitle, { ProductCardTitleFragment } from "./ProductCardTitle";
import ProductCardImage, { ProductCardImageFragment } from "./ProductCardImage";
import ProductCardPrice, { ProductCardPriceFragment } from "./ProductCardPrice";

export const FeaturedProductCardFragment = gql`
  ${ProductCardTitleFragment}
  ${ProductCardDescriptionFragment}
  ${ProductCardImageFragment}
  ${ProductCardPriceFragment}

  fragment FeaturedProductCardFragment on FeaturedProductCard {
    id
    blocks {
      __typename
      ...ProductCardTitleFragment
      ...ProductCardDescriptionFragment
      ...ProductCardImageFragment
      ...ProductCardPriceFragment
    }
  }
`;

export default function FeaturedProductCard({ product }: any) {
  return <div className="border rounded p-4">
    {product.blocks.map((block: any, i: number) => {
      switch (block.__typename) {
        case "ProductCardTitle":
          return <ProductCardTitle key={i} product={block.product} />;
        case "ProductCardDescription":
          return <ProductCardDescription key={i} product={block.product} />;
        case "ProductCardImage":
          return <ProductCardImage key={i} product={block.product} />;
        case "ProductCardPrice":
          return <ProductCardPrice key={i} product={block.product} />;
      }
    })}
  </div>
}
