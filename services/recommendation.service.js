/**
 * Recommendation and Scoring Service
 * Computes the transparent "App Comparison Score" (0-100)
 * based strictly on real Google Places data and configurable preference weights.
 */

export const PREFERENCE_WEIGHTS = {
  default: {
    rating: 0.35,
    distance: 0.25,
    reviews: 0.20,
    price: 0.10,
    open: 0.10
  },
  highest_rated: {
    rating: 0.50,
    reviews: 0.20,
    distance: 0.15,
    open: 0.10,
    price: 0.05
  },
  closest: {
    distance: 0.50,
    rating: 0.20,
    reviews: 0.15,
    open: 0.10,
    price: 0.05
  },
  budget_friendly: {
    price: 0.45,
    rating: 0.25,
    distance: 0.15,
    reviews: 0.10,
    open: 0.05
  },
  most_reviewed: {
    reviews: 0.50,
    rating: 0.25,
    distance: 0.15,
    open: 0.05,
    price: 0.05
  },
  currently_open: {
    open: 0.40,
    rating: 0.25,
    distance: 0.20,
    reviews: 0.15,
    price: 0.00
  },
  study: {
    rating: 0.35,
    reviews: 0.25,
    open: 0.20,
    distance: 0.20,
    price: 0.00
  },
  meeting: {
    rating: 0.35,
    reviews: 0.25,
    distance: 0.20,
    open: 0.10,
    price: 0.10
  },
  casual: {
    rating: 0.30,
    distance: 0.30,
    reviews: 0.20,
    price: 0.10,
    open: 0.10
  }
};

/**
 * Calculates scores and explanations for a list of cafes
 * @param {Array<Object>} cafes 
 * @param {string} preference 
 * @returns {Array<Object>} cafes with score breakdown and explanations
 */
export const calculateRecommendations = (cafes, preference = 'default') => {
  if (!cafes || cafes.length === 0) return [];

  const weights = PREFERENCE_WEIGHTS[preference] || PREFERENCE_WEIGHTS.default;

  // Extract min and max values to normalize metrics
  const ratings = cafes.map(c => typeof c.rating === 'number' ? c.rating : 3.0);
  const maxRating = Math.max(...ratings, 5.0);
  const minRating = Math.min(...ratings, 1.0);

  const reviews = cafes.map(c => typeof c.user_ratings_total === 'number' ? c.user_ratings_total : 0);
  const maxReviews = Math.max(...reviews, 1);
  const minReviews = Math.min(...reviews, 0);

  const distances = cafes
    .filter(c => c.distance && typeof c.distance.km === 'number')
    .map(c => c.distance.km);
  const maxDistance = distances.length > 0 ? Math.max(...distances, 5) : 5;
  const minDistance = distances.length > 0 ? Math.min(...distances, 0.1) : 0.1;

  const scoredCafes = cafes.map(cafe => {
    // 1. Rating component (0 - 100)
    const normalizedRating = typeof cafe.rating === 'number'
      ? (cafe.rating / 5.0) * 100
      : 60; // neutral default if unrated

    // 2. Reviews count component (logarithmic scale so 1000 vs 5000 is balanced)
    const reviewCount = cafe.user_ratings_total || 0;
    const normalizedReviews = reviewCount > 0
      ? Math.min(100, (Math.log10(reviewCount + 1) / Math.log10(Math.max(maxReviews, 10) + 1)) * 100)
      : 20;

    // 3. Distance component (closer = higher score, 0 - 100)
    let normalizedDistance = 50;
    if (cafe.distance && typeof cafe.distance.km === 'number') {
      if (maxDistance === minDistance) {
        normalizedDistance = 100;
      } else {
        const distFactor = (maxDistance - cafe.distance.km) / (maxDistance - minDistance);
        normalizedDistance = Math.max(0, Math.min(100, distFactor * 100));
      }
    }

    // 4. Price level component (lower price = higher budget score)
    // 1 ($) -> 100, 2 ($$) -> 75, 3 ($$$) -> 50, 4 ($$$$) -> 25
    let normalizedPrice = 60; // neutral if unlisted
    if (typeof cafe.price_level === 'number') {
      if (cafe.price_level === 1) normalizedPrice = 100;
      else if (cafe.price_level === 2) normalizedPrice = 75;
      else if (cafe.price_level === 3) normalizedPrice = 50;
      else if (cafe.price_level >= 4) normalizedPrice = 25;
    }

    // 5. Open status component
    let normalizedOpen = 50; // unknown
    if (cafe.open_now === true) normalizedOpen = 100;
    else if (cafe.open_now === false) normalizedOpen = 10;

    // Aggregate weighted score
    const totalScore = Math.round(
      normalizedRating * weights.rating +
      normalizedReviews * weights.reviews +
      normalizedDistance * weights.distance +
      normalizedPrice * weights.price +
      normalizedOpen * weights.open
    );

    // Build transparent explanation reasons
    const reasons = [];
    if (cafe.rating && cafe.rating >= 4.3) {
      reasons.push(`High customer satisfaction (${cafe.rating.toFixed(1)}/5 Google rating)`);
    }
    if (cafe.distance && cafe.distance.km !== null && cafe.distance.km <= 2.0) {
      reasons.push(`Convenient distance (${cafe.distance.text} away)`);
    }
    if (cafe.open_now === true) {
      reasons.push('Currently open for service');
    }
    if (cafe.price_level === 1) {
      reasons.push('Budget-friendly Google price tier ($)');
    }
    if (cafe.user_ratings_total && cafe.user_ratings_total >= 300) {
      reasons.push(`High community validation (${cafe.user_ratings_total.toLocaleString()} total reviews)`);
    }

    // Preference-specific emphasis explanation
    let preferenceExplanation = '';
    if (preference === 'closest') {
      preferenceExplanation = 'Distance was given 50% importance weighting because you selected "Closest".';
    } else if (preference === 'highest_rated') {
      preferenceExplanation = 'Rating was given 50% importance weighting because you selected "Highest Rated".';
    } else if (preference === 'budget_friendly') {
      preferenceExplanation = 'Affordability was given 45% importance weighting because you selected "Budget Friendly".';
    } else if (preference === 'most_reviewed') {
      preferenceExplanation = 'Review count volume was given 50% importance weighting because you selected "Most Reviewed".';
    } else if (preference === 'currently_open') {
      preferenceExplanation = 'Real-time open status was given 40% importance weighting because you selected "Currently Open".';
    } else if (['study', 'meeting', 'casual'].includes(preference)) {
      preferenceExplanation = `Scored considering rating, verified open hours, and established review presence for a reliable ${preference} experience (no unverified claims are assumed).`;
    } else {
      preferenceExplanation = 'Balanced composite score based on rating, distance, reviews, price, and operating hours.';
    }

    return {
      ...cafe,
      app_comparison_score: totalScore,
      score_breakdown: {
        total: totalScore,
        weights,
        components: {
          rating: Math.round(normalizedRating),
          reviews: Math.round(normalizedReviews),
          distance: Math.round(normalizedDistance),
          price: Math.round(normalizedPrice),
          open_status: Math.round(normalizedOpen)
        }
      },
      match_reasons: reasons,
      preference_explanation: preferenceExplanation
    };
  });

  // Sort descending by App Comparison Score
  return scoredCafes.sort((a, b) => b.app_comparison_score - a.app_comparison_score);
};
