let documents = []
let files = []

export const vectorStore = {

  addDocuments(chunks, metadata) {

    if (!Array.isArray(chunks)) {
      chunks = [chunks]
    }

    files.push({
      name: metadata.fileName,
      userId: metadata.userId
    })

    chunks.forEach((chunk) => {

      documents.push({
        text: String(chunk),
        metadata
      })

    })

  },

  similaritySearch(query) {

    const q = String(query).toLowerCase()

    return documents
      .filter(doc =>
        String(doc.text).toLowerCase().includes(q)
      )
      .slice(0, 5)

  },

  getAllDocuments() {
    return documents
  },

  getDocuments() {
    return files
  }

}