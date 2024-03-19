import React, { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';

const App = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [initiatorSignal, setInitiatorSignal] = useState('');
  const [answererSignal, setAnswererSignal] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    startLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const createPeer = initiator => {
    const newPeer = new SimplePeer({ initiator, stream: localStream });

    newPeer.on('signal', data => {
      if (initiator) {
        setInitiatorSignal(JSON.stringify(data));
      } else {
        setAnswererSignal(JSON.stringify(data));
      }
    });

    newPeer.on('stream', stream => {
      setRemoteStream(stream);
    });

    setPeer(newPeer);
  };

  const connectPeers = () => {
    if (initiatorSignal && answererSignal) {
      const initiatorSignalData = JSON.parse(initiatorSignal);
      const answererSignalData = JSON.parse(answererSignal);

      const initiatorPeer = new SimplePeer({ initiator: true, trickle: false });
      const answererPeer = new SimplePeer({ trickle: false });

      initiatorPeer.signal(answererSignalData);
      answererPeer.signal(initiatorSignalData);

      initiatorPeer.on('connect', () => console.log('Initiator connected'));
      answererPeer.on('connect', () => console.log('Answerer connected'));

      setPeer(initiatorPeer);
    }
  };

  useEffect(() => {
    if (localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="App">
      <h1>Video Chat App</h1>
      <div className="video-container">
        <div className="local-video">
          <h2>Your Video</h2>
          <video autoPlay muted playsInline ref={localVideoRef}></video>
        </div>
        <div className="remote-video">
          <h2>Remote Video</h2>
          <video autoPlay playsInline ref={remoteVideoRef}></video>
        </div>
      </div>
      <div className="controls">
        {!initiatorSignal && !answererSignal && (
          <button onClick={() => createPeer(true)}>Start Call</button>
        )}
        {initiatorSignal && !answererSignal && (
          <div>
            <input value={initiatorSignal} readOnly />
            <button onClick={() => createPeer(false)}>Join Call</button>
          </div>
        )}
        {initiatorSignal && answererSignal && (
          <button onClick={connectPeers}>Connect Peers</button>
        )}
      </div>
    </div>
  );
};

export default App;
