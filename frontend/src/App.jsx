import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import.meta.env


const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ["websocket"]
});


function App() {
  const [roomID, setRoomID] = useState("");
  const [connected, setConnected] = useState(false);

  const peerRef = useRef(null);

  const fileMetaRef = useRef(null);
  const receivedBuffersRef = useRef([]);
  const receivedSizeRef = useRef(0);

  const handleIncomingData = (data) => {
    try {
      const text = new TextDecoder().decode(data);
      const meta = JSON.parse(text);

      if (meta.fileName) {
        fileMetaRef.current = meta;
        receivedBuffersRef.current = [];
        receivedSizeRef.current = 0;
        return;
      }
    } catch (err) {
    }

    if (!fileMetaRef.current) return;

    receivedBuffersRef.current.push(data);
    receivedSizeRef.current += data.byteLength;

    if (receivedSizeRef.current >= fileMetaRef.current.fileSize) {
      const blob = new Blob(receivedBuffersRef.current, {
        type: fileMetaRef.current.fileType
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileMetaRef.current.fileName;
      a.click();

      fileMetaRef.current = null;
      receivedBuffersRef.current = [];
      receivedSizeRef.current = 0;
    }
  };

  
  function createPeer(userToSignal) {
    if (peerRef.current) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ]
      }
    });


    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        callerID: socket.id,
        signal
      });
    });

    peer.on("connect", () => {
      console.log(" WebRTC Connected");
      setConnected(true);
    });

    peer.on("data", handleIncomingData);

    peer.on("error", (err) => {
      console.log("Peer Error:", err);
    });

    peer.on("close", () => {
      setConnected(false);
      peerRef.current = null;
    });

    peerRef.current = peer;
  }

  
  function addPeer(incomingSignal, callerID) {
    if (peerRef.current) return;

    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ]
      }
    });


    peer.on("signal", (signal) => {
      socket.emit("returning-signal", {
        signal,
        callerID
      });
    });

    peer.on("connect", () => {
      console.log("WebRTC Connected");
      setConnected(true);
    });

    peer.on("data", handleIncomingData);

    peer.on("error", (err) => {
      console.log("Peer Error:", err);
    });

    peer.on("close", () => {
      setConnected(false);
      peerRef.current = null;
    });

    peer.signal(incomingSignal);

    peerRef.current = peer;
  }

  
  function handleFile(e) {
    const file = e.target.files[0];

    if (!file || !peerRef.current || !peerRef.current.connected) {
      alert("Not connected yet!");
      return;
    }

    const chunkSize = 16 * 1024; 
    const reader = new FileReader();

    reader.onload = () => {
      const buffer = reader.result;
      const totalSize = buffer.byteLength;

      
      peerRef.current.send(JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: totalSize
      }));

      let offset = 0;

      while (offset < totalSize) {
        const chunk = buffer.slice(offset, offset + chunkSize);
        peerRef.current.send(chunk);
        offset += chunkSize;
      }
    };

    reader.readAsArrayBuffer(file);
  }


  
  useEffect(() => {

    socket.on("all-users", (users) => {
      if (users.length == 0) {
        console.log("Waiting for peer to join...");
      }
      else{
        createPeer(users[0]);
      }
    });

    socket.on("user-joined", (data) => {
      addPeer(data.signal, data.callerID);
    });

    socket.on("receiving-returned-signal", (data) => {
      if (peerRef.current) {
        peerRef.current.signal(data.signal);
      }
    });

    return () => {
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
    };

  }, []);

  const joinRoom = () => {
    if (!roomID) {
      alert("Enter Room ID");
      return;
    }
    socket.emit("join-room", roomID);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Browser File Share</h2>

      <h3>{connected ? "Connected " : "Waiting for peer..."}</h3>

      <input
        placeholder="Enter Room ID"
        onChange={(e) => setRoomID(e.target.value)}
      />

      <br /><br />

      <button onClick={joinRoom}>Join Room</button>

      <br /><br />

      <input type="file" onChange={handleFile} />
    </div>
  );
}

export default App;