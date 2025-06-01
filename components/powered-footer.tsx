export default function PoweredFooter() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-6 bg-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-8 flex-wrap mb-4">
        <div className="flex items-center">
          <span className="text-sm text-white/80 mr-3 font-medium">Powered by</span>
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-removebg-preview%20%286%29-fAIg0G7ACpzx11sJB144JTEp7Cvf67.png"
              alt="Yellow"
              className="h-8 w-auto" // Increased from h-6 to h-8
            />
          </div>
        </div>

        <div className="flex items-center">
          <span className="text-sm text-white/80 mr-3 font-medium">Trade on</span>
          <div className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-removebg-preview%20%285%29-nzNTkmmTJ7Zfocb9Jvn5EyGNmupvwN.png"
              alt="Flow"
              className="h-6 w-auto mr-2"
            />
            <span className="text-white/80 text-sm font-medium">& more chains!</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-white/70 font-medium">
          Real-time prices powered by{" "}
          <a
            href="https://www.geckoterminal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/90 hover:text-white underline font-semibold"
          >
            GeckoTerminal API
          </a>
        </p>
      </div>
    </div>
  )
}
