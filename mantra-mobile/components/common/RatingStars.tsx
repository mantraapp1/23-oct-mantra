import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors } from '../../constants';

interface RatingStarsProps {
    rating: number;
    size?: number;
    color?: string;
}

const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    size = 16,
    color = '#fbbf24', // Gold color
}) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <View style={styles.container}>
            {/* Full stars - FILLED with solid star */}
            {Array.from({ length: fullStars }).map((_, index) => (
                <FontAwesome
                    key={`full-${index}`}
                    name="star"
                    size={size}
                    color={color}
                />
            ))}

            {/* Half star */}
            {hasHalfStar && (
                <FontAwesome
                    name="star-half-full"
                    size={size}
                    color={color}
                />
            )}

            {/* Empty stars - outline */}
            {Array.from({ length: emptyStars }).map((_, index) => (
                <FontAwesome
                    key={`empty-${index}`}
                    name="star-o"
                    size={size}
                    color={color}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    starWrapper: {
        // Wrapper for consistent spacing
    },
});

export default RatingStars;
