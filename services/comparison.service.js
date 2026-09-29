/**
 * Generates purely factual comparison insights between 2 or more cafes
 * based strictly on real available Google Places data.
 * Does NOT invent unsupported claims, noise levels, wifi, or fake features.
 * 
 * @param {Array<Object>} cafes - Array of normalized cafe objects
 * @returns {Array<string>} list of factual bullet points
 */
export const generateFactualSummary = (cafes) => {
  if (!cafes || cafes.length < 2) {
    return ['Select at least 2 cafes to generate a side-by-side comparison summary.'];
  }

  const summaries = [];

  // 1. Rating comparison
  const cafesWithRating = cafes.filter(c => typeof c.rating === 'number');
  if (cafesWithRating.length >= 2) {
    const sortedByRating = [...cafesWithRating].sort((a, b) => b.rating - a.rating);
    const topRated = sortedByRating[0];
    const secondRated = sortedByRating[1];

    if (topRated.rating > secondRated.rating) {
      summaries.push(
        `⭐ ${topRated.name} has the highest rating (${topRated.rating.toFixed(1)} / 5.0) compared to ${secondRated.name} (${secondRated.rating.toFixed(1)} / 5.0).`
      );
    } else {
      summaries.push(
        `⭐ ${topRated.name} and ${secondRated.name} share the highest rating of ${topRated.rating.toFixed(1)} / 5.0.`
      );
    }
  }

  // 2. Reviews count comparison
  const cafesWithReviews = cafes.filter(c => typeof c.user_ratings_total === 'number');
  if (cafesWithReviews.length >= 2) {
    const sortedByReviews = [...cafesWithReviews].sort((a, b) => b.user_ratings_total - a.user_ratings_total);
    const mostReviewed = sortedByReviews[0];
    const leastReviewed = sortedByReviews[sortedByReviews.length - 1];

    if (mostReviewed.user_ratings_total > leastReviewed.user_ratings_total) {
      summaries.push(
        `👥 ${mostReviewed.name} has the largest customer review volume with ${mostReviewed.user_ratings_total.toLocaleString()} Google reviews (vs ${leastReviewed.name} with ${leastReviewed.user_ratings_total.toLocaleString()}).`
      );
    }
  }

  // 3. Distance comparison
  const cafesWithDistance = cafes.filter(c => c.distance && typeof c.distance.km === 'number');
  if (cafesWithDistance.length >= 2) {
    const sortedByDistance = [...cafesWithDistance].sort((a, b) => a.distance.km - b.distance.km);
    const closest = sortedByDistance[0];
    const farthest = sortedByDistance[sortedByDistance.length - 1];

    if (closest.distance.km < farthest.distance.km) {
      summaries.push(
        `📍 ${closest.name} is the closest cafe (${closest.distance.text} away from the reference location).`
      );
    }
  }

  // 4. Price level comparison
  const cafesWithPrice = cafes.filter(c => typeof c.price_level === 'number');
  if (cafesWithPrice.length >= 2) {
    const sortedByPrice = [...cafesWithPrice].sort((a, b) => a.price_level - b.price_level);
    const lowestPrice = sortedByPrice[0];
    const highestPrice = sortedByPrice[sortedByPrice.length - 1];

    if (lowestPrice.price_level < highestPrice.price_level) {
      const getPriceSign = (lvl) => '$'.repeat(lvl || 1);
      summaries.push(
        `💵 ${lowestPrice.name} has a lower Google price level tier (${getPriceSign(lowestPrice.price_level)}) compared to ${highestPrice.name} (${getPriceSign(highestPrice.price_level)}).`
      );
    }
  }

  // 5. Open / Closed Status
  const openCafes = cafes.filter(c => c.open_now === true);
  const closedCafes = cafes.filter(c => c.open_now === false);

  if (openCafes.length > 0 && closedCafes.length > 0) {
    const openNames = openCafes.map(c => c.name).join(', ');
    const closedNames = closedCafes.map(c => c.name).join(', ');
    summaries.push(`🕒 Currently open: ${openNames}. Currently closed: ${closedNames}.`);
  } else if (openCafes.length === cafes.length) {
    summaries.push('🕒 All selected cafes are currently reported as open on Google Places.');
  } else if (closedCafes.length === cafes.length) {
    summaries.push('🕒 All selected cafes are currently reported as closed on Google Places.');
  }

  if (summaries.length === 0) {
    summaries.push('Information for detailed comparison is limited from Google Places data.');
  }

  return summaries;
};
