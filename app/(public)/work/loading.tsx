export default function WorkLoading() {
  return (
    <div className="relative min-h-screen bg-[#030712] text-white pt-40 lg:pt-56 pb-24 px-8 lg:px-12 max-w-[1500px] mx-auto animate-pulse flex flex-col gap-12">
      <div className="w-48 h-4 bg-white/5 rounded" />
      <div className="w-full max-w-3xl h-24 lg:h-48 bg-white/5 rounded-2xl" />
      <div className="w-full max-w-xl h-8 bg-white/5 rounded" />
      
      <div className="flex gap-4 mt-12 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-32 h-10 bg-white/5 rounded-full flex-shrink-0" />
        ))}
      </div>

      <div className="w-full aspect-[16/10] bg-white/5 rounded-xl mt-12" />
    </div>
  );
}
