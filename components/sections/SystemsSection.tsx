'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './SystemsSection.module.css';

interface SystemsSectionProps {
  systems?: string[];
}

const DEFAULT_SYSTEMS = [
  'AI Systems', 'AI Agents', 'Machine Learning', 'Computer Vision', 
  'RAG Systems', 'AI Automation', 'AI Infrastructure', 'Custom Software', 
  'Web Applications', 'Business Automation', 'SaaS Products', 'Digital Products'
];

const SystemsSection: React.FC<SystemsSectionProps> = ({ systems = DEFAULT_SYSTEMS }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.leftCol}>
          <div className={styles.label}>[03 — SYSTEMS EMERGE]</div>
          <div className={styles.headingWrapper}>
            <h2 className={`${styles.heading} ${isVisible ? styles.visible : ''}`}>
              ONE INTELLIGENCE CORE.<br/>
              MANY SYSTEMS.
            </h2>
            <p className={`${styles.description} ${isVisible ? styles.visible : ''}`}>
              We apply the right system for each problem. From raw AI research to production software.
            </p>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.grid}>
            {systems.map((system, index) => (
              <div 
                key={system} 
                className={`${styles.chip} ${isVisible ? styles.visible : ''}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <span className={styles.chipNumber}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {system}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemsSection;
