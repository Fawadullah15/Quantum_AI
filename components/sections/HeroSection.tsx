'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

const HeroSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.container}>
        <div className={`${styles.eyebrow} ${mounted ? styles.fadeInTop : ''}`}>
          [01 — SYSTEM INITIALIZATION]
        </div>
        
        <div className={styles.content}>
          <h1 className={`${styles.headline} ${mounted ? styles.fadeInTitle : ''}`}>
            WE BUILD<br />
            INTELLIGENT<br />
            SOFTWARES
          </h1>
          
          <p className={`${styles.description} ${mounted ? styles.fadeInDesc : ''}`}>
            AI systems, software products, and intelligent infrastructure for real problems.
          </p>
          
          <div className={`${styles.actions} ${mounted ? styles.fadeInActions : ''}`}>
            <Link href="/work" className={styles.primaryBtn}>
              Explore Our Work
            </Link>
            <Link href="/contact" className={styles.secondaryBtn}>
              Start a Project
            </Link>
          </div>
        </div>

        <div className={`${styles.scrollIndicator} ${mounted ? styles.fadeInBottom : ''}`}>
          <span>[ SCROLL TO EXPLORE ]</span>
          <div className={styles.arrow}>↓</div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
