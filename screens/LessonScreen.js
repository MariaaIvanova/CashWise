import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card } from 'react-native-paper';

export default function LessonScreen({ route, navigation }) {
  const { topic } = route.params || { topic: 'Financial Education' };

  // Content for different lessons
  const lessonContent = {
    'Budgeting Basics': {
      introduction: 'Budgeting is the foundation of financial health. It helps you understand where your money goes and how to allocate it effectively.',
      steps: [
        'Track all your income sources for a month',
        'Record all expenses, categorizing them (e.g., housing, food, transportation)',
        'Compare income to expenses to identify spending patterns',
        'Set realistic spending limits for each category',
        'Regularly review and adjust your budget'
      ],
      tips: 'Try the 50/30/20 rule: Allocate 50% of income to needs, 30% to wants, and 20% to savings and debt repayment.'
    },
    'Emergency Fund': {
      introduction: 'An emergency fund is a financial safety net for unexpected expenses or income loss.',
      steps: [
        'Start small with a goal of $1,000',
        'Gradually build up to 3-6 months of essential expenses',
        'Keep the fund in a separate, easily accessible account',
        'Replenish the fund after using it',
        'Adjust the fund size as your financial situation changes'
      ],
      tips: 'Automate your savings by setting up regular transfers to your emergency fund account.'
    },
    'Debt Management': {
      introduction: 'Managing debt effectively is crucial for long-term financial health.',
      steps: [
        'List all debts with their interest rates and minimum payments',
        'Focus on high-interest debt first (debt avalanche) or small balances first (debt snowball)',
        'Pay more than the minimum when possible',
        'Consider debt consolidation if appropriate',
        'Create a realistic repayment plan and stick to it'
      ],
      tips: 'Contact creditors if you\'re struggling; many offer hardship programs or payment plans.'
    }
  };

  const content = lessonContent[topic] || {
    introduction: 'Select a topic from the home screen to learn more about financial management.',
    steps: ['Return to home screen', 'Choose a financial topic', 'Follow the guided lessons'],
    tips: 'Consistent application of financial principles leads to long-term success.'
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Title style={styles.title}>{topic}</Title>
        
        <Card style={styles.card}>
          <Card.Content>
            <Paragraph style={styles.introduction}>{content.introduction}</Paragraph>
          </Card.Content>
        </Card>
        
        <Title style={styles.subtitle}>Steps to Follow:</Title>
        {content.steps.map((step, index) => (
          <Card key={index} style={styles.stepCard}>
            <Card.Content>
              <Paragraph>{index + 1}. {step}</Paragraph>
            </Card.Content>
          </Card>
        ))}
        
        <Card style={[styles.card, styles.tipCard]}>
          <Card.Content>
            <Title style={styles.tipTitle}>Pro Tip</Title>
            <Paragraph>{content.tips}</Paragraph>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Button 
        mode="contained" 
        onPress={() => navigation.goBack()}
        style={styles.button}
      >
        Return to Home
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  introduction: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    marginBottom: 16,
  },
  stepCard: {
    marginBottom: 8,
  },
  tipCard: {
    backgroundColor: '#f5f5dc',
    marginTop: 16,
  },
  tipTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
  },
}); 