"use client"

import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="text-xl font-bold">Intellixy</div>

        <div className="hidden md:flex gap-8 text-sm text-gray-300">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>

        <div className="flex gap-4">
          <button onClick={() => router.push("/login")} className="text-sm text-gray-300">
            Log in
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 rounded-full text-sm"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl" />

        <h1 className="text-4xl md:text-6xl font-bold leading-tight relative z-10">
          Chat with any{" "}
          <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
            PDF instantly
          </span>
        </h1>

        <p className="mt-6 text-gray-400 max-w-xl mx-auto relative z-10">
          Upload your document and get answers, summaries, and insights in seconds using AI.
        </p>

        <div className="mt-8 flex justify-center gap-4 relative z-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 rounded-full font-medium hover:scale-105 transition"
          >
            Start Free Trial →
          </button>

          <button className="border border-gray-700 px-6 py-3 rounded-full hover:bg-gray-800 transition">
            Watch Demo
          </button>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mt-28 grid md:grid-cols-3 gap-6 px-6 md:px-12">
        {[
          { title: "Smart Q&A", desc: "Ask anything about your PDF" },
          { title: "Instant Insights", desc: "Summaries in seconds" },
          { title: "Secure", desc: "Your files stay private" },
        ].map((f, i) => (
          <div key={i} className="bg-[#111] border border-gray-800 p-6 rounded-2xl hover:scale-105 transition">
            <h3 className="font-semibold text-lg">{f.title}</h3>
            <p className="text-gray-400 text-sm mt-2">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* DEMO VIDEO */}
      <section className="mt-32 text-center px-6">
        <h2 className="text-3xl font-bold">See it in action</h2>

        <div className="mt-8 max-w-3xl mx-auto rounded-2xl overflow-hidden border border-gray-800">
          <iframe
            className="w-full h-[300px] md:h-[450px]"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Demo"
            allowFullScreen
          />
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mt-32 px-6 md:px-12 text-center">
        <h2 className="text-3xl font-bold">Simple Pricing</h2>

        <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          {/* FREE */}
          <div className="border border-gray-800 rounded-2xl p-8">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-gray-400 mt-2">For beginners</p>

            <p className="text-3xl font-bold mt-6">₹0</p>

            <ul className="mt-6 space-y-2 text-gray-400 text-sm">
              <li>✔ 3 PDFs</li>
              <li>✔ Basic Q&A</li>
            </ul>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full border border-gray-700 py-2 rounded-full"
            >
              Start Free
            </button>
          </div>

          {/* PRO */}
          <div className="border border-purple-500 rounded-2xl p-8 bg-gradient-to-b from-purple-900/20">
            <h3 className="text-xl font-semibold">Pro</h3>
            <p className="text-gray-400 mt-2">Best for power users</p>

            <p className="text-3xl font-bold mt-6">₹299/mo</p>

            <ul className="mt-6 space-y-2 text-gray-300 text-sm">
              <li>✔ Unlimited PDFs</li>
              <li>✔ Faster AI</li>
              <li>✔ Priority support</li>
            </ul>

            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-500 py-2 rounded-full"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mt-32 px-6 md:px-12 text-center">
        <h2 className="text-3xl font-bold">Loved by users</h2>

        <div className="grid md:grid-cols-3 gap-6 mt-10">
          {["Amazing tool!", "Saved hours!", "Super useful for study"].map((t, i) => (
            <div key={i} className="border border-gray-800 p-6 rounded-2xl bg-[#111]">
              ⭐⭐⭐⭐⭐
              <p className="text-gray-400 mt-2 text-sm">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-32 text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to chat with your PDFs?
        </h2>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3 rounded-full"
        >
          Get Started Free
        </button>
      </section>

      {/* FOOTER */}
      <footer className="mt-24 text-center text-gray-500 text-sm pb-10">
        © {new Date().getFullYear()} Intellixy. All rights reserved.
      </footer>
    </main>
  )
}