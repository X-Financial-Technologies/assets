USDX Protocol Demo Specs

1. **Constants**
```javascript
BASE = 1e18 
USDC_REDEEM_FEE = 0.005  // Only for USDC redemption
APY = 0.05
DAILY_REBASE = (1 + APY)**(1/365) - 1
DELAY = 172800000  // 48h for USDC
```

2. **State**
```javascript
state = {
  usd: number,      // Deposits
  usdc: number,     // Redemptions
  usdx: number,     // Main token
  wusdx: number,    // Wrapped token
  shares: number,   // User shares
  totalShares: number,
  rewardMultiplier: BASE,
  paused: boolean,
  blocked: Set<string>
}
```

3. **Core Functions**
- `mint(usdAmount)`: USD→USDX 1:1, no fee
- `redeemToUSDC(usdxAmount)`: 0.5% fee, 48h delay
- `redeemToUSD(usdxAmount)`: No fee, instant
- `wrap/unwrap()`: USDX↔wUSDX
- `distributeYield()`: Daily rebase via multiplier

4. **UI Layout**
```
Balances (USD/USDX/wUSDX/USDC)
Stats (APY/Daily Yield/Shares/Multiplier)
Actions (Mint/Wrap/Redeem)
Operation Log
```

5. **Key Flows**
- KYC → USD Mint → Hold USDX
- Daily Yield via Rebase
- Optional Wrap to wUSDX
- Redeem to USD or USDC

6. **Visual Requirements**
- Clean monochrome theme
- Real-time balance updates
- Progress bar for USDC delay
- Fee calculator for USDC redemptions

7. **Critical Details**
- No mint fees anywhere
- Fee only on USDC redemptions
- Municipal bond yield (5% APY)
- Share-based accounting
- ERC4626 vault mechanics

This enables exact replication of demo functionality.