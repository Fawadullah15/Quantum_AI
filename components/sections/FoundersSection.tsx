import React from 'react';
import styles from './FoundersSection.module.css';

interface FounderData {
  name: string;
  role: string;
  bio: string;
  photo?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
}

interface FoundersSectionProps {
  founders?: FounderData[];
}

const DEFAULT_FOUNDERS: FounderData[] = [
  {
    name: 'Muhammad Murtaza',
    role: 'Co-Founder & CEO',
    bio: '[Placeholder — edit in admin panel]'
  },
  {
    name: 'Fahad Khan',
    role: 'Co-Founder & Executive chairman',
    bio: '[Placeholder — edit in admin panel]'
  }
];

const FoundersSection: React.FC<FoundersSectionProps> = ({ founders = DEFAULT_FOUNDERS }) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.label}>[09 — THE TEAM]</div>
        <h2 className={styles.heading}>BUILT BY ENGINEERS.</h2>
      </div>

      <div className={styles.panels}>
        {founders.map((founder, index) => (
          <div key={index} className={`${styles.panel} ${index === 0 ? styles.panelLeft : styles.panelRight}`}>
            <div className={styles.photoArea}>
              {founder.photo ? (
                <img src={founder.photo} alt={founder.name} className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>
                  {founder.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
            
            <div className={styles.panelContent}>
              <h3 className={styles.name}>{founder.name}</h3>
              <div className={styles.role}>{founder.role}</div>
              <p className={styles.bio}>{founder.bio}</p>
              
              <div className={styles.socials}>
                {founder.linkedin && <a href={founder.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                {founder.twitter && <a href={founder.twitter} target="_blank" rel="noreferrer">Twitter</a>}
                {founder.github && <a href={founder.github} target="_blank" rel="noreferrer">GitHub</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FoundersSection;
