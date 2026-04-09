export default function PagamentosBar() {
  return (
    <div className="bg-white border-t border-gray-100 py-5 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
        <span className="text-xs text-gray-500 font-medium mr-1">Pagamento seguro:</span>

        {/* PIX */}
        <span className="inline-flex items-center gap-1.5 bg-[#32BCAD] text-white text-xs font-bold px-3 py-1.5 rounded-md">
          <svg viewBox="0 0 64 64" width="16" height="16" fill="none" aria-hidden="true">
            <path
              d="M44.7 19.3c-2.2 0-4.3.9-5.9 2.4L30 30.4a2.5 2.5 0 0 1-3.5 0l-8.8-8.8a8.3 8.3 0 0 0-5.9-2.4H9l11.8 11.8a9.7 9.7 0 0 0 13.7 0L46.3 19.3h-1.6zM11.8 44.7c2.2 0 4.3-.9 5.9-2.4L26.5 34a2.5 2.5 0 0 1 3.5 0l8.8 8.8c1.6 1.6 3.7 2.4 5.9 2.4h1.6L34.5 33.4a9.7 9.7 0 0 0-13.7 0L9 44.7h2.8z"
              fill="white"
            />
          </svg>
          PIX
        </span>

        {/* Visa */}
        <span className="inline-flex items-center justify-center bg-[#1A1F71] text-white text-xs font-black italic px-3 py-1.5 rounded-md tracking-wide w-14">
          VISA
        </span>

        {/* Mastercard */}
        <span className="inline-flex items-center justify-center px-2 py-1.5 rounded-md bg-white border border-gray-200">
          <svg width="36" height="22" viewBox="0 0 36 22" fill="none" aria-label="Mastercard">
            <circle cx="13" cy="11" r="11" fill="#EB001B" />
            <circle cx="23" cy="11" r="11" fill="#F79E1B" />
            <path d="M18 4.2a11 11 0 0 1 0 13.6A11 11 0 0 1 18 4.2z" fill="#FF5F00" />
          </svg>
        </span>

        {/* Débito */}
        <span className="inline-flex items-center gap-1.5 bg-[#2196F3] text-white text-xs font-bold px-2.5 py-1.5 rounded-md">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="white" strokeWidth="2"/>
            <path d="M2 10h20" stroke="white" strokeWidth="2"/>
          </svg>
          Débito
        </span>

        {/* Boleto */}
        <span className="inline-flex items-center gap-1 bg-gray-600 text-white text-xs font-bold px-3 py-1.5 rounded-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="2" height="16" fill="white"/>
            <rect x="7" y="4" width="1" height="16" fill="white"/>
            <rect x="10" y="4" width="3" height="16" fill="white"/>
            <rect x="15" y="4" width="1" height="16" fill="white"/>
            <rect x="18" y="4" width="3" height="16" fill="white"/>
          </svg>
          Boleto
        </span>

        {/* Elo */}
        <span className="inline-flex items-center justify-center bg-[#FFD100] text-black text-xs font-black px-3 py-1.5 rounded-md tracking-wide w-12">
          elo
        </span>

        {/* Parcelas */}
        <span className="text-xs text-gray-400 font-medium ml-1 hidden sm:inline">
          Parcele em até <strong className="text-gray-600">6x sem juros</strong>
        </span>
      </div>
    </div>
  )
}
