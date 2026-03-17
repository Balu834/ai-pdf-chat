export const store = []

export function addToStore(chunk, embedding, file) {

  store.push({
    chunk,
    embedding,
    file
  })

}

export function searchStore(queryEmbedding) {

  // simple demo search
  // later we replace with cosine similarity

  return store.slice(0, 3).map(item => item.chunk)

}