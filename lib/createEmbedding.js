// lib/createEmbedding.js

export async function createEmbedding(text) {

  // TEMPORARY MOCK EMBEDDING
  // This creates a fake vector so the app works
  // without OpenAI billing

  const vectorLength = 1536

  const vector = []

  for (let i = 0; i < vectorLength; i++) {
    vector.push(Math.random())
  }

  return vector

}