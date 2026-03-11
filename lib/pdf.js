import PDFParser from "pdf2json"

export async function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {

    const pdfParser = new PDFParser()

    pdfParser.on("pdfParser_dataError", err => reject(err))

    pdfParser.on("pdfParser_dataReady", pdfData => {

      let text = ""

      pdfData.Pages.forEach(page => {
        page.Texts.forEach(textItem => {
          text += decodeURIComponent(textItem.R[0].T) + " "
        })
      })

      resolve(text)
    })

    pdfParser.parseBuffer(buffer)

  })
}