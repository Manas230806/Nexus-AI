import ChatRoomClient from './ChatRoomClient';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params;
  return <ChatRoomClient roomId={roomId} />;
}
