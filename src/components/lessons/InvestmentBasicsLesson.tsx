import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Topic, VisualElement } from '../../../screens/LessonScreen';

export const investmentBasicsTopics: Topic[] = [
  {
    title: 'Основи на инвестирането',
    content: `Инвестирането е процес на разполагане с пари с цел получаване на доход или печалба в бъдеще. В България има различни възможности за инвестиране, като всеки инвеститор трябва да разбира основните принципи и рискове.

Основните видове инвестиции включват банкови депозити, държавни ценни книжа, акции, облигации, инвестиционни фондове и недвижими имоти. Важно е да се знае, че по-високата възможна доходност обикновено носи и по-висок риск.

Преди да започнете да инвестирате, е важно да определите вашите финансови цели, инвестиционен хоризонт и толеранс към риск. Също така е добре да диверсифицирате инвестициите си, за да намалите общия риск.`,
    videoAsset: 'lesson7',
    keyPoints: [
      'Разнообразие от инвестиционни възможности',
      'Връзка между риск и възвръщаемост',
      'Важност на диверсификацията',
      'Определяне на инвестиционни цели',
      'Разбиране на инвестиционните инструменти'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'Видове инвестиции и техните характеристики',
        headers: ['Вид инвестиция', 'Риск', 'Възвръщаемост'],
        rows: [
          ['Банкови депозити', 'Нисък', 'Нисъка'],
          ['Държавни облигации', 'Нисък до среден', 'Средна'],
          ['Акции', 'Висок', 'Висока потенциална'],
          ['Недвижими имоти', 'Среден', 'Средна до висока']
        ]
      },
      {
        type: 'icons',
        title: 'Ключови принципи на инвестирането',
        items: [
          { icon: 'chart-line', label: 'Дългосрочна перспектива' },
          { icon: 'shield-check', label: 'Диверсификация' },
          { icon: 'cash-multiple', label: 'Регулярни инвестиции' },
          { icon: 'book-open-variant', label: 'Финансово образование' }
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

export default investmentBasicsTopics; 