'use client';

import Shell from '../../../../components/Shell';
import ChatArea from '../../../../components/ChatArea';

import { useRouter } from 'next/navigation';

interface ChatRoomClientProps {
  roomId: string;
}

export default function ChatRoomClient({ roomId }: ChatRoomClientProps) {
  const router = useRouter();
  
  return (
    <Shell>
      <div className="h-full w-full overflow-hidden text-[var(--text-main)]">
        <ChatArea roomId={roomId} onBack={() => router.push('/workspace/chat')} />
      </div>
    </Shell>
  );
}
