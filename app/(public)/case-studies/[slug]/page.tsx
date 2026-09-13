import CaseStudyPage, { generateMetadata as baseGenerateMetadata, generateStaticParams as baseGenerateStaticParams } from '../../work/[slug]/page';

export const revalidate = 120;
export const dynamicParams = true;
export const generateMetadata = baseGenerateMetadata;
export const generateStaticParams = baseGenerateStaticParams;
export default CaseStudyPage;
