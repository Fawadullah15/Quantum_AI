'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './ProcessSection.module.css';

const DEFAULT_STAGES = [
  { id: '01', title: 'UNDERSTAND', desc: 'Deep dive into requirements and business context.' },
  { id: '02', title: 'DESIGN', desc: 'System architecture and product design.' },
  { id: '03', title: 'BUILD', desc: 'Engineering the core software and AI components.' },
  { id: '04', title: 'TEST', desc: 'Rigorous validation of intelligence and code.' },
  { id: '05', title: 'DEPLOY', desc: 'Seamless transition to production.' },
  { id: '06', title: 'IMPROVE', desc: 'Continuous monitoring and refinement.' }
];

const ProcessSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.label}>[08 — HOW WE WORK]</div>
          <h2 className={styles.heading}>A PRECISE PROCESS.</h2>
        </div>

        <div className={styles.processWrapper}>
          <div className={`${styles.line} ${isVisible ? styles.lineDrawn : ''}`}></div>
          <div className={styles.stages}>
            {DEFAULT_STAGES.map((stage, index) => (
              <div 
                key={stage.id} 
                className={`${styles.stage} ${isVisible ? styles.stageVisible : ''}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className={styles.stageNumber}>{stage.id}</div>
                <div className={styles.stageContent}>
                  <h3 className={styles.stageTitle}>{stage.title}</h3>
                  <p className={styles.stageDesc}>{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
