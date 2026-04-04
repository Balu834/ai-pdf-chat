export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      
      <h1 className="text-4xl font-bold text-center mb-4">
        Chat with any PDF instantly 📄
      </h1>

      <p className="text-gray-600 text-center max-w-xl mb-6">
        Upload your PDF, ask questions, and get answers in seconds.
      </p>

      <a
        href="/login"
        className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition"
      >
        Try it Free →
      </a>

    </main>
  );
}