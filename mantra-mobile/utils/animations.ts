/**
 * Animation Utilities
 * Reusable animation presets for consistent, smooth animations
 */

import { Animated, Easing } from 'react-native';

// Animation timing presets
export const AnimationTiming = {
    /** Very fast - for micro-interactions (100ms) */
    instant: 100,
    /** Fast - for small UI changes (200ms) */
    fast: 200,
    /** Normal - for most animations (300ms) */
    normal: 300,
    /** Slow - for emphasis (500ms) */
    slow: 500,
    /** Very slow - for major transitions (800ms) */
    verySlow: 800,
};

// Easing presets that match iOS/Android native feel
export const AnimationEasing = {
    /** Standard easing - for most animations */
    standard: Easing.bezier(0.4, 0.0, 0.2, 1),
    /** Decelerate - for entering elements */
    decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
    /** Accelerate - for exiting elements */
    accelerate: Easing.bezier(0.4, 0.0, 1, 1),
    /** Sharp - for elements that may return */
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
    /** Bounce - for playful animations */
    bounce: Easing.bounce,
    /** Elastic - for spring-like effects */
    elastic: Easing.elastic(1),
};

/**
 * Create a fade animation
 */
export const createFadeAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationTiming.normal,
    easing: (value: number) => number = AnimationEasing.standard
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
    });
};

/**
 * Create a slide animation
 */
export const createSlideAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationTiming.normal,
    easing: (value: number) => number = AnimationEasing.decelerate
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
    });
};

/**
 * Create a scale animation
 */
export const createScaleAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationTiming.fast,
    easing: (value: number) => number = AnimationEasing.standard
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
    });
};

/**
 * Create a spring animation (more natural feel)
 */
export const createSpringAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<Animated.SpringAnimationConfig> = {}
): Animated.CompositeAnimation => {
    return Animated.spring(animatedValue, {
        toValue,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
        ...config,
    });
};

/**
 * Create a pulse animation (scale up and down)
 */
export const createPulseAnimation = (
    animatedValue: Animated.Value,
    scale: number = 1.1,
    duration: number = AnimationTiming.fast
): Animated.CompositeAnimation => {
    return Animated.sequence([
        Animated.timing(animatedValue, {
            toValue: scale,
            duration: duration / 2,
            easing: AnimationEasing.standard,
            useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration / 2,
            easing: AnimationEasing.standard,
            useNativeDriver: true,
        }),
    ]);
};

/**
 * Create a shake animation (for errors)
 */
export const createShakeAnimation = (
    animatedValue: Animated.Value,
    intensity: number = 10
): Animated.CompositeAnimation => {
    return Animated.sequence([
        Animated.timing(animatedValue, { toValue: intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: intensity / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: -intensity / 2, duration: 50, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);
};

/**
 * Create staggered animations for lists
 */
export const createStaggeredAnimation = (
    animatedValues: Animated.Value[],
    toValue: number,
    staggerDelay: number = 50,
    duration: number = AnimationTiming.normal
): Animated.CompositeAnimation => {
    return Animated.stagger(
        staggerDelay,
        animatedValues.map(value =>
            Animated.timing(value, {
                toValue,
                duration,
                easing: AnimationEasing.decelerate,
                useNativeDriver: true,
            })
        )
    );
};

/**
 * Create a loop animation
 */
export const createLoopAnimation = (
    animation: Animated.CompositeAnimation,
    iterations: number = -1
): Animated.CompositeAnimation => {
    return Animated.loop(animation, { iterations });
};

/**
 * Skeleton loading animation value (0 -> 1 -> 0 loop)
 */
export const createSkeletonAnimation = (
    animatedValue: Animated.Value
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ])
    );
};

export default {
    Timing: AnimationTiming,
    Easing: AnimationEasing,
    fade: createFadeAnimation,
    slide: createSlideAnimation,
    scale: createScaleAnimation,
    spring: createSpringAnimation,
    pulse: createPulseAnimation,
    shake: createShakeAnimation,
    stagger: createStaggeredAnimation,
    loop: createLoopAnimation,
    skeleton: createSkeletonAnimation,
};
