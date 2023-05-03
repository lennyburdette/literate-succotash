import { gql } from "@apollo/client";

export const ProductCardImageFragment = gql`
  fragment ProductCardImageFragment on ProductCardImage {
    product {
      id
      imageUrl
    }
  }
`;

export default function ProductCardImage(props: any) {
  return <div>Image: {props.product.imageUrl}</div>;
}
