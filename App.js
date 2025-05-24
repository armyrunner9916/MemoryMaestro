import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 4; // 4 columns with padding

export default function App() {
  // Game states
  const [gameState, setGameState] = useState('landing');
  const [playerName, setPlayerName] = useState('');
  const [level, setLevel] = useState(1);
  const [pairs, setPairs] = useState(2);
  const [timeLimit, setTimeLimit] = useState(12);
  const [timeLeft, setTimeLeft] = useState(12);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [completedLevel, setCompletedLevel] = useState(0);
  
  // Settings states
  const [darkMode, setDarkMode] = useState(true);
  const [cardBackColor, setCardBackColor] = useState('blue');
  const [showSettings, setShowSettings] = useState(false);
  const [showHighScores, setShowHighScores] = useState(false);
  const [highScores, setHighScores] = useState([]);

  // Card symbols
  const symbols = ['⭐', '🎈', '🎨', '🎯', '🎪', '🎭', '🎸', '🎺', '🏀', '⚽', '🌈', '🌺', '🍕', '🍔', '🚀', '🛸'];

  // Load high scores on mount
  useEffect(() => {
    loadHighScores();
  }, []);

  const loadHighScores = async () => {
    try {
      const saved = await AsyncStorage.getItem('memoryMatchHighScores');
      if (saved) {
        setHighScores(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState]);

  // Initialize cards
  const initializeCards = () => {
    const currentPairs = level === 1 ? 2 : 2 + (level - 1);
    const selectedSymbols = symbols.slice(0, currentPairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    return shuffled.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false
    }));
  };

  // Start game
  const startGame = () => {
    if (!playerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name!');
      return;
    }
    setGameState('playing');
    setLevel(1);
    setPairs(2);
    setTimeLimit(12);
    setTimeLeft(12);
    setMatchedPairs([]);
    setFlippedCards([]);
    setCards(initializeCards());
    setCompletedLevel(0);
  };

  // Handle card press
  const handleCardPress = (cardId) => {
    if (gameState !== 'playing') return;
    
    const clickedCard = cards.find(card => card.id === cardId);
    if (clickedCard.isMatched) return;
    
    if (flippedCards.includes(cardId)) {
      setFlippedCards(flippedCards.filter(id => id !== cardId));
      return;
    }
    
    if (flippedCards.length === 2) return;
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    if (newFlippedCards.length === 2) {
      const [first, second] = newFlippedCards;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);
      
      if (firstCard.symbol === secondCard.symbol) {
        setMatchedPairs([...matchedPairs, firstCard.symbol]);
        setCards(cards.map(card => 
          card.id === first || card.id === second 
            ? { ...card, isMatched: true }
            : card
        ));
        setFlippedCards([]);
        
        if (matchedPairs.length + 1 === pairs) {
          setCompletedLevel(level);
          setTimeout(() => nextLevel(), 1000);
        }
      } else {
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  // Next level
  const nextLevel = () => {
    const newLevel = level + 1;
    const newPairs = 2 + newLevel - 1;
    const newTimeLimit = 12 + (newLevel - 1) * 4;
    
    setLevel(newLevel);
    setPairs(newPairs);
    setTimeLimit(newTimeLimit);
    setTimeLeft(newTimeLimit);
    setMatchedPairs([]);
    setFlippedCards([]);
    
    const selectedSymbols = symbols.slice(0, newPairs);
    const cardPairs = [...selectedSymbols, ...selectedSymbols];
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    const newCards = shuffled.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false
    }));
    setCards(newCards);
  };

  // End game
  const endGame = async () => {
    setGameState('gameOver');
    
    if (completedLevel > 0) {
      const newScore = {
        name: playerName,
        level: completedLevel,
        date: new Date().toISOString()
      };
      
      const updatedScores = [...highScores, newScore]
        .sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          return new Date(b.date) - new Date(a.date);
        })
        .slice(0, 10);
      
      setHighScores(updatedScores);
      try {
        await AsyncStorage.setItem('memoryMatchHighScores', JSON.stringify(updatedScores));
      } catch (error) {
        console.error('Error saving high scores:', error);
      }
    }
  };

  // Get color for card backs
  const getCardColor = () => {
    const colors = {
      black: '#000000',
      red: '#dc2626',
      green: '#16a34a',
      blue: '#2563eb',
      yellow: '#eab308',
      purple: '#9333ea'
    };
    return colors[cardBackColor] || colors.blue;
  };

  // Card back design component
  const CardBack = () => {
    const color = getCardColor();
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Center diamond */}
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: 'rgba(255,255,255,0.2)',
          transform: [{ rotate: '45deg' }],
          position: 'absolute',
        }} />
        {/* Corner dots */}
        <View style={{ position: 'absolute', top: 8, left: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <View style={{ position: 'absolute', top: 8, right: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <View style={{ position: 'absolute', bottom: 8, left: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <View style={{ position: 'absolute', bottom: 8, right: 8, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        {/* Center symbol */}
        <Text style={{ fontSize: 30, color: 'rgba(255,255,255,0.3)' }}>♠</Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: darkMode ? '#111827' : '#f3f4f6',
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 30,
      color: darkMode ? '#ffffff' : '#000000',
    },
    card: {
      backgroundColor: darkMode ? '#374151' : '#ffffff',
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    label: {
      fontSize: 18,
      marginBottom: 8,
      color: darkMode ? '#ffffff' : '#000000',
    },
    input: {
      borderWidth: 1,
      borderColor: darkMode ? '#4b5563' : '#d1d5db',
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      color: darkMode ? '#ffffff' : '#000000',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
    },
    button: {
      backgroundColor: '#3b82f6',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 8,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: darkMode ? '#4b5563' : '#e5e7eb',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 8,
    },
    gameCard: {
      width: CARD_SIZE,
      height: CARD_SIZE * 1.4,
      margin: 5,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 2,
      overflow: 'hidden',
    },
    cardBack: {
      backgroundColor: getCardColor(),
      borderColor: getCardColor(),
      borderWidth: 3,
    },
    cardFront: {
      backgroundColor: darkMode ? '#374151' : '#ffffff',
      borderColor: darkMode ? '#4b5563' : '#d1d5db',
    },
    cardMatched: {
      backgroundColor: '#10b981',
      borderColor: '#059669',
    },
    cardText: {
      fontSize: 32,
    },
    gameGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      padding: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: darkMode ? '#374151' : '#ffffff',
      borderRadius: 8,
      marginBottom: 16,
    },
    timer: {
      fontSize: 24,
      fontWeight: 'bold',
      color: darkMode ? '#ffffff' : '#000000',
    },
  });

  // Landing screen
  if (gameState === 'landing') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.title}>Memory Maestro</Text>
          
          <View style={styles.card}>
            <Text style={styles.label}>Enter Your Name:</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Your name"
              placeholderTextColor={darkMode ? '#9ca3af' : '#6b7280'}
            />
            
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.label, { fontSize: 24, fontWeight: 'bold' }]}>How to Play</Text>
              <Text style={[styles.label, { fontSize: 16 }]}>• Flip cards to find matching pairs</Text>
              <Text style={[styles.label, { fontSize: 16 }]}>• Start with 2 pairs and 12 seconds</Text>
              <Text style={[styles.label, { fontSize: 16 }]}>• Each level adds 1 pair and 4 seconds</Text>
              <Text style={[styles.label, { fontSize: 16 }]}>• Complete all pairs before time runs out!</Text>
            </View>
            
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setDarkMode(!darkMode)}
              >
                <Text>{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowSettings(!showSettings)}
              >
                <Text>⚙️ Settings</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>Start Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#9333ea' }]}
              onPress={() => setShowHighScores(true)}
            >
              <Text style={styles.buttonText}>High Scores</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Settings Modal */}
        <Modal visible={showSettings} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={[styles.card, { margin: 20 }]}>
              <Text style={[styles.label, { fontSize: 20, fontWeight: 'bold' }]}>Card Back Color</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                {['black', 'red', 'green', 'blue', 'yellow', 'purple'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={{
                      backgroundColor: color === 'black' ? '#000' :
                                     color === 'red' ? '#dc2626' :
                                     color === 'green' ? '#16a34a' :
                                     color === 'blue' ? '#2563eb' :
                                     color === 'yellow' ? '#eab308' : '#9333ea',
                      width: 80,
                      height: 40,
                      margin: 5,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: cardBackColor === color ? 3 : 0,
                      borderColor: '#3b82f6',
                    }}
                    onPress={() => setCardBackColor(color)}
                  >
                    <Text style={{ color: color === 'yellow' ? '#000' : '#fff' }}>{color}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.button, { marginTop: 20 }]}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* High Scores Modal */}
        <Modal visible={showHighScores} transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={[styles.card, { margin: 20, maxHeight: '80%' }]}>
              <Text style={[styles.label, { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }]}>
                Top 10 High Scores
              </Text>
              <ScrollView>
                {highScores.length === 0 ? (
                  <Text style={styles.label}>No scores yet. Be the first!</Text>
                ) : (
                  highScores.map((score, i) => (
                    <View key={i} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: darkMode ? '#4b5563' : '#e5e7eb' }}>
                      <Text style={[styles.label, { flex: 1 }]}>{i + 1}</Text>
                      <Text style={[styles.label, { flex: 3 }]}>{score.name}</Text>
                      <Text style={[styles.label, { flex: 1 }]}>{score.level}</Text>
                      <Text style={[styles.label, { flex: 2 }]}>{new Date(score.date).toLocaleDateString()}</Text>
                    </View>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity
                style={[styles.button, { marginTop: 20 }]}
                onPress={() => setShowHighScores(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Game screen
  if (gameState === 'playing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.label}>Level: {level}</Text>
            <Text style={styles.timer}>Time: {timeLeft}s</Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: '#ef4444', margin: 0 }]}
              onPress={endGame}
            >
              <Text style={{ color: '#ffffff' }}>Give Up</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView>
            <View style={styles.gameGrid}>
              {cards.map(card => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.gameCard,
                    flippedCards.includes(card.id) || card.isMatched
                      ? (card.isMatched ? styles.cardMatched : styles.cardFront)
                      : styles.cardBack
                  ]}
                  onPress={() => handleCardPress(card.id)}
                  activeOpacity={0.8}
                >
                  {(flippedCards.includes(card.id) || card.isMatched) ? (
                    <Text style={styles.cardText}>{card.symbol}</Text>
                  ) : (
                    <CardBack />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Game over screen
  if (gameState === 'gameOver') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <View style={styles.card}>
            <Text style={[styles.title, { marginBottom: 20 }]}>Game Over!</Text>
            <Text style={[styles.label, { fontSize: 20, textAlign: 'center', marginBottom: 30 }]}>
              Level Reached: {completedLevel}
            </Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => setGameState('landing')}
            >
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#9333ea' }]}
              onPress={() => {
                setShowHighScores(true);
                setGameState('landing');
              }}
            >
              <Text style={styles.buttonText}>View High Scores</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}