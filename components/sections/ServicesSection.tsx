'use client';

import React from 'react';
import styles from './ServicesSection.module.css';

interface ServiceItem {
  name: string;
  description: string;
  category: 'AI' | 'SOFTWARE' | 'PRODUCT';
}

interface ServicesSectionProps {
  services?: ServiceItem[];
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { name: 'AI Systems', description: 'End-to-end artificial intelligence systems integrated into your business.', category: 'AI' },
  { name: 'AI Agents', description: 'Autonomous agents capable of complex reasoning and execution.', category: 'AI' },
  { name: 'Machine Learning', description: 'Custom models trained on your proprietary data.', category: 'AI' },
  { name: 'Computer Vision', description: 'Visual intelligence for automated inspection and tracking.', category: 'AI' },
  { name: 'RAG Systems', description: 'Retrieval-Augmented Generation over large knowledge bases.', category: 'AI' },
  { name: 'AI Automation', description: 'Intelligent workflows replacing manual operations.', category: 'AI' },
  { name: 'AI Infrastructure', description: 'Scalable deployment pipelines for AI models.', category: 'AI' },
  { name: 'Custom Business Software', description: 'Tailor-made software addressing specific operational needs.', category: 'SOFTWARE' },
  { name: 'Web Applications', description: 'High-performance web apps built on modern stacks.', category: 'SOFTWARE' },
  { name: 'Internal Business Platforms', description: 'Unified dashboards for company-wide operations.', category: 'SOFTWARE' },
  { name: 'Business Automation', description: 'Connecting APIs and software to streamline work.', category: 'SOFTWARE' },
  { name: 'SaaS Products', description: 'Scalable software-as-a-service application development.', category: 'PRODUCT' },
  { name: 'Custom Digital Products', description: 'User-centric product design and engineering.', category: 'PRODUCT' },
];

const ServicesSection: React.FC<ServicesSectionProps> = ({ services = DEFAULT_SERVICES }) => {
  const aiServices = services.filter(s => s.category === 'AI');
  const softwareServices = services.filter(s => s.category !== 'AI');

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.label}>[04 — CAPABILITIES]</div>
          <h2 className={styles.heading}>
            WE BUILD.<br />
            WE DEPLOY.<br />
            WE MAINTAIN.
          </h2>
          <p className={styles.subheading}>
            A business can come to us with an idea or problem. We design, build, deploy, and maintain the complete system.
          </p>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>AI & INTELLIGENCE</h3>
            <div className={styles.serviceList}>
              {aiServices.map((service, i) => (
                <div key={i} className={`${styles.serviceItem} ${styles.aiItem}`}>
                  <div className={styles.serviceLine}></div>
                  <div className={styles.serviceContent}>
                    <h4 className={styles.serviceName}>{service.name}</h4>
                    <p className={styles.serviceDesc}>{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>SOFTWARE & PRODUCTS</h3>
            <div className={styles.serviceList}>
              {softwareServices.map((service, i) => (
                <div key={i} className={`${styles.serviceItem} ${styles.softwareItem}`}>
                  <div className={styles.serviceLine}></div>
                  <div className={styles.serviceContent}>
                    <h4 className={styles.serviceName}>{service.name}</h4>
                    <p className={styles.serviceDesc}>{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
