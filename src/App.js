import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react'; // Import QRCodeSVG
import './App.css'; // You can style the app using a CSS file

const socket = io('http://localhost:4000'); // Connect to the Socket.io server

function App() {
  const [isPlayer, setIsPlayer] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [winner, setWinner] = useState(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // Disable buttons after submission
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Listen for new questions
    socket.on('newQuestion', (question) => {
      setCurrentQuestion(question);
      setWinner(null);
      setIsSubmitted(false); // Reset the submission state for the next question
      setErrorMessage('');
    });

    socket.on('correctAnswer', ({ playerName }) => {
      setWinner(playerName);
    });

    socket.on('endGame', () => {
      setGameEnded(true);
    });

    socket.on('wrongAnswer', () => {
      setErrorMessage('Incorrect answer! Try again.');
      setIsSubmitted(false); // Allow retrying if wrong
    });

    return () => {
      socket.off('newQuestion');
      socket.off('correctAnswer');
      socket.off('endGame');
      socket.off('wrongAnswer');
    };
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert("Please enter a valid name.");
      return;
    }
    setIsPlayer(true);
  };

  const handleSubmitAnswer = (answer) => {
    setIsSubmitted(true);
    socket.emit('submitAnswer', { playerName, answer });
  };

  if (gameEnded) {
    return <div>Game Over! Thanks for playing.</div>;
  }

  return (
    <div className="App">
      {!isPlayer ? (
        <div>
          <h1>Join the Game</h1>
          <QRCodeSVG value={window.location.href} />
          <div>
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
            />
            <button onClick={handleJoin}>Join</button>
          </div>
        </div>
      ) : (
        <div>
          {currentQuestion ? (
            <div>
              <h2>{currentQuestion.question}</h2>
              <ul>
                {currentQuestion.options.map((option, index) => (
                  <li key={index}>
                    <button 
                      onClick={() => handleSubmitAnswer(option[0])} 
                      disabled={isSubmitted}
                    >
                      {option}
                    </button>
                  </li>
                ))}
              </ul>
              {winner && <h3>Congratulations, {winner}! You answered correctly.</h3>}
              {errorMessage && <p className="error">{errorMessage}</p>}
            </div>
          ) : (
            <div>Waiting for the next question...</div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
