import { gql } from "@apollo/client";

export const ProductCardTitleFragment = gql`
  fragment ProductCardTitleFragment on ProductCardTitle {
    product {
      id
      name
    }
  }
`;

export default function ProductCardTitle(props: any) {
  return <div>Title: {props.product.name}</div>;
}
