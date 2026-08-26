import { FolderDetailPage } from '@/features/library';

export default async function Page({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  return <FolderDetailPage folderId={folderId} />;
}
