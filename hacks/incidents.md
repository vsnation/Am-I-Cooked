# Incident knowledge base — DeFi & bridge exploits

Curated metadata for the AM I COOKED? autopsy engine. **176 incidents**, ~7.5B USD lost (value at time of hack). Centralized-exchange custody hacks are intentionally excluded — this report covers on-chain DeFi protocols and bridges only.

> Amounts vary by source; treat as narrative metadata, not accounting. Addresses are research-grade (mixed exploited-contract / attacker EOA, several single-source) — **verify on a block explorer before any on-chain use.**

**Verification status (as of Jul 2026):** the 15 largest and all 2025–2026 entries were independently re-checked against Rekt.news and news sources. Known caveats to confirm before showing judges: **Humanity Protocol** (Jun 2026, ~$34M) was flagged by ZachXBT as *possibly staged*; **KelpDAO** and **Drift** ($290M / $285M) are Q2-2026 events still settling; **Force Bridge** and **Wanchain (NIGHT)** have no verbatim on-chain address yet. Everything else confirmed within ~20% of the stated figure.

## 2020

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Oct 2020 | Harvest Finance | $24M | Yield |  | partial | Flash-loan manipulation of Curve stablecoin pool price to mint cheap vault shares |
| Nov 2020 | Pickle Finance | $19.7M | Yield |  | gone | Malicious 'evil jar' with unchecked swap tricked controller into draining cDAI |
| Dec 2020 | Compounder Finance | $10.8M | Rug pull |  | gone | Hidden backdoor swapped strategy to malicious contract letting devs withdraw all funds |
| Dec 2020 | Warp Finance | $7.7M | Lending |  | partial | Flash-loan manipulation of LP-token collateral price enabled over-borrowing |
| Dec 2020 | Origin Protocol | $7M | Stablecoin |  | gone | Reentrancy via flash loan and rebasing OUSD minted excess tokens |
| Dec 2020 | Value DeFi | $6M | Yield |  | partial | Flash-loan manipulation of Curve pool oracle in MultiStables vault |
| Dec 2020 | Cover Protocol | $4M | Infra |  | returned ✓ | Blacksmith farming reward bug allowed near-infinite COVER token minting |
| Nov 2020 | Akropolis | $2M | Yield |  | gone | Reentrancy in savings pool deposit combined with flash loan drained DAI |

## 2021

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Aug 2021 | Poly Network | $611M | Bridge | yes | returned ✓ | Spoofed the cross-chain manager to authorise withdrawals - then returned every cent. |
| Dec 2021 | Vulcan Forged | $140M | Gaming/NFT |  | returned ✓ | Compromised custodial keys of 96 users drained PYR from MyForge wallets |
| Nov 2021 | BXH | $139M | DEX |  | gone | Leaked administrator key drained the cross-chain exchange's contracts |
| Nov 2021 | Cream Finance II | $130M | Lending |  | gone | Price-oracle and flash-loan manipulation. Second time. |
| Dec 2021 | BadgerDAO | $120M | Yield |  | partial | Compromised Cloudflare key injected malicious approvals into the front-end. |
| Apr 2021 | EasyFi | $80M | Lending |  | gone | Malicious MetaMask on admin machine stole seed phrase and drained EASY plus stablecoins |
| Nov 2021 | AnubisDAO | $60M | Rug pull |  | gone | Raised in ~20 hours, drained the same day. |
| Nov 2021 | bZx | $55M | Lending |  | partial | Phishing macro stole a developer's mnemonic controlling Polygon and BSC deployments |
| May 2021 | Uranium Finance | $50M | Rug pull |  | gone | Migration contract 'bug' that drained the pool. Insider. |
| Jun 2021 | PancakeBunny | $45M | Yield |  | gone | Flash-loan price manipulation of the BUNNY token. |
| Feb 2021 | Alpha Homora | $37.5M | Lending |  | gone | Rounding bug let attacker mint cyToken and repeatedly borrow from Iron Bank |
| Sep 2021 | Vee Finance | $35M | Lending |  | gone | Single Pangolin oracle price manipulated via crafted trading pairs on Avalanche |
| Sep 2021 | Cream Finance I | $34M | Lending |  | gone | Flash-loan reentrancy through the AMP token. |
| Mar 2021 | Meerkat Finance | $31M | Rug pull |  | gone | 'Hacked' one day after launch. It was the team. |
| Dec 2021 | MonoX Finance | $31M | DEX |  | gone | Self-swap of MONO token inflated its price in the swap contract, then drained pools |
| May 2021 | Spartan Protocol | $30M | DEX |  | gone | Flawed liquidity-share calculation let flash-loaned balance inflate burn redemption |
| Dec 2021 | Grim Finance | $30M | Yield |  | gone | Reentrancy in the vault deposit path. |
| Aug 2021 | Popsicle Finance | $20.7M | Yield |  | gone | Sorbetto vault failed to update reward state on share transfer, enabling repeat claims |
| Oct 2021 | Indexed Finance | $16M | Yield |  | gone | Flash loans skewed index-pool valuation to mint and redeem tokens cheaply |
| Feb 2021 | Furucombo | $14M | Infra |  | gone | 'Evil contract' impersonating Aave v2 proxy abused unvalidated user approvals |
| Sep 2021 | pNetwork | $12M | Bridge | yes | gone | Improper peg-out event-log validation let forged requests release 277 BTC |
| May 2021 | Rari Capital | $11M | Yield |  | gone | Manipulated Alpha ibETH exchange rate to drain Fuse ETH pool via reentrancy |
| Aug 2021 | Punk Protocol | $8.9M | Yield |  | partial | Uninitialized contract let delegatecall reset forge address for arbitrary withdrawal |
| Dec 2021 | Visor Finance | $8.2M | Yield |  | gone | Access-control flaw in staking contract allowed arbitrary VISR minting |
| Jul 2021 | ChainSwap | $8M | Bridge | yes | gone | Cross-chain mint quota logic let non-whitelisted addresses mint and drain tokens |
| Jul 2021 | THORChain | $8M | Bridge | yes | partial | Forged deposit spoofing the ETH Bifrost router tricked node into releasing funds |
| Jul 2021 | Anyswap | $7.9M | Bridge | yes | gone | Reused ECDSA R-value across signatures exposed the MPC account private key |
| May 2021 | Belt Finance | $6.3M | Yield |  | gone | Flash-loan imbalance of multi-strategy vault let attacker withdraw excess |
| Apr 2021 | Roll | $5.7M | Wallet/keys |  | gone | Hot wallet private key compromise drained social/creator token reserves |
| Mar 2021 | DODO | $3.8M | DEX |  | partial | Uninitialized pool init function reused to spoof tokens and drain via flash loan |
| Nov 2021 | Squid Game token | $3.3M | Rug pull |  | gone | Honeypot: buyers couldn't sell, devs cashed out. |
| Mar 2021 | PAID Network | $3M | Infra |  | gone | Leaked deployer key used to mint and dump PAID tokens in infinite-mint attack |

## 2022

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Apr 2022 | Ronin | $625M | Bridge | yes | partial | Five of nine validator keys socially-engineered by Lazarus. |
| Feb 2022 | Wormhole | $325M | Bridge | yes | returned ✓ | Signature-verification bypass spoofed a guardian. Jump Crypto refilled it. |
| Aug 2022 | Nomad | $190M | Bridge | yes | partial | An init bug marked every message 'proven' - a free-for-all anyone could copy-paste. |
| Apr 2022 | Beanstalk | $182M | Stablecoin |  | gone | Flash-loan governance attack - passed its own malicious proposal. |
| Sep 2022 | Wintermute | $160M | Wallet/keys |  | gone | Vanity address from the Profanity generator had guessable keys. |
| Oct 2022 | Mango Markets | $114M | Perps |  | partial | Pumped the MNGO oracle to borrow against inflated collateral. |
| Jun 2022 | Maiar DEX (MultiversX) | $113M | DEX |  | returned ✓ | Smart contract bug let attacker mint and withdraw 1.65M EGLD from DEX pools |
| Jul 2022 | Harmony Horizon | $100M | Bridge | yes | gone | Two of five multisig keys compromised. |
| Oct 2022 | BNB Chain Bridge | $100M | Bridge | yes | partial | Forged an IAVL merkle proof and minted 2M BNB; validators froze most. |
| Feb 2022 | Qubit (QBridge) | $80M | Bridge | yes | gone | Deposit logic minted wrapped ETH with no deposit. |
| May 2022 | Rari / Fei (Fuse) | $80M | Lending |  | gone | Reentrancy in the Fuse lending pools. |
| Mar 2022 | Cashio | $52.8M | Stablecoin |  | partial | Missing collateral validation enabled infinite mint of CASH from valueless tokens |
| Oct 2022 | Transit Swap | $23M | DEX |  | partial | Missing input validation in claimTokens let attacker drain user-approved tokens |
| Apr 2022 | Inverse Finance | $15.6M | Lending |  | gone | Flash-loan manipulated INV price oracle to borrow DOLA against inflated collateral |
| Dec 2022 | Helio Protocol | $15M | Lending |  | partial | Borrowed HAY against aBNBc priced by stale oracle after Ankr mint exploit |
| Oct 2022 | Team Finance | $14.5M | Infra |  | partial | Flawed v2-to-v3 migration function let attacker drain locked liquidity |
| May 2022 | Deus DAO | $13.4M | Lending |  | gone | Flash-loan manipulated DEI/USDC oracle to over-borrow against inflated collateral |
| May 2022 | Saddle Finance | $11.9M | DEX |  | partial | Wrong swap library math let flash-loan attacker drain sUSDv2 metapool |
| Apr 2022 | Elephant Money | $11.2M | Stablecoin |  | gone | Flash-loan pumped ELEPHANT price to repeatedly mint and redeem TRUNK |
| Oct 2022 | Moola Market | $9.1M | Lending |  | partial | Manipulated low-liquidity MOO price to over-borrow against inflated collateral |
| Jul 2022 | Crema Finance | $8.8M | DEX |  | partial | Fake tick account bypassed checks to drain concentrated liquidity via flash loan |
| Dec 2022 | BitKeep | $8M | Wallet/keys |  | returned ✓ | Hijacked malicious Android APK stole users' private keys |
| Aug 2022 | Audius | $6M | Governance |  | gone | Malformed governance proposal initialisation. |
| Jun 2022 | Osmosis | $5M | DEX |  | partial | JoinPool logic bug paid liquidity providers 50% extra on withdrawal |
| Dec 2022 | Ankr | $5M | Yield |  | partial | Compromised deployer key let attacker infinite-mint aBNBc staking token |
| Apr 2022 | Voltage Finance | $4.7M | Lending |  | gone | ERC677 callback reentrancy drained lending pool via flash loan |
| Nov 2022 | pGALA | $4.5M | Gaming/NFT |  | returned ✓ | pGALA contract ownership takeover from leaked key allowed unlimited mint and dump |
| Mar 2022 | Meter.io | $4.4M | Bridge | yes | partial | Flawed mint in the deposit wrapper. |
| Aug 2022 | Slope Wallet | $4.1M | Wallet/keys |  | gone | Mobile wallet leaked users' private keys to a third-party logging service |
| Jun 2022 | XCarnival | $3.8M | NFT |  | partial | Reused a withdrawn BAYC NFT as collateral to take multiple loans |
| Jul 2022 | Nirvana Finance | $3.5M | Stablecoin |  | gone | Flash loan manipulated ANA price to mint and redeem against protocol reserves |
| May 2022 | Fortress Protocol | $3M | Lending |  | gone | Oracle and governance manipulation inflated FTS collateral to drain lending pools |
| Jun 2022 | GYM Network | $2.1M | Yield |  | gone | Unauthenticated depositFromOtherContract let attacker fake deposits and withdraw |
| Apr 2022 | Revest Finance | $2M | Yield |  | gone | ERC1155 reentrancy during FNFT minting drained token reserves |
| Oct 2022 | QANplatform Bridge | $2M | Bridge | yes | gone | Profanity vanity-address flaw exposed deployer key, draining the bridge |
| Dec 2022 | Rubic | $1.4M | DEX |  | gone | Misconfigured router address let attacker withdraw users' approved USDC |
| Nov 2022 | Solend | $1.3M | Lending |  | gone | Manipulated USDH oracle price to borrow and drain isolated lending pools |
| Sep 2022 | Nereus Finance | $370K | Lending |  | gone | Flash-loan manipulated Trader Joe AVAX/USDC LP price to mint NXUSD |
| Oct 2022 | Olympus DAO | $300K | Yield |  | returned ✓ | Bond teller redeem function lacked input validation, allowing token drain |

## 2023

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Oct 2023 | Mixin Network | $200M | Infra |  | gone | Cloud database compromise. |
| Mar 2023 | Euler Finance | $197M | Lending |  | returned ✓ | donateToReserve imbalance enabled self-liquidation - attacker returned it all with an apology. |
| Jul 2023 | Multichain | $130M | Bridge | yes | gone | Keys lost with the arrested CEO. Funds vanished. |
| Feb 2023 | BonqDAO | $120M | Lending |  | gone | Tellor oracle manipulated to inflate WALBT collateral and mint excess BEUR |
| Jun 2023 | Atomic Wallet | $100M | Wallet/keys |  | partial | Mass drain of 4,100+ user wallets; suspected key/seed compromise, linked to Lazarus |
| Nov 2023 | HTX / Heco Bridge | $87M | Bridge | yes | gone | Operator keys compromised in the Justin Sun ecosystem. |
| Aug 2023 | Curve (Vyper) | $73M | DEX |  | partial | A broken reentrancy lock in three Vyper compiler versions. |
| Jul 2023 | Alphapo | $60M | Infra |  | gone | Payment-processor hot wallets on ETH, BTC and TRON drained via key compromise (Lazarus) |
| Dec 2023 | KyberSwap | $47M | DEX |  | gone | Tick/precision math in concentrated liquidity. |
| Sep 2023 | Stake.com | $41M | Gaming/NFT |  | gone | Unauthorized hot-wallet withdrawals on ETH, BSC and Polygon via key compromise (Lazarus) |
| Jul 2023 | CoinsPaid | $37.3M | Infra |  | gone | Employee lured by fake job offer installed malware enabling hot-wallet theft (Lazarus) |
| Nov 2023 | Kronos Research | $26M | Infra |  | gone | Compromised API keys used to drain roughly 13,000 ETH from trading accounts |
| Apr 2023 | MEV Bots (0xbad) | $25M | Infra |  | gone | Rogue Ethereum validator reordered a bait block to seize sandwich-bot transactions |
| Sep 2023 | Exactly Protocol | $12M | Lending |  | gone | Missing market-address validation on Optimism. |
| Apr 2023 | Yearn Finance | $11.5M | Yield |  | gone | Misconfigured legacy yUSDT vault (wrong iToken) let attacker mint and drain stablecoins |
| Mar 2023 | SafeMoon | $8.9M | DEX |  | partial | Public burn function bug let attacker inflate SFM price and drain WBNB from the pool |
| Feb 2023 | Platypus I | $8.5M | Stablecoin |  | partial | Logic error in the solvency check. |
| May 2023 | Jimbos Protocol | $7.5M | DEX |  | gone | Missing slippage control let attacker imbalance pool and extract ETH via shift/swap |
| Apr 2023 | Hundred Finance | $7M | Lending |  | gone | Compound-v2-fork rounding on an empty market. |
| May 2023 | Deus DAO (2023) | $6.5M | Stablecoin |  | partial | burnFrom parameter-order bug exposed user approvals, enabling DEI theft |
| Feb 2023 | dForce | $3.6M | Lending |  | returned ✓ | Read-only reentrancy via Curve oracle integration on Arbitrum and Optimism |
| Jul 2023 | EraLend | $3.4M | Lending |  | gone | Read-only reentrancy in SyncSwap-derived code manipulated internal oracle to over-borrow |
| Aug 2023 | Conic Finance | $3.3M | Yield |  | gone | Read-only reentrancy on a Curve LP. Shut down a year later. |
| Nov 2023 | Raft | $3.3M | Stablecoin |  | partial | Rounding on liquidation - the hacker lost money on it. |
| May 2023 | Swaprum | $3M | Rug pull |  | gone | Developers used hidden add() backdoor to drain staked LP tokens; exit scam |
| Oct 2023 | Platypus II | $2.2M | Stablecoin |  | partial | Same bug class, third time in one year. |
| Nov 2023 | Onyx Protocol | $2.1M | Lending |  | gone | Empty-market rounding bug in a Compound V2 fork exploited via donation on oPEPE |
| Feb 2023 | Hope Finance | $2M | Rug pull |  | gone | Attacker altered TradingHelper contract to redirect and drain genesis funds; exit scam |
| Apr 2023 | Merlin DEX | $1.8M | Rug pull |  | partial | Insider used privileged access to drain liquidity pools during token sale; rug pull |
| Mar 2023 | Tender.fi | $1.6M | Lending |  | partial | Misconfigured oracle let attacker borrow against 1 GMX; white hat returned most |
| May 2023 | Level Finance | $1.1M | Perps |  | gone | Referral contract bug allowed repeated claims in one epoch to mint excess LVL |
| Aug 2023 | Steadefi | $1.1M | Yield |  | gone | Compromised deployer key. |
| Apr 2023 | Sentiment | $1M | Lending |  | partial | Read-only reentrancy via Balancer integration used to over-borrow and drain funds |
| Jul 2023 | Palmswap | $900K | Perps |  | partial | Flash-loan price manipulation of PLP mint/redeem rate in PlpManager |
| Jun 2023 | Sturdy Finance | $800K | Lending |  | returned ✓ | Read-only reentrancy via a stale oracle read. |
| Jun 2023 | Themis Protocol | $370K | Lending |  | gone | Balancer LP-token oracle manipulated via flash loan to over-borrow on Arbitrum |
| Jun 2023 | Cellframe Network | $76K | DEX |  | gone | Flash-loan token-quantity miscalculation during liquidity migration drained the pool |

## 2024

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Feb 2024 | PlayDapp | $290M | Gaming/NFT |  | gone | Private key gave 1.6B unauthorised PLA tokens minted. |
| Jan 2024 | Orbit Bridge | $81.5M | Bridge | yes | gone | Multisig signers compromised on New Year's Eve. |
| Apr 2024 | Munchables | $62.5M | Gaming/NFT |  | returned ✓ | Rogue insider developer - returned the keys. |
| Oct 2024 | Radiant Capital | $50M | Lending |  | gone | Malware on multisig signers' devices. |
| Oct 2024 | Penpie | $27M | Yield |  | gone | Reentrancy in reward accounting. |
| Nov 2024 | Thala | $25.5M | Yield |  | returned ✓ | Missing withdrawal validation in a v1 farming update let attacker pull LP tokens |
| May 2024 | Gala Games | $21.8M | Gaming/NFT |  | returned ✓ | Compromised minter key minted 5B GALA; attacker sold 592M for ~$21.8M in ETH |
| Jun 2024 | Sonne Finance | $20M | Lending |  | gone | Compound-v2-fork empty-market donation attack. |
| Jun 2024 | UwU Lend | $19.4M | Lending |  | partial | Oracle manipulation via Curve pools distorted sUSDe price to drain lending pools |
| Mar 2024 | Curio | $16M | Governance |  | gone | Voting-power flaw let attacker delegatecall-mint ~1B CGT governance tokens |
| Jun 2024 | Holograph | $14.4M | Infra |  | gone | Former contractor exploited a mint flaw to issue 1B HLG tokens in nine transactions |
| Aug 2024 | Ronin Bridge (2024) | $12M | Bridge | yes | returned ✓ | Unset withdrawal threshold after an upgrade let an MEV bot pull 3,996 ETH and 2M USDC |
| Mar 2024 | Prisma Finance | $11.6M | Lending |  | partial | MigrateTroveZap lacked input validation, letting attacker drain trove collateral |
| Jul 2024 | LI.FI | $11.6M | Bridge | yes | gone | Malicious call in a new GasZip facet drained wallets holding infinite token approvals |
| Mar 2024 | WOOFi | $8.8M | DEX |  | gone | Flash-loan manipulation of sPMM oracle crashed WOO price, enabling cheap swaps |
| Jul 2024 | Bittensor | $8M | Infra |  | gone | Malicious PyPI package stole unencrypted coldkeys, draining ~32,000 TAO |
| Jul 2024 | Rho Markets | $7.6M | Lending |  | returned ✓ | Oracle misconfiguration on Scroll let a whitehat drain USDC/USDT pools; returned |
| Jun 2024 | Velocore | $6.8M | DEX |  | gone | Faulty fee-multiplier logic drained pools via simulated large withdrawals |
| Feb 2024 | Abracadabra | $6.5M | Stablecoin |  | gone | Cauldron interest/rounding manipulation let attacker mint MIM without collateral |
| Feb 2024 | Seneca | $6.4M | Stablecoin |  | partial | Arbitrary external call in Chamber let attacker transferFrom approved user funds |
| Sep 2024 | DeltaPrime (Arbitrum) | $6M | Lending |  | gone | Stolen admin key used to upgrade Arbitrum pool contracts and drain stablecoins |
| Sep 2024 | Shezmu | $4.9M | Stablecoin |  | partial | Vault flaw allowed unauthorized ShezUSD minting without collateral |
| Nov 2024 | DeltaPrime (reward) | $4.8M | Lending |  | gone | Missing validation in reward-claim let attacker use a malicious pair on two chains |
| Oct 2024 | Tapioca DAO | $4.4M | Stablecoin |  | partial | Compromised key took over vesting and USDO contracts; USDO/USDC pool drained |
| May 2024 | Alex Lab | $4.3M | Bridge | yes | gone | Private-key compromise of the XLink bridge drained stablecoins; tied to Lazarus |
| Sep 2024 | Onyx Protocol (2024) | $3.8M | Lending |  | gone | Compound v2 fork precision bug plus NFTLiquidation flaw exploited via flash loan |
| Sep 2024 | Banana Gun | $3M | Wallet/keys |  | returned ✓ | Telegram message-oracle bug let attackers transfer ETH from bot users' wallets |
| Mar 2024 | Unizen | $2.1M | DEX |  | partial | Insecure external call in the aggregation contract after a gas-optimization upgrade |
| Apr 2024 | Grand Base | $2M | Rug pull |  | gone | Deployer wallet compromised, draining ~615 ETH of liquidity from the RWA platform |
| Apr 2024 | Pike Finance | $2.0M | Lending |  | gone | Access-control flaw and broken memory mapping after an upgrade drained three chains |
| May 2024 | Pump.fun | $1.9M | Infra |  | gone | Former employee used privileged access and flash loans to exploit the bonding curve |

## 2025

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| May 2025 | Cetus Protocol | $223M | DEX |  | partial | Spoof-token deposits plus integer overflow in liquidity math manipulated pool pricing on Sui |
| Nov 2025 | Balancer V2 | $128M | DEX |  | gone | Rounding error in ComposableStablePool invariant math enabled value extraction |
| Apr 2025 | UPCX | $70M | Infra |  | gone | Malicious smart-contract upgrade pushed from a compromised admin private key |
| Feb 2025 | Infini | $49.5M | Stablecoin |  | gone | Overlooked developer admin privilege allowed unauthorized fund drainage |
| Jul 2025 | GMX | $42M | Perps |  | partial | Reentrancy in GMX V1 GLP pool allowed repeated withdrawals; most returned for bounty |
| Mar 2025 | Abracadabra Money | $13M | Lending |  | gone | Cauldron vulnerability let attacker drain 6,260 ETH from the protocol |
| May 2025 | Cork Protocol | $12M | Yield |  | gone | Access-control flaw in a Uniswap V4 hook let attacker split and seize market assets |
| Feb 2025 | zkLend | $9.6M | Lending |  | gone | Decimal-precision rounding flaw in the Starknet lending contract drained funds |
| Feb 2025 | Ionic Money | $8.6M | Lending |  | gone | Social engineering listed a fake LBTC token as collateral to borrow and drain vaults |
| Mar 2025 | Zoth | $8.4M | Yield |  | gone | Compromised deployer key allowed a malicious proxy upgrade on the RWA restaking layer |
| Sep 2025 | Bunni | $8.4M | DEX |  | gone | Flash-loan attack on a rounding bug in withdrawal/rebalancing on Ethereum and Unichain |
| Apr 2025 | KiloEx | $7.5M | Perps |  | partial | Price oracle manipulation drained the vault; ~90% later returned via bounty |
| Apr 2025 | Loopscale | $5.8M | Lending |  | returned ✓ | RateX PT token pricing manipulated to drain USDC and SOL vaults; returned for bounty |
| Mar 2025 | 1inch (Fusion) | $5M | DEX |  | returned ✓ | Fusion v1 calldata-corruption bug in resolver contracts exploited; funds returned |
| Jun 2025 | Force Bridge | $3.8M | Bridge | yes | gone | Access-control issue let attacker drain assets on ETH and BSC |
| Sep 2025 | Nemo Protocol | $2.4M | Yield |  | gone | Contract vulnerability drained USDC on Sui, bridged to Ethereum via Circle |
| Sep 2025 | Shibarium bridge | $2.4M | Bridge | yes | partial | Flash loan seized 10/12 validator signing keys to move ETH and SHIB off the bridge |

## 2026

| Date | Target | $ | Type | Bridge | Recovered | Vector |
|---|---|--:|---|:-:|---|---|
| Apr 2026 | KelpDAO | $290M | Bridge | yes | gone | LayerZero 1-of-1 DVN compromised via RPC attack; phantom burn minted 116.5k rsETH |
| Apr 2026 | Drift Protocol | $285M | Perps |  | gone | Durable-nonce pre-signing tricked council into admin handover; fake CVT drained vaults |
| Jun 2026 | Humanity Protocol | $34M | Infra |  | gone | Foundation key theft; ZachXBT flagged the incident as possibly staged |
| Jan 2026 | Truebit | $26.2M | Infra |  | gone | Integer overflow in legacy token-purchase math wrapped TRU mint price to near zero |
| Mar 2026 | Resolv | $25M | Stablecoin |  | gone | Logic/oracle flaw exploited to extract value from the protocol |
| Aug 2026 | AFX Trade | $24M | Perps | yes | gone | Validator signing keys compromised; USDC bridged out to ETH. |
| Aug 2026 | Wanchain (NIGHT) | $10M | Bridge | yes | gone | Non-injective signed-message encoding flaw in the TreasuryCheck validator. |
| Aug 2026 | Verus - Ethereum | $7.5M | Bridge | yes | gone | Missing validation minted more on Ethereum than was backed - a repeat of May. |
| Feb 2026 | IoTeX ioTube | $4.4M | Bridge | yes | gone | Compromised private key drained the TokenSafe contract on the Ethereum side |
| Aug 2026 | BSquared Network | $3.9M | Bridge | yes | gone | 8.59M B2 tokens drained. |
| Feb 2026 | CrossCurve | $3M | Bridge | yes | gone | Weak access controls allowed spoofed Axelar messages to release tokens |
| Aug 2026 | Allbridge Core | $1.6M | Bridge | yes | partial | Flash-loan on a single pool the Solana fix missed. |

## Verified addresses (research-grade — confirm on explorer)

| Target | Chain | Kind | Address | Source |
|---|---|---|---|---|
| Harvest Finance | ethereum | attacker | `0xf224ab004461540778a914ea397c589b677e27bb` | rekt.news |
| ChainSwap | ethereum | attacker | `0xEda5066780dE29D00dfb54581A707ef6F52D8113` | rekt.news |
| Anyswap | bsc | attacker | `0x0aE1554860E51844B61AE20823eF1268C3949f7C` | rekt.news |
| THORChain | ethereum | attacker | `0xace2d948fC7ea3Bc49eEE5526786d66d19BC470e` | etherscan.io |
| Poly Network | ethereum | attacker | `0xC8a65Fadf0e0dDAf421F28FEAb69Bf6E2E589963` | x.com/PolyNetwork2 |
| pNetwork | bsc | attacker | `0x2bf5693dd3a5cea1139c4510fdce120cf042c934` | medium.com/pnetwork |
| Cream Finance II | ethereum | attacker | `0x24354d31bc9d90f62fe5f2454709c32049cf866b` | etherscan.io |
| bZx | ethereum | attacker | `0x74487eed1e67f4787e8c0570e8d5d168a05254d4` | rekt.news |
| BadgerDAO | ethereum | attacker | `0x1fcdb04d0c5364fbd92c73ca8af9baa72c269107` | etherscan.io |
| Qubit (QBridge) | bsc | attacker | `0xd01ae1a708614948b2b5e0b7ab5be6afa01325c7` | halborn.com |
| Wormhole | ethereum | attacker | `0x629e7Da20197a5429d30da36E77d06CdF796b71A` | immunebytes.com |
| Meter.io | ethereum | attacker | `0x8d3d13cac607B7297Ff61A5E1E71072758AF4D01` | halborn.com |
| Ronin | ethereum | attacker | `0x098b716b8aaf21512996dc57eb0615e2383e2f96` | etherscan.io |
| Beanstalk | ethereum | contract | `0x1c5dcdd006ea78a7e4783f9e6021c32935a10fb4` | certik.com |
| Harmony Horizon | ethereum | attacker | `0x0d043128146654c7683fbf30ac98d7b2285ded00` | medium.com/harmony-one |
| Nomad | ethereum | contract | `0x88a69b4e698a4b090df6cf5bd7b2d47325ad30a3` | etherscan.io |
| Wintermute | ethereum | attacker | `0xe74b28c2eae8679e3ccc3a94d5d0de83ccb84705` | etherscan.io |
| BNB Chain Bridge | bsc | attacker | `0x489a8756c18c0b8b24ec2a2b9ff3d4d447f79bec` | halborn.com |
| Mango Markets | solana | attacker | `yUJw9a2PyoqKkH47i4yEGf4WXomSHMiK7Lp29Xs2NqM` | rekt.news |
| Platypus I | avalanche | attacker | `0xeff003d64046a6f521ba31f39405cb720e953958` | rekt.news |
| Euler Finance | ethereum | attacker | `0xb2698c2d99ad2c302a95a8db26b08d17a77cedd4` | etherscan.io |
| Multichain | ethereum | contract | `0x5cbe98480a790554403694b98bff71a525907f5d` | etherscan.io |
| Curve (Vyper) | ethereum | attacker | `0xdce5d6b41c32f578f875efffc0d422c57a75d7d8` | etherscan.io |
| HTX / Heco Bridge | ethereum | contract | `0xa929022c9107643515f5c777ce9a910f0d1e490c` | rekt.news |
| KyberSwap | ethereum | attacker | `0x50275e0b7261559ce1644014d4b78d4aa63be836` | etherscan.io |
| Orbit Bridge | ethereum | attacker | `0x27e2cc59a64d705a6c3d3d306186c2a55dcd5710` | beosin.com |
| WOOFi | arbitrum | attacker | `0x9961190b258897bca7a12b8f37f415e689d281c4` | rekt.news |
| Alex Lab | bsc | attacker | `0x27055aE433E9DCb30f6EbCC1A374Cf5CC03C484E` | rekt.news |
| UwU Lend | ethereum | attacker | `0x841ddf093f5188989fa1524e7b893de64b421f47` | etherscan.io |
| LI.FI | ethereum | contract | `0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae` | solidityscan.com |
| Ronin Bridge (2024) | ethereum | contract | `0x64192819ac13ef72bf6b5ae239ac672b43a9af08` | threesigma.xyz |
| Radiant Capital | arbitrum | contract | `0x57ba8957ed2ff2e7ae38f4935451e81ce1eefbf5` | rekt.news |
| zkLend | starknet | attacker | `0x04d7191dc8eac499bac710dd368706e3ce76c9945da52535de770d06ce7d3b26` | rekt.news |
| Cetus Protocol | sui | attacker | `0xe28b50cef1d633ea43d3296a3f6b67ff0312a5f1a99f0af753c85b8b5de8ff06` | slowmist |
| Shibarium bridge | ethereum | attacker | `0x999E025a2a0558c07DBf7F021b2C9852B367e80A` | rekt.news |
| Balancer V2 | ethereum | attacker | `0xaa760d53541d8390074c61defeaba314675b8e3f` | etherscan.io |
| IoTeX ioTube | ethereum | attacker | `0x6487B5006904f3Db3C4a3654409AE92b87eD442f` | blog.iotex.io |
| CrossCurve | ethereum | contract | `0xb2185950f5a0a46687ac331916508aada202e063` | cantina.xyz |
| Allbridge Core | ethereum | attacker | `0x651591b68A9c9650FB23F642162353306281ffDe` | cryptonomist.ch |

_Addresses are the exploited contract where useful for wallet-history matching, otherwise the primary attacker address. 39 of 176 incidents carry an address; the rest are pending verification._
