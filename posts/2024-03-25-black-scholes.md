# Implementing Black Scholes Merton in Excel
Implementing the Black-Scholes-Merton (BSM) method in Excel requires using a combination of Excel functions to calculate the theoretical price of European call and put options. 

## 1. Inputs
First, define the inputs required for the model:
```
S = Spot price of the underlying asset
K = Strike price of the option
T = Time to expiration (in years)
r = Risk-free interest rate (annual rate, expressed as a decimal)
σ (sigma) = Volatility of the underlying asset's returns (annual standard deviation, expressed as a decimal)
```

## 2. Intermediate Calculations
You'll need to calculate d1 and d2, which are intermediate steps in the BSM formula:

```
d1 = (ln(S / K) + (r + (σ^2) / 2) * T) / (σ * SQRT(T))
d2 = d1 - σ * SQRT(T)
```

In Excel, you can use the following formulas:
```
d1 = (LN(S / K) + (r + (σ^2) / 2) * T) / (σ * SQRT(T))
d2 = d1 - σ * SQRT(T)
Where:

LN() = natural logarithm
SQRT() = square root
```
## 3. Black-Scholes-Merton Formula for Call and Put Options


The BSM formula for the price of a European call option (C) and the price of a European put option (P) are as follows:

```
C = S * N(d1) - K * EXP(-r * T) * N(d2)
P = K * EXP(-r * T) * N(-d2) - S * N(-d1)
```
Where N() is the cumulative distribution function (CDF) of the standard normal distribution. 
In Excel, this can be calculated using the NORM.S.DIST() function.


So, in Excel:
```
Call Option (C) = S * NORM.S.DIST(d1, TRUE) - K * EXP(-r * T) * NORM.S.DIST(d2, TRUE)
Put Option (P) = K * EXP(-r * T) * NORM.S.DIST(-d2, TRUE) - S * NORM.S.DIST(-d1, TRUE)

Where:

NORM.S.DIST(z, TRUE) gives the cumulative distribution function 
EXP() calculates e raised to the power of the given number.
```

## 4. Putting It All Together
In Excel, allocate cells for each of the inputs (S, K, T, r, σ).
Use the formulas provided above in separate cells for d1, d2, and the call and put option prices.