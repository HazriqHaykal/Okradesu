/**
 * Farmer-facing background for each disease the Leaf Scan model can flag,
 * keyed by the display names from src/services/cropHealthLabels.ts.
 * General guidance only; it does not replace advice from an agronomist.
 */
export type LeafDiseaseInfo = { why: string; actions: string[] };

export const LEAF_DISEASES: Record<string, LeafDiseaseInfo> = {
  'Cercospora Leaf Spot': {
    why: 'A fungal leaf disease. Spores spread by splashing water, air and old infected leaves, and grow fastest when it’s warm and leaves stay wet or humid for long periods.',
    actions: [
      'Remove spotted leaves and clear fallen leaves from the bed',
      'Water at the base in the morning so leaves dry quickly',
      'Improve spacing and airflow between plants',
      'Ask an agricultural advisor about a suitable fungicide if spots keep spreading',
    ],
  },
  'Downy Mildew': {
    why: 'Caused by a water mould (not a true fungus) that spreads through the air. It thrives when humidity is high, nights are cool and leaves stay wet for hours.',
    actions: [
      'Lower humidity by running the fans and ventilating the room',
      'Keep leaves dry and avoid watering late in the day',
      'Remove badly affected leaves and keep them out of the compost',
      'Check nearby plants, especially the undersides of leaves',
    ],
  },
  'Leaf Curly Virus': {
    why: 'A virus carried from plant to plant by whiteflies feeding on the leaves. An infected plant can’t be cured, so the aim is to stop it spreading.',
    actions: [
      'Check the undersides of leaves for whiteflies',
      'Remove and bag badly curled plants, and don’t compost them',
      'Use yellow sticky traps and keep weeds down to reduce whiteflies',
      'Watch nearby plants closely over the next week',
    ],
  },
};
