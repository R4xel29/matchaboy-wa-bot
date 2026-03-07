import { prisma } from '@/lib/prisma';
import HeroBannersClient from './HeroBannersClient';

export const revalidate = 0;

export default async function AdminBannersPage() {
  const banners = await prisma.heroBanner.findMany({
    orderBy: { order: 'asc' },
  });

  return <HeroBannersClient initialBanners={banners} />;
}
