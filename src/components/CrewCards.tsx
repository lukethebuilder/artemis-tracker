interface CrewMember {
  name: string
  initials: string
  role: string
  agency: string
  agencyColor: string
}

const CREW: CrewMember[] = [
  {
    name: 'Reid Wiseman',
    initials: 'RW',
    role: 'Commander',
    agency: 'NASA',
    agencyColor: '#e63946',
  },
  {
    name: 'Victor Glover',
    initials: 'VG',
    role: 'Pilot',
    agency: 'NASA',
    agencyColor: '#e63946',
  },
  {
    name: 'Christina Koch',
    initials: 'CK',
    role: 'Mission Specialist 1',
    agency: 'NASA',
    agencyColor: '#e63946',
  },
  {
    name: 'Jeremy Hansen',
    initials: 'JH',
    role: 'Mission Specialist 2',
    agency: 'CSA',
    agencyColor: '#d62828',
  },
]

export default function CrewCards() {
  return (
    <div>
      <h2
        style={{
          fontSize: 11,
          color: '#666',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 500,
          margin: '0 0 20px',
        }}
      >
        Crew
      </h2>
      <div
        className="crew-grid"
        style={{
          display: 'grid',
          gap: 16,
        }}
      >
        {CREW.map((member) => (
          <div
            key={member.name}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(94,207,207,0.1)',
                border: '1.5px solid rgba(94,207,207,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: '#5ECFCF',
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              {member.initials}
            </div>

            {/* Name & role */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e8e8e8',
                  letterSpacing: '0.01em',
                  marginBottom: 4,
                }}
              >
                {member.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#666',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {member.role}
              </div>

              {/* Agency badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: `${member.agencyColor}22`,
                  border: `1px solid ${member.agencyColor}55`,
                  borderRadius: 4,
                  padding: '2px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: member.agencyColor,
                    textTransform: 'uppercase',
                  }}
                >
                  {member.agency}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
