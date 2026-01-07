import React from 'react';
import { EmptyState } from '../common';

interface NoNotificationProps {
  onExplore?: () => void;
}

const NoNotification: React.FC<NoNotificationProps> = ({ onExplore }) => {
  return (
    <EmptyState
      icon="bell"
      title="No notifications"
      description="You're all caught up! When you have new notifications about your novels, follows, or comments, they'll appear here."
      actionLabel={onExplore ? "Explore Novels" : undefined}
      onAction={onExplore}
    />
  );
};

export default NoNotification;