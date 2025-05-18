import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Topic, VisualElement } from '../../../screens/LessonScreen';

export const socialSecurityTopics: Topic[] = [
  {
    title: 'Социално осигуряване в България',
    content: `Социалното осигуряване в България е система, която осигурява защита на гражданите при различни социални рискове като безработица, болест, майчинство, инвалидност и старост. Системата се финансира чрез задължителни осигуровки, които се плащат от работодателите и работниците.

Общият размер на осигуровките е 32.8% от месечната работна заплата, като работодателят плаща 18.92%, а работникът - 13.88%. Тези осигуровки включват пенсионно осигуряване, здравно осигуряване и осигуряване при безработица.

Важно е да се знае, че има минимална и максимална осигурителна основа, които се определят ежегодно. През 2024 г. минималната основа е 933 лв., а максималната - 3000 лв.`,
    videoAsset: 'lesson6',
    keyPoints: [
      'Общ размер на осигуровките: 32.8%',
      'Работодател: 18.92%',
      'Работник: 13.88%',
      'Минимална основа: 933 лв. (2024)',
      'Максимална основа: 3000 лв. (2024)'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'Разпределение на осигуровките',
        headers: ['Вид осигуровка', 'Работодател', 'Работник'],
        rows: [
          ['Пенсионно осигуряване', '12.9%', '7.8%'],
          ['Здравно осигуряване', '5.2%', '3.2%'],
          ['Осигуряване при безработица', '0.82%', '2.88%'],
          ['Общо', '18.92%', '13.88%']
        ]
      },
      {
        type: 'icons',
        title: 'Важни аспекти на социалното осигуряване',
        items: [
          { icon: 'hospital', label: 'Здравно осигуряване' },
          { icon: 'account-group', label: 'Пенсионно осигуряване' },
          { icon: 'briefcase-outline', label: 'Безработица' },
          { icon: 'cash-multiple', label: 'Осигурителни вноски' }
        ]
      }
    ]
  }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  surface: {
    padding: 16,
    marginVertical: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  keyPoint: {
    fontSize: 14,
    marginBottom: 8,
    paddingLeft: 16,
  },
});

export default socialSecurityTopics; 