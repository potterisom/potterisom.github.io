---
title: "discover the Euler product formula"
hand: "/hand/euler.svg"
order: 2
date: "2025-11-30"
pdf: "/docs/euler_product.pdf"
---

<div class="ab">

<span class="sc">Abstract.</span> This is a cool way of looking at a classic result. This is a write-up of a [YouTube video by Dr. Trefor Bazett](https://youtu.be/u7BadbVwnl4). The main result is (hopefully) accessible to a high school student with some effort to understand notation.

</div>

## 0. The Riemann zeta function

You have probably encountered the Riemann zeta function in your third-grade algebra class. Here is a quick refresher: for any $s \in \mathbb{C} - \{1\}$,

$$
\zeta(s) := \sum_{n=1}^{\infty} \frac{1}{n^s}.
$$

Don’t let the Greek letter $\zeta$ (“zeta”) scare you. For certain values of $s$, this function might look more familiar. The Harmonic Series, used as a classic example of a deceptively diverging series in real analysis, is actually the zeta function evaluated at 1:

$$
\zeta(1) = \sum_{n=1}^{\infty} \frac{1}{n} = 1 + \frac{1}{2} + \frac{1}{3} + \cdots.
$$

Another classic is the zeta function at $s = 2$, which came up in my Fourier analysis class because it converges to a surprising value.

$$
\zeta(2) = \sum_{n=1}^{\infty} \frac{1}{n^2} = 1 + \frac{1}{2^2} + \frac{1}{3^2} + \cdots = \frac{\pi^2}{6}.
$$

In general, the Riemann zeta function turns out to be pretty important, and it is used in the formulation of the Riemann Hypothesis, which claims all the non-trivial zeros of the function have real part equal to $\frac{1}{2}$.

## 1. The Euler product formula

Although we do not yet know the answer or the proof to the Riemann hypothesis, we have a result upon which lies all of analytic number theory. Leonhard Euler first discovered that the zeta function (a sum over positive integers) can also be expressed as a product over primes.

**Theorem 1.1 (Euler Product formula).**

$$
\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}.
$$

## 2. How to stumble onto the Euler product formula

I have to preface this by saying that this is not a strict proof, but the idea of the proof is very similar. The trick to this is taking advantage of the fact that the sum is infinite. In this case, by multiplying the sum by certain things, you can pick out half the terms in the sum, or a third, a fifth, and so on, to eventually get rid of (almost) all terms in the sum.

$$
\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} = \frac{1}{1^s} + \frac{1}{2^s} + \frac{1}{3^s} + \frac{1}{4^s} + \cdots + \frac{1}{1723^s} + \cdots.
$$

How do we get rid of half the terms? We just pick out the even terms by multiplying the sum by $\frac{1}{2^s}$:

$$
\begin{aligned}\frac{1}{2^s}\zeta(s) &= \frac{1}{2^s}\left(\frac{1}{1^s} + \frac{1}{2^s} + \frac{1}{3^s} + \frac{1}{4^s} + \cdots + \frac{1}{1723^s} + \cdots\right) \\ &= \frac{1}{2^s} + \frac{1}{4^s} + \frac{1}{6^s} + \frac{1}{8^s} + \cdots + \frac{1}{(1723 \cdot 2)^s} + \cdots\end{aligned}
$$

Observe that some of the terms in the first and third lines repeat. In fact, exactly half! So what happens if we subtract one from the other?

$$
\zeta(s) - \frac{1}{2^s}\zeta(s) = \left(1 - \frac{1}{2^s}\right)\zeta(s) = 1 + \frac{1}{3^s} + \frac{1}{5^s} + \frac{1}{7^s} + \cdots + \frac{1}{1723^s} + \cdots.
$$

We are left with all the odd terms. Why stop there? Let’s now multiply this by $\frac{1}{3^s}$:

$$
\begin{aligned}\frac{1}{3^s}\left(1 - \frac{1}{2^s}\right)\zeta(s) &= \frac{1}{3^s}\left(1 + \frac{1}{3^s} + \frac{1}{5^s} + \frac{1}{7^s} + \cdots + \frac{1}{1723^s} + \cdots\right) \\ &= \frac{1}{3^s} + \frac{1}{9^s} + \frac{1}{15^s} + \frac{1}{21^s} + \cdots + \frac{1}{(1723 \cdot 3)^s} + \cdots.\end{aligned}
$$

That looks like multiples of three in the denominators, except some of them are missing. In fact, every *other* one is missing, because we have already taken out the even terms. Now we get rid of all multiples of 3, by subtracting this result:

$$
\left(1 - \frac{1}{3^s}\right)\left(1 - \frac{1}{2^s}\right)\zeta(s) = 1 + \frac{1}{5^s} + \frac{1}{7^s} + \frac{1}{11^s} + \frac{1}{13^s} + \cdots + \frac{1}{1723^s} \cdots.
$$

For each term in the series except for 1, the denominator is a natural number, hence we know it can be written as a unique product of primes. As we have observed from the previous two steps, it’s sufficient to find at least one prime divisor to take the term “out” of the series. By the time we get to 1721 (which is also prime), surely all the numbers before and including 1721 will be taken out of the sum, since the prime divisors of a number are always less than or equal to the number itself:

$$
\prod_{p \leq 1721 \text{ prime}} \left(1 - \frac{1}{p^s}\right)\zeta(s) = 1 + \frac{1}{1723^s} + \cdots
$$

Unfortunately, we know there are infinitely many primes, thus we will never find a biggest prime to get rid of all the terms. However, lucky for us, we can “cheat” by taking an infinite product! Then we can multiply using *all* the primes out there, and truly get rid of everything. (In practice this is realized in terms of limits rather than taking $p = \infty$.)

Thus if we use a similar technique for every single prime we will have taken out *all* the terms out of the sequence, except for 1.

$$
\prod_{p \text{ prime}} \left(1 - \frac{1}{p^s}\right)\zeta(s) = 1.
$$

All that is left to do is rearrange the equation:

$$
\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s} = \prod_{p \text{ prime}} \frac{1}{1 - p^{-s}}.
$$

We win! <span class="qed">♡</span>
