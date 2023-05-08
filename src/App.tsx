import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { Button, Card, Input, Radio } from "antd";

function App() {
  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [showInscriptionCard, setShowInscriptionCard] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [inscriptionCard, setInscriptionCard] = useState<{inscriptionId: string, psbt: string} | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState("livenet");

  const getBasicInfo = async () => {
    const unisat = (window as any).unisat;
    const [address] = await unisat.getAccounts();
    setAddress(address);

    const publicKey = await unisat.getPublicKey();
    setPublicKey(publicKey);

    const balance = await unisat.getBalance();
    setBalance(balance);

    const network = await unisat.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef<{ accounts: string[] }>({
    accounts: [],
  });
  const self = selfRef.current;
  const handleAccountsChanged = (_accounts: string[]) => {
    if (self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const handleNetworkChanged = (network: string) => {
    setNetwork(network);
    getBasicInfo();
  };

  useEffect(() => {
    const unisat = (window as any).unisat;
    if (unisat) {
      setUnisatInstalled(true);
    } else {
      return;
    }
    unisat.getAccounts().then((accounts: string[]) => {
      handleAccountsChanged(accounts);
    });

    unisat.on("accountsChanged", handleAccountsChanged);
    unisat.on("networkChanged", handleNetworkChanged);

    return () => {
      unisat.removeListener("accountsChanged", handleAccountsChanged);
      unisat.removeListener("networkChanged", handleNetworkChanged);
    };
  }, []);

  if (!unisatInstalled) {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <Button
              onClick={() => {
                window.location.href = "https://unisat.io";
              }}
            >
              Install Unisat Wallet
            </Button>
          </div>
        </header>
      </div>
    );
  }
  const unisat = (window as any).unisat;
  return (
<div>
    <div className="background-image"></div>
    <div className="app-container">
   
    <div className="App">
      <header className="App-header">
        <p style={{width: 1000, marginTop: 20, marginLeft: 60, position: 'fixed', top: '100px', left: '50px'}}>BTC Machine Dispenser</p>

        {connected ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Card
              size="small"
              className="card-container"
              style={{border: 'none', width: 495, marginTop: 175, marginLeft: 347, position: 'fixed', top: '100px', left: '50px' }}

            >
              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Address:</div>
                <div style={{ wordWrap: "break-word" }}>{address}</div>
              </div>

              <div style={{ textAlign: "left", marginTop: 10 }}>
                <div style={{ fontWeight: "bold" }}>Balance: (Satoshis)</div>
                <div style={{ wordWrap: "break-word" }}>{balance.total}</div>
              </div>
            </Card>

            

            <ClaimBTCMCard address={address} />
            
           
          </div>
        ) : (
          <div>
            <Button
              className="retro-button"
              style={{ marginTop: 400,marginLeft:485, position:'fixed',left:10}}
              onClick={async () => {
                const result = await unisat.requestAccounts();
                handleAccountsChanged(result);
              }}
            >
              Connect Unisat Wallet
            </Button>
          </div>
        )}
      </header>
      <FloatingHeart positionType="left" x="5%" y="10%" />
      <FloatingHeart positionType="right" x="5%" y="13%" />


      <FloatingCoin x="10%" y="60%" />
      <FloatingCoin x="80%" y="50%" />
    </div>
  </div>
  </div>
  );
}



interface ClaimBTCMCardProps {
  address: string;

}
interface FloatingHeartProps {
  x: string;
  y: string;
  positionType: 'left' | 'right';
}

const FloatingHeart: React.FC<FloatingHeartProps> = ({ x, y, positionType }) => (
  <div
    className="floating-heart"
    style={{ [positionType]: x, top: y }}
  ></div>
);

interface FloatingCoinProps {
  x: string;
  y: string;
}

const FloatingCoin: React.FC<FloatingCoinProps> = ({ x, y }) => (
  <div
    className="floating-coin"
    style={{ left: x, top: y }}
  ></div>
);


function ClaimBTCMCard({ address }: ClaimBTCMCardProps) {
  const [message, setMessage] = useState("ClaimZBIT");
  const [signature, setSignature] = useState("");
  const [inscriptionId, setInscriptionId] = useState("");
  const [bitcoinAmount, setBitcoinAmount] = useState(0);
  const [inscriptionImage, setInscriptionImage] = useState<string | null>("");
  const [PSBT, setPSBTbutton]= useState("");
  const [psbtResult, setPsbtResult] = useState("");
  const [inscriptionJson, setInscriptionJson] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [txid, setTxid] = useState("");


  //const [inscriptionJson, setInscriptionJson] = useState<any>(null); // Add this line

  useEffect(() => {
    setMessage("ClaimZBIT");
  }, [address]);

  const claimDrop = async (signature: string) => {
    const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.REACT_APP_API_KEY as string,
      },
      body: JSON.stringify({
        address,
        signature,
        message,
      }),
    });
  
    const jsonResponse = await response.json();
    if (response.status === 200) {
      const inscriptionId = jsonResponse.data.inscription_id;
      const PSBT = jsonResponse.data.PSBT;
      setInscriptionId(inscriptionId);
      setPSBTbutton(PSBT);
    } else if (response.status === 404) {
      setStatusMessage("Not eligible");
    } else if (response.status === 500) {
      setStatusMessage("Unauthorized");
    }
  };
  const ordinalsImagesUrl = "https://ordapi.xyz/content/";

  useEffect(() => {
    const fetchInscriptionImage = async () => {
      if (inscriptionId) {
        setIsImageLoaded(false);
        const imageUrl = `${ordinalsImagesUrl}${inscriptionId}`;
        setInscriptionImage(imageUrl);
      }
    };
    fetchInscriptionImage();
  }, [inscriptionId]);

  const renderInscriptionContent = () => {
    if (inscriptionImage) {
      return (
        <img
        src={inscriptionImage}
        alt="Inscription"
        style={{ width: "100%", height: "auto", display: isImageLoaded ? "block" : "none" }}
        onLoad={() => {
          setIsImageLoaded(true);
        }}
        onError={async () => {
            try {
              const response = await fetch(`${ordinalsImagesUrl}${inscriptionId}`);
              if (response.ok) {
                const jsonResponse = await response.json();
                setInscriptionJson(jsonResponse);
                setInscriptionImage(null);
              }
            } catch (error) {
              console.error("Failed to fetch JSON content:", error);
            }
          }}
        />
      );
    } else if (inscriptionJson) {
      return (
        <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: 200, overflowY: "auto" }}>
          {JSON.stringify(inscriptionJson, null, 2)}
        </pre>
      );
    }
  };
  return (
    <>
      {!inscriptionId && statusMessage === "" && txid ==="" && (
      <Card size="small" className="card-container" style={{border: 'none', width: 300, marginTop: 350, marginLeft: 440, position: 'fixed', top: '100px', left: '50px' }}>
        <div style={{ textAlign: "left", marginTop: 10 }}>
          <div style={{ fontWeight: "bold" }}>Sign Message to claim:</div>
          <Input
            className="retro-input"
            disabled
            defaultValue={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          ></Input>
        </div>

        <Button
          className="retro-button"
          style={{ marginTop: 10 }}
          onClick={async () => {
            const signature = await (window as any).unisat.signMessage(message, "bip322-simple");
            setSignature(signature);
            claimDrop(signature);
          }}
        >
          Claim ZBIT
        </Button>
      </Card>
      )}
      {inscriptionId && txid ==="" && (
      
      
       <Card size="small" className="card-container" style={{border: 'none', width: 300, marginTop: 320, marginLeft: 440, position: 'fixed', top: '100px', left: '50px' }}>
     
       <div style={{ textAlign: "left", marginTop: 10 }}>
         <div style={{ fontWeight: "bold" }}>InscriptionId:</div>
         <div style={{ wordWrap: "break-word" }}>{inscriptionId}</div>
       </div>
       <div style={{ marginTop: 10 }}>{renderInscriptionContent()}</div>
       {PSBT && (
            <Button
              className="retro-button"
              style={{ marginTop: 10 }}
              onClick={async () => {
                try {
                  const psbtResult = await (window as any).unisat.signPsbt(PSBT);
                  console.log("Signed PSBT:", psbtResult);
                  const txid = await (window as any).unisat.pushPsbt(psbtResult);
                  setTxid(txid);
    
                } catch (e) {
                  setTxid((e as any).message);
                }
              }}
            >
              Sign Psbt
            </Button>
          )}
     </Card>
      )} 
      {statusMessage === "Not eligible" && (
        <Card size="small" className="card-container" style={{border: 'none', width: 300, marginTop: 350, marginLeft: 440, position: 'fixed', top: '100px', left: '50px' }} >
       <h3>Address not eligble</h3>
        </Card>
      )}
      {statusMessage === "Unauthorized" && (
        <Card size="small"  className="card-container" style={{border: 'none', width: 300, marginTop: 350, marginLeft: 440, position: 'fixed', top: '100px', left: '50px' }} >
       <h3>Bad Signature</h3>
          </Card>
      )}
      {txid && (
        <Card size="small"  className="card-container" style={{border: 'none', width: 300, marginTop: 350, marginLeft: 440, position: 'fixed', top: '100px', left: '50px' }} >
       <h3>{txid}</h3>
          </Card>
      )}
    </>
  );
}




function SignPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [psbtResult, setPsbtResult] = useState("");
  
  return (
    <Card size="small" title="Sign Psbt" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>PsbtHex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Result:</div>
        <div style={{ wordWrap: "break-word" }}>{psbtResult}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const psbtResult = await (window as any).unisat.signPsbt(psbtHex);
            setPsbtResult(psbtResult);
          } catch (e) {
            setPsbtResult((e as any).message);
          }
        }}
      >
        Sign Psbt
      </Button>
    </Card>
  );
}

function SignMessageCard() {
  const [message, setMessage] = useState("hello world~");
  const [signature, setSignature] = useState("");
  return (
    <Card size="small" title="Sign Message" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Message:</div>
        <Input
          defaultValue={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Signature:</div>
        <div style={{ wordWrap: "break-word" }}>{signature}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
        
          const signature = await (window as any).unisat.signMessage(message);
          setSignature(signature);
        }}
      >
        Sign Message
      </Button>
    </Card>
  );
}

function PushTxCard() {
  const [rawtx, setRawtx] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card
      size="small"
      title="Push Transaction Hex"
      style={{ width: 300, margin: 10 }}
    >
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>rawtx:</div>
        <Input
          defaultValue={rawtx}
          onChange={(e) => {
            setRawtx(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushTx(rawtx);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        PushTx
      </Button>
    </Card>
  );
}

function PushPsbtCard() {
  const [psbtHex, setPsbtHex] = useState("");
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Push Psbt Hex" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>psbt hex:</div>
        <Input
          defaultValue={psbtHex}
          onChange={(e) => {
            setPsbtHex(e.target.value);
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.pushPsbt(psbtHex);
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        pushPsbt
      </Button>
    </Card>
  );
}

function SendBitcoin() {
  const [toAddress, setToAddress] = useState(
    "tb1qmfla5j7cpdvmswtruldgvjvk87yrflrfsf6hh0"
  );
  const [satoshis, setSatoshis] = useState(1000);
  const [txid, setTxid] = useState("");
  return (
    <Card size="small" title="Send Bitcoin" style={{ width: 300, margin: 10 }}>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Receiver Address:</div>
        <Input
          defaultValue={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
          }}
        ></Input>
      </div>

      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>Amount: (satoshis)</div>
        <Input
          defaultValue={satoshis}
          onChange={(e) => {
            setSatoshis(parseInt(e.target.value));
          }}
        ></Input>
      </div>
      <div style={{ textAlign: "left", marginTop: 10 }}>
        <div style={{ fontWeight: "bold" }}>txid:</div>
        <div style={{ wordWrap: "break-word" }}>{txid}</div>
      </div>
      <Button
        style={{ marginTop: 10 }}
        onClick={async () => {
          try {
            const txid = await (window as any).unisat.sendBitcoin(
              toAddress,
              satoshis
            );
            setTxid(txid);
          } catch (e) {
            setTxid((e as any).message);
          }
        }}
      >
        SendBitcoin
      </Button>
    </Card>
  );
}

export default App;
