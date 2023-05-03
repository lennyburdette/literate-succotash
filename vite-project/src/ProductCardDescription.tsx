import { gql } from "@apollo/client";

export const ProductCardDescriptionFragment = gql`
  fragment ProductCardDescriptionFragment on ProductCardDescription {
    product {
      id
      description
    }
  }
`;

export default function ProductCardDescription(props: any) {
  return <div>Description: {props.product.description}</div>;
}
