'use client';

import Shell from '../../../../components/Shell';
import ChatArea from '../../../../components/ChatArea';

interface ChatRoomClientProps {
  roomId: string;
}

export default function ChatRoomClient({ roomId }: ChatRoomClientProps) {
  return (
    <Shell>
      <div className="h-full w-full p-2 sm:p-4 lg:p-8 overflow-hidden text-[var(--text-main)]">
        <ChatArea roomId={roomId} />
      </div>
    </Shell>
  );
}
