const AVATARS = [
  'https://public-frontend-cos.metadl.com/nuxt-mgx/prod/assets/Mike-TeamLeader-Avatar_origin.DmBYWaXT.webp',
  'https://public-frontend-cos.metadl.com/nuxt-mgx/prod/assets/Emma-ProductManager-Avatar_origin.BBeqkRr7.webp',
  'https://public-frontend-cos.metadl.com/nuxt-mgx/prod/assets/Bob-Architect-Avatar_origin.Cdi-oMPW.webp',
  'https://public-frontend-cos.metadl.com/nuxt-mgx/prod/assets/Alex-Engineer-Avatar_origin.zHMG8gqX.webp',
  'https://public-frontend-cos.metadl.com/nuxt-mgx/prod/assets/David-DataAnalyst-Avatar_origin.CahzHabe.webp',
]

export function AvatarRow() {
  return (
    <div className="flex items-center mb-3">
      {AVATARS.map((src, i) => (
        <div
          key={i}
          className="relative w-10 h-10 rounded-full border-2 border-[#f4f4f4] overflow-hidden flex-shrink-0"
          style={{ marginLeft: i === 0 ? 0 : '-8px', zIndex: AVATARS.length - i }}
        >
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  )
}
