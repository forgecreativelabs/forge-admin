const firebaseConfig = {
    apiKey: "AIzaSyBzIhO7VIz13_g_PoAz4mSioPdZrOeeKCQ",
    authDomain: "forge-3ab31.firebaseapp.com",
    databaseURL: "https://forge-3ab31-default-rtdb.firebaseio.com",
    projectId: "forge-3ab31",
    storageBucket: "forge-3ab31.firebasestorage.app",
    messagingSenderId: "146704952008",
    appId: "1:146704952008:web:8db8d8f1819b6785ad93fd",
    measurementId: "G-MTJQE35BE2"
};
  
// Initialize Firebase using the compat CDN loaded in the HTML
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================
// WebRTC Pipeline (Audio Streaming)
// ============================================

let rtcConnection = null;

// Ensure local document has an audio output node for incoming UDP streams
if (typeof document !== 'undefined' && !document.getElementById('forge-webrtc-audio')) {
    const remoteAudio = document.createElement('audio');
    remoteAudio.id = 'forge-webrtc-audio';
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);
}

const rtcConfig = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

async function buildWebRTC_Caller(vector) {
    if (rtcConnection) rtcConnection.close();
    rtcConnection = new RTCPeerConnection(rtcConfig);

    // Bind local active hardware stream to the UDP transmission pipe
    if (window.forgeActiveAudioStream) {
        window.forgeActiveAudioStream.getTracks().forEach(track => {
            rtcConnection.addTrack(track, window.forgeActiveAudioStream);
        });
    }

    rtcConnection.ontrack = (event) => {
        document.getElementById('forge-webrtc-audio').srcObject = event.streams[0];
    };

    const callDoc = db.ref('rtc/' + vector);
    await callDoc.remove(); // Flush old states

    // Share IP route candidates
    rtcConnection.onicecandidate = (event) => {
        if (event.candidate) callDoc.child('callerCandidates').push(event.candidate.toJSON());
    };

    const offer = await rtcConnection.createOffer();
    await rtcConnection.setLocalDescription(offer);
    await callDoc.child('offer').set({ type: offer.type, sdp: offer.sdp });

    // Listener for Callee's handshake answer
    callDoc.child('answer').on('value', snapshot => {
        const answer = snapshot.val();
        if (answer && !rtcConnection.currentRemoteDescription) {
            rtcConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    });

    // Listener for Callee's IP paths
    callDoc.child('calleeCandidates').on('child_added', snapshot => {
        rtcConnection.addIceCandidate(new RTCIceCandidate(snapshot.val()));
    });
}

async function buildWebRTC_Callee(vector) {
    if (rtcConnection) rtcConnection.close();
    rtcConnection = new RTCPeerConnection(rtcConfig);

    if (window.forgeActiveAudioStream) {
        window.forgeActiveAudioStream.getTracks().forEach(track => {
            rtcConnection.addTrack(track, window.forgeActiveAudioStream);
        });
    }

    rtcConnection.ontrack = (event) => {
        document.getElementById('forge-webrtc-audio').srcObject = event.streams[0];
    };

    const callDoc = db.ref('rtc/' + vector);

    rtcConnection.onicecandidate = (event) => {
        if (event.candidate) callDoc.child('calleeCandidates').push(event.candidate.toJSON());
    };

    // Grab Caller's offer
    const offerSnapshot = await callDoc.child('offer').once('value');
    const offerData = offerSnapshot.val();

    if (offerData) {
        await rtcConnection.setRemoteDescription(new RTCSessionDescription(offerData));
        const answer = await rtcConnection.createAnswer();
        await rtcConnection.setLocalDescription(answer);
        await callDoc.child('answer').set({ type: answer.type, sdp: answer.sdp });
    }

    // Listener for Caller's IP paths
    callDoc.child('callerCandidates').on('child_added', snapshot => {
        rtcConnection.addIceCandidate(new RTCIceCandidate(snapshot.val()));
    });
}

function handleWebRTC_EndCall(vector) {
    if (rtcConnection) {
        rtcConnection.close();
        rtcConnection = null;
    }
    const audioEl = document.getElementById('forge-webrtc-audio');
    if (audioEl) audioEl.srcObject = null;
    
    // Purge active Database listeners for ICE relays
    const callDoc = db.ref('rtc/' + vector);
    callDoc.child('answer').off();
    callDoc.child('calleeCandidates').off();
    callDoc.child('callerCandidates').off();
}

// ============================================
// MultiPlexer Event Bus
// ============================================

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    
    // Auto-invoke WebRTC hooks silently in the background depending on UI state clicks
    if (key === 'forge_call_state') {
        try {
            const callData = JSON.parse(value || '{}');
            if (callData.state === 'ringing' || callData.state === 'admin_ringing') {
                setTimeout(() => buildWebRTC_Caller(callData.vector), 300);
            } else if (callData.state === 'connected') {
                setTimeout(() => buildWebRTC_Callee(callData.vector), 300);
            } else if (callData.state === 'ended' || callData.state === 'declined') {
                handleWebRTC_EndCall(callData.vector);
            }
        } catch(e) {}
    }

    // Push standard UI changes to real-time network
    if (key.startsWith('forge_')) {
        db.ref('sync/' + key).set(value);
    }
};

localStorage.removeItem = function(key) {
    originalRemoveItem(key);
    if (key.startsWith('forge_')) {
        db.ref('sync/' + key).remove();
    }
};

function handleRemoteState(snapshot) {
    const key = snapshot.key;
    const value = snapshot.val();
    const oldValue = localStorage.getItem(key);
    
    if (oldValue !== value) {
        originalSetItem(key, value);
        
        // Remote Hangup WebRTC catch
        if (key === 'forge_call_state' && value) {
            try {
                const callData = JSON.parse(value);
                if (callData.state === 'ended' || callData.state === 'declined') {
                    handleWebRTC_EndCall(callData.vector);
                }
            } catch(e) {}
        }
        
        const event = new StorageEvent('storage', {
            key: key,
            newValue: value,
            oldValue: oldValue,
            storageArea: localStorage,
            url: window.location.href
        });
        window.dispatchEvent(event);
    }
}

function handleRemoteRemove(snapshot) {
    const key = snapshot.key;
    const oldValue = localStorage.getItem(key);
    if (oldValue !== null) {
        originalRemoveItem(key);
        const event = new StorageEvent('storage', {
            key: key,
            newValue: null,
            oldValue: oldValue,
            storageArea: localStorage,
            url: window.location.href
        });
        window.dispatchEvent(event);
    }
}

db.ref('sync').on('child_added', handleRemoteState);
db.ref('sync').on('child_changed', handleRemoteState);
db.ref('sync').on('child_removed', handleRemoteRemove);
