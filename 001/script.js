class USDXProtocol {
    constructor() {
        // Constants
        this.BASE = 1e18;        // For precise calculations
        this.INIT_USD = 1000;    // Initial USD balance
        this.APR = 0.05;         // 5% annual yield
        
        // State variables
        this.state = {
            // User balances
            usdBalance: this.INIT_USD,
            usdxBalance: 0,
            wusdxBalance: 0,
            
            // Protocol state
            usdxTotalSupply: 0,
            wusdxTotalSupply: 0,
            rebaseIndex: this.BASE,    // Starts at 1.0
            lastRebaseTime: 0,
            kycVerified: false,
            
            // Token types
            isRebaseToken: true,   // vs accumulating
            
            // Prices (in USD)
            usdxPrice: 1.00,      // Always $1
            wusdxPrice: 1.00      // Changes for accumulating
        };

        this.setupElements();
        this.setupEvents();
        this.startRebaseInterval();
        this.updateDisplay();
    }

    setupElements() {
        // Balances
        this.elements = {
            usdBalance: document.getElementById('usd-balance'),
            usdxBalance: document.getElementById('usdx-balance'),
            wusdxBalance: document.getElementById('wusdx-balance'),
            
            // Supply & Price Stats
            usdxSupply: document.getElementById('usdx-supply'),
            usdxPrice: document.getElementById('usdx-price'),
            usdxMcap: document.getElementById('usdx-mcap'),
            wusdxSupply: document.getElementById('wusdx-supply'),
            wusdxPrice: document.getElementById('wusdx-price'),
            wusdxMcap: document.getElementById('wusdx-mcap'),
            
            // Protocol Status
            rebaseFactor: document.getElementById('rebase-factor'),
            yieldRate: document.getElementById('yield-rate'),
            lastRebase: document.getElementById('last-rebase'),
            
            // Buttons
            kycBtn: document.getElementById('kycBtn'),
            mintBtn: document.getElementById('mintBtn'),
            wrapBtn: document.getElementById('wrapBtn'),
            redeemBtn: document.getElementById('redeemBtn'),
            rebaseBtn: document.getElementById('rebaseBtn'),
            accumulateBtn: document.getElementById('accumulateBtn'),
            
            // Log
            log: document.getElementById('log')
        };
    }

    setupEvents() {
        this.elements.kycBtn.onclick = () => this.completeKYC();
        this.elements.mintBtn.onclick = () => this.mint(500);
        this.elements.wrapBtn.onclick = () => this.wrap();
        this.elements.redeemBtn.onclick = () => this.redeem();
        this.elements.rebaseBtn.onclick = () => this.setTokenType(true);
        this.elements.accumulateBtn.onclick = () => this.setTokenType(false);
    }

    // Core Protocol Functions

    completeKYC() {
        this.state.kycVerified = true;
        this.elements.kycBtn.disabled = true;
        this.elements.mintBtn.disabled = false;
        this.log('KYC verification completed');
    }

    mint(amount) {
        if (this.state.usdBalance >= amount) {
            // Decrease USD balance
            this.state.usdBalance -= amount;
            
            // Increase USDX balance and supply
            this.state.usdxBalance += amount;
            this.state.usdxTotalSupply += amount;
            
            this.elements.wrapBtn.disabled = false;
            this.updateDisplay();
            this.log(`Minted ${amount} USDX`);
        }
    }

    wrap() {
        if (this.state.usdxBalance > 0) {
            if (this.state.isRebaseToken) {
                // For rebase tokens, 1:1 wrapping
                this.state.wusdxBalance += this.state.usdxBalance;
                this.state.wusdxTotalSupply += this.state.usdxBalance;
            } else {
                // For accumulating tokens, convert based on price
                const wusdxAmount = this.state.usdxBalance / this.state.wusdxPrice;
                this.state.wusdxBalance += wusdxAmount;
                this.state.wusdxTotalSupply += wusdxAmount;
            }
            
            // Decrease USDX supply
            this.state.usdxTotalSupply -= this.state.usdxBalance;
            this.state.usdxBalance = 0;
            
            this.elements.redeemBtn.disabled = false;
            this.updateDisplay();
            this.log('Wrapped USDX to wUSDX');
        }
    }

    async redeem() {
        this.log('Starting redemption process (48h delay)');
        await new Promise(r => setTimeout(r, 3000));

        const redeemValue = this.calculateRedeemValue();
        
        // Return USD
        this.state.usdBalance += redeemValue;
        
        // Reduce supply
        if (this.state.isRebaseToken) {
            this.state.wusdxTotalSupply -= this.state.wusdxBalance;
        } else {
            this.state.wusdxTotalSupply -= this.state.wusdxBalance;
        }
        
        this.state.wusdxBalance = 0;
        this.updateDisplay();
        this.log(`Redeemed ${redeemValue.toFixed(2)} USD`);
    }

    // Rebase Mechanics

    calculateRebaseRate() {
        // Daily rate = (1 + APR)^(1/365) - 1
        return Math.pow(1 + this.APR, 1/365) - 1;
    }

    rebase() {
        if (this.state.wusdxTotalSupply > 0) {
            const now = Date.now();
            const timeDelta = (now - this.state.lastRebaseTime) / (24 * 60 * 60 * 1000); // in days
            
            if (this.state.isRebaseToken) {
                // Calculate new tokens to mint
                const rebaseRate = this.calculateRebaseRate();
                const newTokens = this.state.wusdxTotalSupply * rebaseRate;
                
                // Increase total supply
                this.state.wusdxTotalSupply += newTokens;
                
                // Increase user balance proportionally
                const userShare = this.state.wusdxBalance / (this.state.wusdxTotalSupply - newTokens);
                this.state.wusdxBalance += newTokens * userShare;
                
                // Update rebase index
                this.state.rebaseIndex = Math.floor(this.state.rebaseIndex * (1 + rebaseRate));
            } else {
                // For accumulating tokens, increase price
                this.state.wusdxPrice *= (1 + this.calculateRebaseRate());
            }
            
            this.state.lastRebaseTime = now;
            this.updateDisplay();
            this.log(`Rebase executed: ${this.state.isRebaseToken ? 'Supply increase' : 'Price increase'}`);
        }
    }

    startRebaseInterval() {
        // Rebase every 5 seconds for demo purposes
        setInterval(() => this.rebase(), 5000);
    }

    // Utility Functions

    calculateRedeemValue() {
        if (this.state.isRebaseToken) {
            return this.state.wusdxBalance; // 1:1 for rebase tokens
        } else {
            return this.state.wusdxBalance * this.state.wusdxPrice;
        }
    }

    setTokenType(isRebase) {
        this.state.isRebaseToken = isRebase;
        this.elements.rebaseBtn.classList.toggle('active', isRebase);
        this.elements.accumulateBtn.classList.toggle('active', !isRebase);
        this.updateDisplay();
        this.log(`Switched to ${isRebase ? 'rebase' : 'accumulating'} token type`);
    }

    updateDisplay() {
        // Update balances
        this.elements.usdBalance.textContent = this.state.usdBalance.toFixed(2);
        this.elements.usdxBalance.textContent = this.state.usdxBalance.toFixed(2);
        this.elements.wusdxBalance.textContent = this.calculateRedeemValue().toFixed(2);
        
        // Update supply stats
        this.elements.usdxSupply.textContent = this.state.usdxTotalSupply.toFixed(2);
        this.elements.usdxPrice.textContent = `$${this.state.usdxPrice.toFixed(2)}`;
        this.elements.usdxMcap.textContent = `$${(this.state.usdxTotalSupply * this.state.usdxPrice).toFixed(2)}`;
        
        // Update wUSDX stats
        this.elements.wusdxSupply.textContent = this.state.wusdxTotalSupply.toFixed(2);
        this.elements.wusdxPrice.textContent = `$${this.state.wusdxPrice.toFixed(2)}`;
        this.elements.wusdxMcap.textContent = `$${(this.state.wusdxTotalSupply * this.state.wusdxPrice).toFixed(2)}`;
        
        // Update protocol status
        this.elements.rebaseFactor.textContent = (this.state.rebaseIndex / this.BASE).toFixed(6);
        this.elements.yieldRate.textContent = `${(this.APR * 100).toFixed(2)}%`;
        this.elements.lastRebase.textContent = this.state.lastRebaseTime ? 
            new Date(this.state.lastRebaseTime).toLocaleTimeString() : '--';
    }

    log(message) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        this.elements.log.insertBefore(entry, this.elements.log.firstChild);
    }
}

// Initialize protocol
window.onload = () => new USDXProtocol();