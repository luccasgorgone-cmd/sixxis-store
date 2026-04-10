export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-[#3cbfb3]/30 border-t-[#3cbfb3] animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm text-gray-400 font-medium">Carregando...</p>
      </div>
    </div>
  )
}
