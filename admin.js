document.addEventListener('DOMContentLoaded', () => {

    // ========================
    // ADMIN ACCOUNTS
    // ========================
    const ADMINS = [
        { username: 'charles', password: 'forge2026', displayName: 'Charles', role: 'Admin', color: '#ef4444' },
        { username: 'josh', password: 'forge2026', displayName: 'Josh', role: 'Admin', color: '#3b82f6' },
        { username: 'nico', password: 'forge2026', displayName: 'Nico', role: 'Admin', color: '#8b5cf6' },
    ];

    // ========================
    // STATE
    // ========================
    let currentAdmin = null;
    let currentView = 'pending';
    let selectedTicket = null;
    let heartbeatInterval = null;

    // ========================
    // DOM REFS
    // ========================
    const loginScreen = document.getElementById('login-screen');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const app = document.getElementById('app');
    const userDisplay = document.getElementById('current-user-display');
    const onlineAdminsEl = document.getElementById('online-admins');
    const ticketsContainer = document.getElementById('tickets-container');
    const emptyState = document.getElementById('empty-state');
    const emptyStats = document.getElementById('empty-stats');
    const chatPane = document.getElementById('chat-pane');
    const chatAvatar = document.getElementById('chat-avatar');
    const chatName = document.getElementById('chat-name');
    const chatMeta = document.getElementById('chat-meta');
    const chatFeed = document.getElementById('chat-feed');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatComposer = document.getElementById('chat-composer');
    const viewPendingBtn = document.getElementById('view-pending');
    const viewAcceptedBtn = document.getElementById('view-accepted');
    const viewArchiveBtn = document.getElementById('view-archive');
    const logoutBtn = document.getElementById('logout-btn');
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsDrawer = document.getElementById('settings-drawer');
    const closeSettings = document.getElementById('close-settings');
    const clearDataBtn = document.getElementById('clear-data');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const voiceBtn = document.getElementById('voice-btn');
    const recordingOverlay = document.getElementById('recording-overlay');
    const recTimer = document.getElementById('rec-timer');
    const cancelVoice = document.getElementById('cancel-voice');
    const sendVoice = document.getElementById('send-voice');
    const adminProgressTabs = document.querySelectorAll('.progress-tab');

    adminProgressTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (!selectedTicket) return;
            const val = e.target.dataset.val;
            
            // Update UI
            adminProgressTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');

            // Save to LocalStorage
            const progressObj = JSON.parse(localStorage.getItem('forge_ticket_progress')) || {};
            progressObj[selectedTicket] = val;
            localStorage.setItem('forge_ticket_progress', JSON.stringify(progressObj));
        });
    });

    // ========================
    // LOGIN
    // ========================
    function attemptLogin() {
        const user = loginUser.value.trim().toLowerCase();
        const pass = loginPass.value;

        const account = ADMINS.find(a => a.username === user && a.password === pass);

        if (account) {
            loginBtn.classList.add('loading');
            loginBtn.innerText = 'Signing in...';
            loginError.innerText = '';

            setTimeout(() => {
                currentAdmin = account;
                sessionStorage.setItem('forge_current_admin', JSON.stringify(account));
                goOnline();
                showApp();
            }, 600);
        } else {
            loginError.innerText = 'Invalid credentials';
            loginPass.value = '';
            loginUser.style.borderColor = 'rgba(239,68,68,0.4)';
            loginPass.style.borderColor = 'rgba(239,68,68,0.4)';
            setTimeout(() => {
                loginUser.style.borderColor = '';
                loginPass.style.borderColor = '';
            }, 1500);
        }
    }

    loginBtn.addEventListener('click', attemptLogin);
    [loginUser, loginPass].forEach(input => {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') attemptLogin();
            loginError.innerText = '';
        });
    });

    // Auto-login if session exists
    const savedSession = sessionStorage.getItem('forge_current_admin');
    if (savedSession) {
        try {
            currentAdmin = JSON.parse(savedSession);
            goOnline();
            showApp();
        } catch (e) { /* ignore */ }
    }

    function showApp() {
        loginScreen.style.opacity = '0';
        loginScreen.style.transition = 'opacity 0.4s ease';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            app.style.display = 'grid';

            // Micro navigation is handled natively via setFilter IDs now


            renderAll();
        }, 400);
    }

    // ========================
    // ONLINE PRESENCE
    // ========================
    function goOnline() {
        if (!currentAdmin) return;
        const key = 'forge_admin_online_' + currentAdmin.username;
        const data = {
            username: currentAdmin.username,
            displayName: currentAdmin.displayName,
            role: currentAdmin.role,
            color: currentAdmin.color,
            lastSeen: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));

        // Heartbeat every 8s
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(() => {
            data.lastSeen = Date.now();
            localStorage.setItem(key, JSON.stringify(data));
        }, 8000);
    }

    function goOffline() {
        if (!currentAdmin) return;
        localStorage.removeItem('forge_admin_online_' + currentAdmin.username);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
    }

    function getOnlineAdmins() {
        const online = [];
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('forge_admin_online_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (now - data.lastSeen < 20000) {
                        data.isOnline = true;
                    } else {
                        data.isOnline = false;
                    }
                    online.push(data);
                } catch (e) { /* skip */ }
            }
        }
        return online;
    }

    function renderOnlineAdmins() {
        const admins = getOnlineAdmins();
        
        // Also show offline known admins
        const allAdmins = ADMINS.map(a => {
            const found = admins.find(o => o.username === a.username);
            if (found) return found;
            return {
                username: a.username,
                displayName: a.displayName,
                role: a.role,
                color: a.color,
                isOnline: false
            };
        });

        // Sort: online first, then current user first
        allAdmins.sort((a, b) => {
            if (a.username === currentAdmin.username) return -1;
            if (b.username === currentAdmin.username) return 1;
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return 0;
        });

        if (onlineAdminsEl) {
            onlineAdminsEl.innerHTML = '';
            allAdmins.forEach((admin, i) => {
                const isYou = admin.username === currentAdmin.username;
                const el = document.createElement('div');
                el.className = `story-avatar ${admin.isOnline ? 'online' : 'offline'}`;
                el.style.animationDelay = `${i * 60}ms`;
                el.title = `${admin.displayName}${isYou ? ' (You)' : ''} - ${admin.isOnline ? 'Online' : 'Offline'}`;
                el.innerHTML = `
                    <div class="story-inner" style="background: ${admin.color};">
                        ${admin.displayName.charAt(0)}
                    </div>
                `;
                onlineAdminsEl.appendChild(el);
            });
        }
    }

    // ========================
    // DATA
    // ========================
    function getData() {
        return {
            briefings: JSON.parse(localStorage.getItem('forge_briefings')) || [],
            states: JSON.parse(localStorage.getItem('forge_ticket_states')) || {},
            handlers: JSON.parse(localStorage.getItem('forge_ticket_handlers')) || {}
        };
    }

    // ========================
    // RENDER ALL
    // ========================
    function renderAll() {
        if (!currentAdmin) return;
        userDisplay.innerText = `Signed in as ${currentAdmin.displayName}`;
        renderOnlineAdmins();
        renderTickets();
        renderChat();
        updateEmptyStats();
    }

    function updateEmptyStats() {
        const { briefings } = getData();
        const vectors = new Set(briefings.map(b => b.vector));
        const onlineCount = getOnlineAdmins().filter(a => a.isOnline).length;
        emptyStats.innerText = `${vectors.size} ticket${vectors.size !== 1 ? 's' : ''} · ${onlineCount} admin${onlineCount !== 1 ? 's' : ''} online`;
    }

    // ========================
    // TICKETS
    // ========================
    const filterBtns = [viewPendingBtn, viewAcceptedBtn, viewArchiveBtn];

    function setFilter(btn, view) {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentView = view;
        renderTickets();
    }

    viewPendingBtn.addEventListener('click', () => setFilter(viewPendingBtn, 'pending'));
    viewAcceptedBtn.addEventListener('click', () => setFilter(viewAcceptedBtn, 'accepted'));
    viewArchiveBtn.addEventListener('click', () => setFilter(viewArchiveBtn, 'archived'));

    function renderTickets() {
        const { briefings, states, handlers } = getData();

        const grouped = {};
        briefings.forEach(b => {
            const vec = b.vector || 'UNKNOWN';
            if (!grouped[vec]) grouped[vec] = [];
            grouped[vec].push(b);
        });

        ticketsContainer.innerHTML = '';
        let count = 0;

        Object.keys(grouped).forEach(vector => {
            const status = states[vector] || 'pending';
            if (status === 'deleted' || status !== currentView) return;

            const currentHandler = handlers[vector];

            count++;
            const msgs = grouped[vector];
            const last = msgs[msgs.length - 1];
            const initial = vector.charAt(0).toUpperCase();
            const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
            const color = colors[vector.length % colors.length];

            const card = document.createElement('div');
            card.className = `ticket-card ${selectedTicket === vector ? 'active' : ''}`;
            card.style.animationDelay = `${count * 50}ms`;

            let actions = '';
            const isMine = currentHandler === currentAdmin.username;
            const claimBtnText = isMine ? 'Release' : (currentHandler ? 'Takeover' : 'Claim');
            const claimBtnColor = isMine ? '#9ca3af' : '#60a5fa';

            if (currentView === 'pending') {
                actions = `
                    <button class="act-accept" style="color:#3b82f6;">Accept</button>
                    ${!vector.includes('_archived_') ? `<button class="act-claim" style="color:${claimBtnColor};">${claimBtnText}</button>` : ''}
                    <button class="act-archive">Archive</button>
                    <button class="act-delete" style="color:#ef4444;">Delete</button>
                `;
            } else if (currentView === 'accepted') {
                actions = `
                    ${!vector.includes('_archived_') ? `<button class="act-claim" style="color:${claimBtnColor};">${claimBtnText}</button>` : ''}
                    <button class="act-archive">Archive</button>
                    <button class="act-delete" style="color:#ef4444;">Delete</button>
                `;
            } else {
                actions = `
                    <button class="act-restore">Restore</button>
                    <button class="act-delete" style="color:#ef4444;">Delete</button>
                `;
            }

            let displayVector = vector;
            if (vector.includes('_archived_')) {
                const dateSplit = vector.split('_archived_');
                const dateStr = new Date(parseInt(dateSplit[1])).toLocaleDateString('en-US');
                displayVector = `${dateSplit[0]} (Old: ${dateStr})`;
            }

            let handlerMini = '';
            let handledClass = '';

            if (currentHandler) {
                const hInitial = currentHandler.charAt(0).toUpperCase();
                const hColor = isMine ? '#ef4444' : '#4b5563'; // Forge Red or subtle grey
                handledClass = isMine ? 'handled-mine' : 'handled-other';
                handlerMini = `<div class="ticket-handler-mini" style="background:${hColor};">${hInitial}</div>`;
            }

            card.className = `ticket-card ${selectedTicket === vector ? 'active' : ''} ${handledClass}`;

            card.innerHTML = `
                <div class="ticket-card-avatar" style="background: ${color};">
                    ${initial}
                    ${handlerMini}
                </div>
                <div class="ticket-card-body">
                    <div class="ticket-card-name" style="font-family: var(--font-body); font-weight: bold;">
                        ${displayVector}
                    </div>
                    <div class="ticket-card-preview">${last.type === 'text' ? last.payload : (last.type === 'image' ? '📷 Image' : last.type === 'voice_real' ? '🎤 Voice' : '📎 File')}</div>
                    <div class="ticket-card-actions">${actions}</div>
                </div>
                <div class="ticket-card-meta">
                    <div class="ticket-card-time">${last.time}</div>
                    ${msgs.length > 1 ? `<div class="ticket-card-badge">${msgs.length}</div>` : ''}
                </div>
            `;

            // Click to select
            card.addEventListener('click', e => {
                if (e.target.tagName === 'BUTTON') return;
                selectedTicket = vector;
                chatInput.value = ''; // Auto-clear composer when switching
                renderTickets();
                renderChat();
            });

            // Action buttons
            const actions_wire = (selector, newState) => {
                const btn = card.querySelector(selector);
                if (btn) btn.addEventListener('click', () => {
                    states[vector] = newState;
                    localStorage.setItem('forge_ticket_states', JSON.stringify(states));
                    if (newState !== currentView && selectedTicket === vector) selectedTicket = null;
                    renderTickets();
                    renderChat();
                });
            };

            const claimBtn = card.querySelector('.act-claim');
            if(claimBtn) {
                claimBtn.addEventListener('click', () => {
                    if (isMine) {
                        delete handlers[vector];
                    } else {
                        handlers[vector] = currentAdmin.username;
                    }
                    localStorage.setItem('forge_ticket_handlers', JSON.stringify(handlers));
                    renderTickets();
                });
            }

            actions_wire('.act-accept', 'accepted');
            actions_wire('.act-archive', 'archived');
            actions_wire('.act-restore', 'pending');
            actions_wire('.act-delete', 'deleted');

            ticketsContainer.appendChild(card);
        });

        if (count === 0) {
            ticketsContainer.innerHTML = `
                <div class="ticket-empty">
                    <div class="ticket-empty-icon">◇</div>
                    <span>No ${currentView} tickets</span>
                </div>
            `;
        }
    }

    // ========================
    // CHAT
    // ========================
    function renderChat() {
        if (!selectedTicket) {
            chatPane.style.display = 'none';
            emptyState.style.display = 'flex';
            updateEmptyStats();
            return;
        }

        chatPane.style.display = 'flex';
        emptyState.style.display = 'none';

        // Header
        const initial = selectedTicket.charAt(0).toUpperCase();
        const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];
        const color = colors[selectedTicket.length % colors.length];
        chatAvatar.innerText = initial;
        chatAvatar.style.background = `linear-gradient(135deg, ${color}, ${color}88)`;
        
        let displayVector = selectedTicket;
        if (selectedTicket.includes('_archived_')) {
            const dateSplit = selectedTicket.split('_archived_');
            const dateStr = new Date(parseInt(dateSplit[1])).toLocaleDateString('en-US');
            displayVector = `${dateSplit[0]} (Old: ${dateStr})`;
        }
        chatName.innerText = displayVector;
        
        chatMeta.innerText = selectedTicket.includes('_archived_') ? 'Archived' : 'Online';

        const progressObj = JSON.parse(localStorage.getItem('forge_ticket_progress')) || {};
        const currentProgress = progressObj[selectedTicket] || "0";
        const adminProgressTabs = document.querySelectorAll('.progress-tab');
        adminProgressTabs.forEach(tab => {
            if (tab.dataset.val === currentProgress) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Messages
        const { briefings } = getData();
        const thread = briefings.filter(b => b.vector === selectedTicket);

        chatFeed.innerHTML = '';
        thread.forEach((msg, idx) => {
            const isAdmin = msg.identity !== 'COMMS_HUB_DIRECT';
            const adminName = isAdmin ? (msg.identity || 'Admin') : 'Client';

            const wrap = document.createElement('div');
            wrap.className = `msg-wrap ${isAdmin ? 'sent' : 'received'}`;
            wrap.style.animationDelay = `${Math.min(idx * 30, 500)}ms`;

            const bubbleCol = document.createElement('div');
            bubbleCol.className = `bubble-col ${isAdmin ? 'sent' : 'received'}`;

            let avatarHtml = '';
            if (!isAdmin) {
                avatarHtml = `<div class="chat-tiny-avatar" style="background: ${color};">${initial}</div>`;
            }

            const bubble = document.createElement('div');
            bubble.className = `bubble ${isAdmin ? 'sent' : 'received'}`;

            if (msg.type === 'image') {
                bubble.innerHTML = `<img src="${msg.payload}" style="max-width:100%;border-radius:10px;display:block;" alt="Image">`;
            } else if (msg.type === 'file') {
                bubble.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:1.2rem;">📎</span>
                        <div>
                            <div style="font-weight:600;font-size:0.78rem;">${msg.filename}</div>
                            <div style="font-size:0.62rem;opacity:0.5;">${msg.size}</div>
                        </div>
                    </div>`;
            } else if (msg.type === 'voice' || msg.type === 'voice_real') {
                const bars = Array(14).fill(0).map(() =>
                    `<div style="width:2px;height:${3 + Math.random() * 12}px;background:currentColor;opacity:0.35;border-radius:1px;"></div>`
                ).join('');
                bubble.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" class="voice-chip">
                        ${msg.type === 'voice_real' ? `<audio src="${msg.payload}" style="display:none;"></audio>` : ''}
                        <div class="play-icon" style="font-size:0.95rem;transition:transform 0.2s;">▶</div>
                        <div style="display:flex;gap:2px;align-items:center;">${bars}</div>
                        <span style="font-family:monospace;font-size:0.65rem;opacity:0.6;">${msg.duration || '0:00'}</span>
                    </div>`;
                if (msg.type === 'voice_real') {
                    setTimeout(() => {
                        const audio = bubble.querySelector('audio');
                        const icon = bubble.querySelector('.play-icon');
                        if (audio && icon) {
                            bubble.querySelector('.voice-chip').addEventListener('click', () => {
                                if (audio.paused) {
                                    audio.play().catch(() => {});
                                    icon.innerText = '⏸';
                                } else {
                                    audio.pause();
                                    icon.innerText = '▶';
                                }
                            });
                            audio.addEventListener('ended', () => icon.innerText = '▶');
                        }
                    }, 10);
                }
            } else {
                bubble.innerText = msg.payload;
            }

            bubbleCol.appendChild(bubble);

            // Timestamp + sender
            const meta = document.createElement('div');
            meta.className = 'msg-time';
            meta.innerText = isAdmin ? `${msg.time || ''} · ${adminName}` : msg.time || '';
            
            bubbleCol.appendChild(meta);

            if (!isAdmin) wrap.innerHTML = avatarHtml;
            wrap.appendChild(bubbleCol);

            chatFeed.appendChild(wrap);
        });

        // Typing indicator
        const typingStates = JSON.parse(localStorage.getItem('forge_typing_states')) || {};
        if (typingStates[selectedTicket]) {
            const tw = document.createElement('div');
            tw.className = 'typing-wrap';
            tw.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
            chatFeed.appendChild(tw);
        }

        requestAnimationFrame(() => {
            chatFeed.scrollTop = chatFeed.scrollHeight;
        });
    }

    // ========================
    // SEND MESSAGE
    // ========================
    function dispatch(obj) {
        if (!selectedTicket || !currentAdmin) return;
        const { briefings } = getData();
        const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
        briefings.push({
            identity: currentAdmin.displayName,
            vector: selectedTicket,
            time,
            ...obj
        });
        localStorage.setItem('forge_briefings', JSON.stringify(briefings));
        renderTickets();
        renderChat();
    }

    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !selectedTicket) return;

        sendBtn.classList.add('pop');
        setTimeout(() => sendBtn.classList.remove('pop'), 400);

        dispatch({ type: 'text', payload: text });
        chatInput.value = '';
        chatInput.focus();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendMessage();
    });

    // ========================
    // FILE ATTACHMENT
    // ========================
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const mb = (file.size / (1024 * 1024)).toFixed(2);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = ev => dispatch({ type: 'image', payload: ev.target.result });
                reader.readAsDataURL(file);
            } else {
                dispatch({ type: 'file', filename: file.name, size: mb + ' MB' });
            }
            fileInput.value = '';
        });
    }

    // ========================
    // VOICE RECORDING
    // ========================
    let voiceInterval, voiceSeconds = 0, recorder = null, audioChunks = [];

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                const reader = new FileReader();
                reader.onload = ev => dispatch({ type: 'voice_real', payload: ev.target.result, duration: recTimer.innerText });
                reader.readAsDataURL(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            return true;
        } catch {
            alert('Microphone access denied. Run on a local server to enable hardware APIs.');
            return false;
        }
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', async () => {
            if (!selectedTicket) return;
            const ok = await startRecording();
            if (!ok) return;
            chatComposer.style.display = 'none';
            recordingOverlay.style.display = 'flex';
            voiceSeconds = 0;
            recTimer.innerText = '0:00';
            audioChunks = [];
            recorder.start();
            voiceInterval = setInterval(() => {
                voiceSeconds++;
                const m = Math.floor(voiceSeconds / 60);
                const s = (voiceSeconds % 60).toString().padStart(2, '0');
                recTimer.innerText = `${m}:${s}`;
            }, 1000);
        });
    }

    if (cancelVoice) {
        cancelVoice.addEventListener('click', () => {
            clearInterval(voiceInterval);
            if (recorder && recorder.state === 'recording') {
                recorder.onstop = () => recorder.stream.getTracks().forEach(t => t.stop());
                recorder.stop();
            }
            recordingOverlay.style.display = 'none';
            chatComposer.style.display = 'flex';
        });
    }

    if (sendVoice) {
        sendVoice.addEventListener('click', () => {
            clearInterval(voiceInterval);
            recordingOverlay.style.display = 'none';
            chatComposer.style.display = 'flex';
            if (recorder && recorder.state === 'recording') recorder.stop();
        });
    }

    // ========================
    // VOICE CALL (cross-tab)
    // ========================
    const callOverlay = document.getElementById('call-overlay');
    const callStatusText = document.getElementById('call-status-text');
    const callVoiceBars = document.getElementById('call-voice-bars');
    const callControls = document.getElementById('call-controls');
    const callExtras = document.getElementById('call-extras');
    let callCtx = null, callStream = null, callFrame = null;

    async function startCallVisualizer(bars) {
        try {
            callStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            callCtx = new (window.AudioContext || window.webkitAudioContext)();
            const src = callCtx.createMediaStreamSource(callStream);
            const analyser = callCtx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            const data = new Uint8Array(analyser.frequencyBinCount);
            const barEls = bars.querySelectorAll('.bar');
            barEls.forEach(b => b.style.animation = 'none');
            (function animate() {
                if (!callCtx) return;
                analyser.getByteFrequencyData(data);
                for (let i = 0; i < Math.min(15, barEls.length); i++) {
                    let v = data[i * 2] || 10;
                    let s = Math.max(0.4, (v / 255) * 2.5);
                    if (barEls[i]) {
                        barEls[i].style.transform = `scaleY(${s})`;
                        barEls[i].style.opacity = s > 1 ? 1 : 0.7;
                    }
                }
                callFrame = requestAnimationFrame(animate);
            })();
            return true;
        } catch { return false; }
    }

    function stopCallVisualizer() {
        if (callFrame) cancelAnimationFrame(callFrame);
        if (callCtx) callCtx.close();
        if (callStream) callStream.getTracks().forEach(t => t.stop());
        callCtx = null; callStream = null; callFrame = null;
    }

    // ========================
    // SETTINGS
    // ========================
    settingsToggle.addEventListener('click', () => settingsDrawer.classList.add('open'));
    closeSettings.addEventListener('click', () => settingsDrawer.classList.remove('open'));

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('Clear all ticket data? This cannot be undone.')) {
                localStorage.removeItem('forge_briefings');
                localStorage.removeItem('forge_ticket_states');
                localStorage.removeItem('forge_typing_states');
                selectedTicket = null;
                renderAll();
            }
        });
    }

    // ========================
    // LOGOUT
    // ========================
    logoutBtn.addEventListener('click', () => {
        goOffline();
        currentAdmin = null;
        selectedTicket = null;
        sessionStorage.removeItem('forge_current_admin');

        // Glitch shutdown animation
        app.classList.add('glitch-out');
        setTimeout(() => {
            app.style.display = 'none';
            app.classList.remove('glitch-out');
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
            loginBtn.classList.remove('loading');
            loginBtn.innerText = 'Sign In';
            loginUser.value = '';
            loginPass.value = '';
            loginError.innerText = '';
            loginUser.focus();
        }, 900);
    });

    // ========================
    // CROSS-TAB SYNC
    // ========================
    window.addEventListener('storage', e => {
        if (!currentAdmin) return;

        if (e.key === 'forge_briefings' || e.key === 'forge_ticket_states' || e.key === 'forge_typing_states') {
            renderTickets();
            renderChat();
        }

        if (e.key && e.key.startsWith('forge_admin_online_')) {
            renderOnlineAdmins();
            updateEmptyStats();
        }

    });

    // Start Call from Admin perspective
    const adminCallBtn = document.getElementById('call-btn');
    if (adminCallBtn) {
        adminCallBtn.addEventListener('click', async () => {
            if (!selectedTicket) return;
            const ok = await startCallVisualizer(callVoiceBars);
            if (!ok) { alert('Mic denied'); return; }

            const callerRaw = selectedTicket.split('_')[0].toUpperCase();
            const avatarEl = document.getElementById('call-client-avatar');
            const nameEl = document.getElementById('call-client-name');
            if(avatarEl) avatarEl.innerText = callerRaw.charAt(0);
            if(nameEl) nameEl.innerText = callerRaw + ' SECTOR';

            callOverlay.style.display = 'flex';
            callStatusText.innerText = 'RINGING CLIENT...';
            callVoiceBars.style.opacity = '1';
            callExtras.style.display = 'none';

            callControls.innerHTML = `<button id="hangup-call" class="call-decline-btn">Cancel</button>`;
            
            document.getElementById('hangup-call').addEventListener('click', () => {
                stopCallVisualizer();
                localStorage.setItem('forge_call_state', JSON.stringify({ vector: selectedTicket, state: 'ended', id: Date.now() }));
                callOverlay.style.display = 'none';
            });

            localStorage.setItem('forge_call_state', JSON.stringify({ vector: selectedTicket, state: 'admin_ringing', id: Date.now() }));
        });
    }

    // Storage Event Listener for Call States
    window.addEventListener('storage', (e) => {
        // Voice call handling
        if (e.key === 'forge_call_state') {
            const callData = JSON.parse(e.newValue || '{}');
            
            // Allow ringing regardless of which ticket is active
            if (callData.state === 'ringing') {
                const callerRaw = callData.vector ? callData.vector.split('_')[0].toUpperCase() : 'UNKNOWN';
                const avatarEl = document.getElementById('call-client-avatar');
                const nameEl = document.getElementById('call-client-name');
                if(avatarEl) avatarEl.innerText = callerRaw.charAt(0);
                if(nameEl) nameEl.innerText = callerRaw + ' SECTOR';

                callOverlay.style.display = 'flex';
                callStatusText.innerText = 'INCOMING VOICE UPLINK';
                callVoiceBars.style.opacity = '0';
                callExtras.style.display = 'none';
                callControls.innerHTML = `
                    <button id="accept-call" class="call-accept-btn">Accept</button>
                    <button id="decline-call" class="call-decline-btn">Decline</button>
                `;
                document.getElementById('accept-call').addEventListener('click', async () => {
                    const ok = await startCallVisualizer(callVoiceBars);
                    if (!ok) { alert('Mic denied'); return; }
                    localStorage.setItem('forge_call_state', JSON.stringify({ vector: callData.vector, state: 'connected', id: Date.now() }));
                    callStatusText.innerText = 'VOICE UPLINK ACTIVE';
                    callVoiceBars.style.opacity = '1';
                    callExtras.style.display = 'flex';
                    callControls.innerHTML = `<button id="hangup-call" class="call-decline-btn">End Call</button>`;
                    
                    document.getElementById('hangup-call').addEventListener('click', () => {
                        stopCallVisualizer();
                        callExtras.style.display = 'none';
                        localStorage.setItem('forge_call_state', JSON.stringify({ vector: callData.vector, state: 'ended', id: Date.now() }));
                        callOverlay.style.display = 'none';
                    });

                    // Bind Mute & Speaker
                    const muteBtn = document.getElementById('call-mute-toggle');
                    const spkrBtn = document.getElementById('call-speaker-toggle');
                    if (muteBtn && !muteBtn.dataset.bound) {
                        muteBtn.dataset.bound = '1';
                        muteBtn.addEventListener('click', () => {
                            if (callStream) {
                                const audioTrack = callStream.getAudioTracks()[0];
                                if (audioTrack) {
                                    audioTrack.enabled = !audioTrack.enabled;
                                    muteBtn.style.color = audioTrack.enabled ? '' : '#ef4444';
                                }
                            }
                        });
                    }
                    if (spkrBtn && !spkrBtn.dataset.bound) {
                        spkrBtn.dataset.bound = '1';
                        spkrBtn.addEventListener('click', () => {
                            const isDeaf = spkrBtn.dataset.deaf === "1";
                            spkrBtn.dataset.deaf = isDeaf ? "0" : "1";
                            spkrBtn.style.color = isDeaf ? '' : '#ef4444';
                        });
                    }
                });
                document.getElementById('decline-call').addEventListener('click', () => {
                    stopCallVisualizer();
                    callExtras.style.display = 'none';
                    localStorage.setItem('forge_call_state', JSON.stringify({ vector: callData.vector, state: 'declined', id: Date.now() }));
                    callOverlay.style.display = 'none';
                });
            } else if (callData.state === 'connected') {
                if (callOverlay.style.display !== 'none') {
                    callStatusText.innerText = 'VOICE UPLINK ACTIVE';
                    callExtras.style.display = 'flex';
                    callControls.innerHTML = `<button id="hangup-call" class="call-decline-btn">End Call</button>`;
                    
                    document.getElementById('hangup-call').addEventListener('click', () => {
                        stopCallVisualizer();
                        callExtras.style.display = 'none';
                        localStorage.setItem('forge_call_state', JSON.stringify({ vector: callData.vector, state: 'ended', id: Date.now() }));
                        callOverlay.style.display = 'none';
                    });

                    // Bind Mute & Speaker
                    const muteBtn = document.getElementById('call-mute-toggle');
                    const spkrBtn = document.getElementById('call-speaker-toggle');
                    if (muteBtn && !muteBtn.dataset.bound) {
                        muteBtn.dataset.bound = '1';
                        muteBtn.addEventListener('click', () => {
                            if (callStream) {
                                const audioTrack = callStream.getAudioTracks()[0];
                                if (audioTrack) {
                                    audioTrack.enabled = !audioTrack.enabled;
                                    muteBtn.style.color = audioTrack.enabled ? '' : '#ef4444';
                                }
                            }
                        });
                    }
                    if (spkrBtn && !spkrBtn.dataset.bound) {
                        spkrBtn.dataset.bound = '1';
                        spkrBtn.addEventListener('click', () => {
                            const isDeaf = spkrBtn.dataset.deaf === "1";
                            spkrBtn.dataset.deaf = isDeaf ? "0" : "1";
                            spkrBtn.style.color = isDeaf ? '' : '#ef4444';
                        });
                    }
                }
            } else if (callData.state === 'ended' || callData.state === 'declined') {
                stopCallVisualizer();
                callExtras.style.display = 'none';
                callOverlay.style.display = 'none';
            }
        }
    });

    // ========================
    // PERIODIC UPDATES
    // ========================
    setInterval(() => {
        if (currentAdmin) {
            renderOnlineAdmins();
            updateEmptyStats();
        }
    }, 10000);

    // Cleanup on close
    window.addEventListener('beforeunload', () => {
        goOffline();
    });

    // Initial focus
    loginUser.focus();
});
