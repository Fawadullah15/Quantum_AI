import CaseStudyPage, { generateMetadata as baseGenerateMetadata } from '../../work/[slug]/page';

export const revalidate = 120;
export const generateMetadata = baseGenerateMetadata;
export default CaseStudyPage;
