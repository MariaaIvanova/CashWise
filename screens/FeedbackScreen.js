import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, TextInput, Button, Text, Card, RadioButton, Snackbar, List, Divider } from 'react-native-paper';

export default function FeedbackScreen({ navigation }) {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  const [email, setEmail] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const handleSubmit = () => {
    // Here we would send the feedback to a server
    // For now, just display a success message
    console.log('Feedback submitted:', {
      type: feedbackType,
      text: feedbackText,
      rating,
      email
    });
    
    // Reset form
    setFeedbackText('');
    setRating(5);
    setEmail('');
    
    // Show success message
    setSnackbarVisible(true);
  };
  
  const renderRatingSelector = () => {
    const ratings = [1, 2, 3, 4, 5];
    
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Как оценявате приложението:</Text>
        <View style={styles.starsContainer}>
          {ratings.map((value) => (
            <Button
              key={value}
              icon={value <= rating ? "star" : "star-outline"}
              onPress={() => setRating(value)}
              color={value <= rating ? "#FFD700" : "#A0A0A0"}
              style={styles.starButton}
              compact
            />
          ))}
        </View>
      </View>
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Обратна връзка</Title>
          <Text style={styles.description}>
            Помогнете ни да подобрим приложението. Споделете вашето мнение, предложения или докладвайте проблеми.
          </Text>
          
          <RadioButton.Group
            onValueChange={value => setFeedbackType(value)}
            value={feedbackType}
          >
            <View style={styles.radioGroup}>
              <RadioButton.Item 
                label="Предложение" 
                value="suggestion" 
                style={styles.radioItem}
              />
              <RadioButton.Item 
                label="Проблем" 
                value="bug" 
                style={styles.radioItem}
              />
              <RadioButton.Item 
                label="Съдържание" 
                value="content" 
                style={styles.radioItem}
              />
            </View>
          </RadioButton.Group>
          
          {renderRatingSelector()}
          
          <TextInput
            label="Вашият отзив"
            value={feedbackText}
            onChangeText={setFeedbackText}
            multiline
            numberOfLines={5}
            mode="outlined"
            style={styles.textInput}
          />
          
          <TextInput
            label="Email (по желание)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.emailInput}
            placeholder="За да ви отговорим лично"
          />
          
          <Button 
            mode="contained" 
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={!feedbackText.trim()}
          >
            Изпрати
          </Button>
        </Card.Content>
      </Card>
      
      <Card style={styles.faqCard}>
        <Card.Content>
          <Title style={styles.faqTitle}>Често задавани въпроси</Title>
          
          <List.Accordion
            title="Как да проследя своя напредък?"
            id="1"
            style={styles.accordion}
          >
            <List.Item
              title="Можете да видите своя напредък в профила си - XP точки, завършени уроци и тестове."
              titleNumberOfLines={3}
              style={styles.accordionItem}
            />
          </List.Accordion>
          
          <Divider />
          
          <List.Accordion
            title="Как да спечеля повече XP точки?"
            id="2"
            style={styles.accordion}
          >
            <List.Item
              title="Печелите XP, като завършвате уроци, решавате тестове и поддържате последователност в ученето."
              titleNumberOfLines={3}
              style={styles.accordionItem}
            />
          </List.Accordion>
          
          <Divider />
          
          <List.Accordion
            title="Как да получа значки и награди?"
            id="3"
            style={styles.accordion}
          >
            <List.Item
              title="Значките се отключват при постигане на специфични цели. Посетете раздела 'Значки' в профила си, за да видите изискванията."
              titleNumberOfLines={4}
              style={styles.accordionItem}
            />
          </List.Accordion>
          
          <Divider />
          
          <List.Accordion
            title="Как да променя уведомленията?"
            id="4"
            style={styles.accordion}
          >
            <List.Item
              title="Отидете в Профил > Настройки, за да промените настройките за известия."
              titleNumberOfLines={3}
              style={styles.accordionItem}
            />
          </List.Accordion>
        </Card.Content>
      </Card>
      
      <Card style={styles.contactCard}>
        <Card.Content>
          <Title style={styles.contactTitle}>Свържете се с нас</Title>
          <Text style={styles.contactText}>
            Email: support@финансоваграмотност.бг
          </Text>
          <Text style={styles.contactText}>
            Уебсайт: www.финансоваграмотност.бг
          </Text>
        </Card.Content>
      </Card>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        Благодарим за вашата обратна връзка!
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  radioGroup: {
    marginVertical: 8,
  },
  radioItem: {
    paddingVertical: 4,
  },
  ratingContainer: {
    marginVertical: 16,
  },
  ratingLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    marginHorizontal: 4,
  },
  textInput: {
    marginBottom: 16,
  },
  emailInput: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
  },
  faqCard: {
    margin: 16,
    marginBottom: 8,
  },
  faqTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  accordion: {
    paddingLeft: 0,
  },
  accordionItem: {
    paddingLeft: 16,
    backgroundColor: '#f9f9f9',
  },
  contactCard: {
    margin: 16,
  },
  contactTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  contactText: {
    marginBottom: 8,
  },
}); 