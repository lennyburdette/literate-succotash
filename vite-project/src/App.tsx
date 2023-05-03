import './App.css'
import HomePage from './HomePage'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

const possibleTypes = await fetch("http://localhost:3000/", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: {},
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
}).then(result => result.json())
  .then(result => {
    const possibleTypes: Record<string, any> = {};

    result.data.__schema.types.forEach((supertype: any) => {
      if (supertype.possibleTypes) {
        possibleTypes[supertype.name] =
          supertype.possibleTypes.map((subtype: any) => subtype.name);
      }
    });

    return possibleTypes;
  });

const client = new ApolloClient({
  uri: "http://localhost:3000/",
  cache: new InMemoryCache({
    possibleTypes
  }),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <HomePage />
    </ApolloProvider>
  )
}

export default App
