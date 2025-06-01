export default function PoweredFooter() {
  return (
    <div className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 py-8 px-6">
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          {/* Top section with logos */}
          <div className="flex items-center justify-center gap-12 flex-wrap mb-6">
            {/* Powered by Yellow */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <span className="text-sm text-white/90 mr-3 font-semibold">Powered by</span>
              <div className="flex items-center">
                <img src="/yellow-logo-new.png" alt="Yellow" className="h-12 w-auto" />
              </div>
            </div>

            {/* Trade on Flow */}
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <span className="text-sm text-white/90 mr-3 font-semibold">Trade on</span>
              <div className="flex items-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-removebg-preview%20%285%29-nzNTkmmTJ7Zfocb9Jvn5EyGNmupvwN.png"
                  alt="Flow"
                  className="h-7 w-auto mr-2 filter brightness-110"
                />
                <span className="text-white/90 text-sm font-semibold">& more chains!</span>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="text-center">
            <div className="inline-flex items-center bg-white/15 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg">
              <svg className="w-4 h-4 text-white/80 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-white/90 font-medium">
                Real-time prices powered by{" "}
                <a
                  href="https://www.geckoterminal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-yellow-100 underline font-bold transition-colors duration-200"
                >
                  GeckoTerminal API
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
