rewardMultiplier = (1 + APY/365)^daysElapsed * baseMultiplier

Where:
- APY = Annual yield rate from Treasury bill portfolio (e.g. 5%)
- daysElapsed = Days since last rebase 
- baseMultiplier = Previous rewardMultiplier value

Day 0:
baseMultiplier = 1.0
rewardMultiplier = 1.0

Day 1: 
rewardMultiplier = (1 + 0.05/365)^1 * 1.0 = 1.000137

Day 30:
rewardMultiplier = (1 + 0.05/365)^30 * 1 = 1.004109
