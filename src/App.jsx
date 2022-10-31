import React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;

const contractAddress = "0x2BA62934E96d6F35536351E1Cd58Ee270F51474b";

const getWavePortalContract = () => {
      const contractABI = abi.abi;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      return wavePortalContract;
}

export default function App() {

  const [currentAccount, setCurrentAccount] = React.useState("");
  const [allWaves, setAllWaves] = React.useState([]);
  const [isMining, setIsMining] = React.useState(false);
  const [input, setInput] = React.useState('');


  const onNewWave = React.useCallback((from ,timestamp, message) => {
    console.log("NewWave", from, timestamp, message);
    setAllWaves(prevState => [
      ...prevState,
      {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
      },
    ]);
  }, [])
  
  React.useEffect(async () => {
    await checkIfWalletIsConnected();
    await getAllWaves();
  }, []);

  React.useEffect(() => {
    const wavePortalContract = getWavePortalContract();
    wavePortalContract.on("NewWave", onNewWave);

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, [])

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const wavePortalContract = getWavePortalContract();
        const waves = await wavePortalContract.getAllWaves();
        console.log("waves from contract", waves);
        const formattedWaves = [];
        waves.forEach(wave => {
          formattedWaves.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });
    
        setAllWaves(formattedWaves);
        } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const wavePortalContract = getWavePortalContract();
        let count = await wavePortalContract.getTotalWaves();
        
        const waveTxn = await wavePortalContract.wave(input, { gasLimit: 300000 })
        setIsMining(true);
        await waveTxn.wait();

        setIsMining(false);

        count = await wavePortalContract.getTotalWaves();
        setInput('');
        await getAllWaves();
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setIsMining(false);
    }
}

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }


  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }
  console.log(allWaves)

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          Let's wave together 🌊
        </div>

        <div className="bio">
          Click on the button below to connect your wallet and surf on the wave 🏄
        </div>
        <textarea className="messageArea" rows={4} onChange={(e) => setInput(e.target.value)} value={input}></textarea>
    
        <button className="waveButton" onClick={wave} disabled={isMining}>
          {isMining ? "generating a new wave..." : "~ SPLASH ~"}
        </button>
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <div className="waveCount">We surfed on {allWaves.length} waves !</div>

        <div className="messageWrapper">
          {allWaves.map((wave, index) => {
            const isMessageFromMe = wave.address.toLowerCase() === currentAccount;
            return (
              <div key={index} className={`messageCard ${isMessageFromMe ? "rightMessageCard" : "leftMessageCard"}`}>
                <i style={{fontSize: 10}}>Address: {wave.address}</i>
                <div style={{fontSize: 10}}>{(new Date(wave.timestamp.toString())).toDateString()}</div>
                <div style={{textAlign: "center"}}>{wave.message !== "" ? wave.message : "🤔"}</div>
              </div>)
          })}
        </div>
          
      </div>
    </div>
  );
}
