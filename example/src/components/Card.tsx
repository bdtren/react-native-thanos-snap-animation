import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type CardProps = {};
const Card: React.FC<CardProps> = ({}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn}>
        <Text>Button 1</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn2}>
        <Text>Button 2</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container: {
    height: 312,
    width: 200, //width,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#2C2D2F',
  },
  btn: {
    width: 60,
    height: 40,
    backgroundColor: '#A38DC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn2: {
    width: 120,
    height: 60,
    backgroundColor: '#AEC997',
    marginTop: 80,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
