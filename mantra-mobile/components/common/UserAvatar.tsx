import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, typography } from '../../constants';

export interface UserAvatarProps {
  uri?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  uri, 
  name = 'U',
  size = 'medium' 
}) => {
  const dimensions = {
    small: 32,
    medium: 40,
    large: 64,
  };
  
  const fontSize = {
    small: 14,
    medium: 16,
    large: 24,
  };
  
  const avatarSize = dimensions[size];
  const textSize = fontSize[size];
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[styles.image, { width: avatarSize, height: avatarSize }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: avatarSize, height: avatarSize }]}>
          <Text style={[styles.placeholderText, { fontSize: textSize }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.sky100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.sky700,
  },
});

export default UserAvatar;
