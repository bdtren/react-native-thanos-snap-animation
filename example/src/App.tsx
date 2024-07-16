import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { InfinityGauntlet, sayHello } from 'react-native-thanos-snap-animation';
import Card from './components/Card';

export default function App() {
  //States
  const [animationReady, setAnimationReady] = useState(false);
  const [timer, setTimer] = useState(0);
  const [snap, setSnap] = useState(false);
  //Refs
  const startTimeRef = useRef(0);

  useEffect(() => {
    sayHello().then((msg) => {
      console.log(msg);
    });
  }, []);

  return (
    <View style={styles.container}>
      <InfinityGauntlet
        snap={snap}
        onAnimationPrepare={() => {
          setAnimationReady(false);
          startTimeRef.current = Date.now();
        }}
        onAnimationReady={() => {
          setAnimationReady(true);
          setTimer(Date.now() - startTimeRef.current);
          console.log('animation ready');
        }}
      >
        <Card />
      </InfinityGauntlet>

      <TouchableOpacity
        style={styles.snapButton}
        disabled={!animationReady}
        onPress={() => {
          setSnap((prev) => !prev);
        }}
      >
        {animationReady ? (
          <>
            <Image
              source={require('./assets/snap-logo.png')}
              style={styles.snapImage}
              resizeMode={'contain'}
            />
            <Text>{`Init took: ${timer}ms`}</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size={'small'} />
            <Text>Preparing Animation</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    // justifyContent: 'center',
    marginTop: 100,
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  snapButton: {
    minWidth: 150,
    maxWidth: 380,
    minHeight: 90,
    backgroundColor: '#F1F1F0',
    borderWidth: 1,
    borderColor: 'black',
    position: 'absolute',
    bottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  snapImage: {
    width: 90,
    height: 90,
  },
});
