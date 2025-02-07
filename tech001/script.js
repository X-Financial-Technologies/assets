class USDXProtocol {
    constructor() {
        this.BASE = 1e18;
        this.state = {
            usdc: 10000,
            usdx: 0,
            wusdx: 0,
            shares: 0,
            totalShares: 0,
            rewardMultiplier: this.BASE,
            apy: 0.05,
            kycVerified: false,
            paused: false,
            blocked: new Set(),
            permits: new Map(),
            roles: {
                PAUSE_ROLE: true,
                BLOCKLIST_ROLE: true
            }
        };

        this.initElements();
        this.setupEvents();
        this.startRebase();
    }

    initElements() {
        this.elements = {
            usdcBalance: document.getElementById('usdcBalance'),
            usdxBalance: document.getElementById('usdxBalance'),
            wusdxBalance: document.getElementById('wusdxBalance'),
            kycBtn: document.getElementById('kycBtn'),
            mintBtn: document.getElementById('mintBtn'),
            wrapBtn: document.getElementById('wrapBtn'),
            redeemBtn: document.getElementById('redeemBtn'),
            signPermitBtn: document.getElementById('signPermitBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            unpauseBtn: document.getElementById('unpauseBtn'),
            blockAddress: document.getElementById('blockAddress'),
            blockBtn: document.getElementById('blockBtn'),
            unblockBtn: document.getElementById('unblockBtn'),
            multiplierInput: document.getElementById('multiplierInput'),
            updateMultiplierBtn: document.getElementById('updateMultiplierBtn'),
            operationLog: document.getElementById('operationLog'),
            tabs: document.querySelectorAll('.tab')
        };
    }

    setupEvents() {
        this.elements.kycBtn.addEventListener('click', () => this.kyc());
        this.elements.mintBtn.addEventListener('click', () => this.mint());
        this.elements.wrapBtn.addEventListener('click', () => this.wrap());
        this.elements.redeemBtn.addEventListener('click', () => this.redeem());
        this.elements.signPermitBtn.addEventListener('click', () => this.signPermit());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.unpauseBtn.addEventListener('click', () => this.unpause());
        this.elements.blockBtn.addEventListener('click', () => this.blockAddress());
        this.elements.unblockBtn.addEventListener('click', () => this.unblockAddress());
        this.elements.updateMultiplierBtn.addEventListener('click', () => this.updateMultiplier());
        this.elements.tabs.forEach(tab => 
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab))
        );
    }

    // Core Protocol Functions
    kyc() {
        this.state.kycVerified = true;
        this.elements.kycBtn.disabled = true;
        this.elements.mintBtn.disabled = false;
        this.log('KYC Verified');
    }

    mint() {
        const amount = 1000;
        const fee = amount * 0.0025;
        const mintAmount = amount - fee;
        const shares = (mintAmount * this.BASE) / this.state.rewardMultiplier;
        
        this.state.usdc -= amount;
        this.state.shares += shares;
        this.state.totalShares += shares;
        this.state.usdx = this.convertToTokens(this.state.shares);
        
        this.log(`Minted ${mintAmount.toFixed(2)} USDX (Fee: $${fee.toFixed(2)})`);
        this.elements.wrapBtn.disabled = false;
        this.updateDisplay();
    }

    wrap() {
        this.state.wusdx += this.state.usdx;
        this.state.usdx = 0;
        this.log(`Wrapped ${this.state.wusdx.toFixed(2)} USDX`);
        this.elements.redeemBtn.disabled = false;
        this.updateDisplay();
    }

    async redeem() {
        // Simulate 48h delay
        for(let i=0; i<=100; i+=10) {
            await new Promise(r => setTimeout(r, 100));
        }
        
        const amount = this.state.wusdx || this.state.usdx;
        const fee = amount * 0.005;
        const redeemed = amount - fee;
        
        this.state.usdc += redeemed;
        this.state.wusdx = 0;
        this.state.usdx = 0;
        this.log(`Redeemed $${redeemed.toFixed(2)} (Fee: $${fee.toFixed(2)})`);
        this.updateDisplay();
    }

    // Admin Functions
    pause() {
        this.state.paused = true;
        this.elements.pauseBtn.disabled = true;
        this.elements.unpauseBtn.disabled = false;
        this.log('Protocol paused');
    }

    unpause() {
        this.state.paused = false;
        this.elements.pauseBtn.disabled = false;
        this.elements.unpauseBtn.disabled = true;
        this.log('Protocol resumed');
    }

    blockAddress() {
        const addr = this.elements.blockAddress.value;
        this.state.blocked.add(addr);
        this.log(`Blocked address: ${addr}`);
    }

    unblockAddress() {
        const addr = this.elements.blockAddress.value;
        this.state.blocked.delete(addr);
        this.log(`Unblocked address: ${addr}`);
    }

    updateMultiplier() {
        const newMultiplier = parseFloat(this.elements.multiplierInput.value) * this.BASE;
        this.state.rewardMultiplier = newMultiplier;
        this.state.usdx = this.convertToTokens(this.state.shares);
        this.log(`Reward multiplier updated to: ${(newMultiplier/this.BASE).toFixed(6)}`);
        this.updateDisplay();
    }

    // System Functions
    startRebase() {
        setInterval(() => {
            if(this.state.paused) return;
            
            const dailyYield = (1 + this.state.apy) ** (1/365) - 1;
            const yieldShares = (this.state.usdx * dailyYield * this.BASE) / this.state.rewardMultiplier;
            
            this.state.shares += yieldShares;
            this.state.totalShares += yieldShares;
            this.state.usdx = this.convertToTokens(this.state.shares);
            
            this.log(`Daily rebase: +${(yieldShares/this.BASE * this.state.rewardMultiplier).toFixed(4)} USDX`);
            this.updateDisplay();
        }, 5000);
    }

    convertToTokens(shares) {
        return (shares * this.state.rewardMultiplier) / this.BASE;
    }

    // UI Functions
    updateDisplay() {
        this.elements.usdcBalance.textContent = this.state.usdc.toFixed(2);
        this.elements.usdxBalance.textContent = this.state.usdx.toFixed(2);
        this.elements.wusdxBalance.textContent = this.state.wusdx.toFixed(2);
    }

    log(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.elements.operationLog.prepend(entry);
    }

    switchTab(tab) {
        document.querySelectorAll('[id$="Tab"]').forEach(t => t.style.display = 'none');
        document.getElementById(`${tab}Tab`).style.display = 'block';
        this.elements.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    }

    signPermit() {
        const spender = document.getElementById('spender').value;
        const amount = parseFloat(document.getElementById('permitAmount').value);
        this.state.permits.set(spender, amount);
        this.log(`Signed permit for ${spender}: $${amount.toFixed(2)}`);
    }
}

// Initialize protocol
const protocol = new USDXProtocol();