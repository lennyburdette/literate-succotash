import { gql, useQuery } from "@apollo/client";
import ProductCategoryCollection, { ProductCategoryCollectionFragment } from "./ProductCategoryCollection";

const HOME_PAGE = gql`
  ${ProductCategoryCollectionFragment}

  query HomePage {
    page(url: "/") {
      __typename
      ... ProductCategoryCollectionFragment
    }
  }
`;

export default function HomePage() {
  const { data, loading } = useQuery(HOME_PAGE);

  if (loading) return <p>loading...</p>

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl">Home Page</h1>
      {data.page.map((block: any, i: number) => {
        switch (block.__typename) {
          case 'ProductCategoryCollection':
            return <ProductCategoryCollection key={i} collection={block} />
        }
      })}
    </div>
  )
}
