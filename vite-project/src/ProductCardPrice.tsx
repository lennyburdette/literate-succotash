import { gql } from "@apollo/client";

export const ProductCardPriceFragment = gql`
  fragment ProductCardPriceFragment on ProductCardPrice {
    product {
      id
      price {
        value
        currency
      }
    }
  }
`;

export default function ProductCardPrice(props: any) {
  return <div>Price: {props.product.price.value}</div>;
}
