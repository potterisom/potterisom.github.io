---
title: "assigning sizes to subsets of ℤ"
hand: "/hand/z.svg"
order: 1
date: "2026-11-23"
pdf: "/docs/assigning_sizes_subsets_of_z.pdf"
---

<div class="ab">

<span class="sc">Abstract.</span> This is a write-up of my friend [**Nathan Vosburg**](https://navo.dev/)’s math colloquium talk given on September 30, 2026. I thought it was very neat and wrote this to make sure I remember it. I assume familiarity with real analysis (in particular, limits of sequences). All ideas are Nathan’s, all mistakes are mine.

</div>

## 0. Motivation

Suppose I give you a subset of $\mathbb{Z}$. How would you go about determining its size? If it’s a finite set, say of size $n$, then we could just assign a size of $n$ to that set. But what if I give you an infinite set, like all the even integers?

Intuitively, evens make up $1/2$ of all integers, so perhaps their size should reflect that. How do we formalize this logic?

## 1. Intuition

For a given set $A \subseteq \mathbb{Z}$, let’s look at the sequence of its symmetric densities:

$$
m_n = \frac{|A \cap [-n, n]|}{2n+1}.
$$

As $n$ tends to infinity, we should get the density $m$ of $A$ in $\mathbb{Z}$, which should give us its relative size:

$$
m = \lim_{n\to\infty} m_n
$$

For some sets this works well: the evens would have size $1/2$, and sets like $d\mathbb{Z}$ have size $1/d$. The primes have size $0$, and any finite set would also have size $0$ (why?).

However, consider the following subset of $\mathbb{Z}$:

$$
\{z \in \mathbb{Z} : z \text{ has an odd number of digits}\}.
$$

Turns out the sequence of densities of this set does not converge, it oscillates between $1/11$ and $10/11$. This is because there are bigger and bigger inclusions and exlusions (this set includes 1-9, excludes 10-99, includes 100-999, etc.).

How do we amend this if we want to have a function that can assign sizes to *any* subset of $\mathbb{Z}$?

In the traditional sense of the limit, we only consider a sequence (of densities in this context) convergent if it gets very close to a value and *stays* there. But our example with oscillating densities seems to not stay anywhere forever. So what if instead of staying in a neighborhood, we only required the sequence to be in that neighborhood *very often*?

To do this, we can redefine our notion of a limit.

## 2. What’s the problem with limits?

Recall from real analysis that a real sequence $a_n$ converges to $a$ if and only if given $\epsilon > 0$, we can find $N \in \mathbb{N}$ such that for all $n > N$ we have $|a_n - a| < \epsilon$.

In other words, there are finitely many indices at which $a_n$ is more than $\epsilon$ far from $a$, i.e., the set $\{n \in \mathbb{N} : |a_n - a| \geq \epsilon\}$ is finite. This is the same as saying that its complement, the set $\{n \in \mathbb{N} : |a_n - a| < \epsilon\}$, is *cofinite* (i.e., has a finite complement).

Thus an equivalent definition of a limit of a sequence is that given $\epsilon > 0$, we say $a_n$ converges to $a$ if the set $\{n \in \mathbb{N} : |a_n - a| < \epsilon\}$ is *cofinite*.

But cofiniteness is a strong restriction. What if instead of being cofinite, this set was just **“big”**? Like if $a_n$ was arbitrarily close to $a$ on many, many indices $n$ (but perhaps not cofinitely many). This would probably help, since it would be enough for our sequence of densities hit some value “often”.

## 3. What should the “big” sets be?

We want to redefine what a big set of indices is. Let $U$ be the collection of all such big sets. What should be true about $U$? We want it to have the following properties:

1. $\emptyset \notin U$ (since $\emptyset$ should not be a big set).
2. If $A \in U$ (i.e., $A$ is a big set) and $A \subseteq B$, then $B$ must also be a big set, therefore $B \in U$.
3. To be able to add limits and stuff, for any $A \in U$, $B \in U$ we want $A \cap B \in U$.
4. For any $A \subseteq \mathbb{N}$ we have $A \in U$ or $A^C \in U$.

We call such $U$ an **ultrafilter**[^1]. Notice that 1st, 3rd and 4th condition together imply that only $A$ or $A^C$, but not both, can live in $U$.

We still want the traditionally convergent sequences to converge under our new limit definition. To force this, we will only consider **nonprincipal ultrafilters**, which are the ultrafilters that contain all cofinite subsets of $\mathbb{N}$ (we will refer to them as simply ultrafilters).

## 4. Redefining the limit

Now that we have ultrafilters, let’s redefine our limits. All we need to do is re-formulate the limit definition.

Given a sequence $a_n \subseteq \mathbb{R}$ and an ultrafilter $U$, we say $a_n$ ultra-converges to $a$ if for any $\epsilon > 0$, the set $\{n \in \mathbb{N} : |a_n - a| < \epsilon\} \in U$. We call $a$ an **ultralimit** of $a_n$ under $U$.

**Theorem 4.1.** *Given an ultrafilter $U$ and a real bounded sequence $c_n$, there exists a unique ultralimit.*

Sketch of the proof: take a compact set that contains the sequence, and keep zooming in on the parts that contain a “big” (in the ultrafilter sense) chunk of the sequence. Since you keep zooming in indefinitely, in the limit this zoom will contain one number - precisely the limit of the sequence.

*Proof.* We attack existence first. We construct a sequence of intervals $I_k$, with $I_0 = [a, b]$ (where $(c_n) \subseteq [a, b]$ for some $a, b$). The sequence of intervals will help us zoom in on the section of the interval where the sequence is “bunching up”.

Let $I_k = [a_k, b_k]$. Let $m_k = \frac{a_k + b_k}{2}$ be the midpoint of the interval $I_k$. Then set the left and right-half intervals:

$$
L_k = [a_k, m_k] \qquad\qquad R_k = [m_k, b_k],
$$

so that $I_k = L_k \cup R_k$.

Set $I_{k+1} = L_k$ if $\{n : c_n \in L_k\} \in U$, otherwise $I_{k+1} = R_k$.

Since $(c_n) \subseteq [a, b] = I_0$, then $\{n : c_n \in I_0\} \in U$. Now, suppose that $\{n : c_n \in I_k\} \in U$. Then either $\{n : c_n \in L_k\} \in U$ or $\{n : c_n \in R_k\} \in U$ (can be both, not neither). Since $I_{k+1} = L_k$ or $R_k$, $\{n : c_n \in I_{k+1}\} \in U$. Therefore, $\{n : c_n \in I_k\} \in U$ for all $k$.

Since $a_0 \leq a_1 \leq \cdots \leq b_1 \leq b_0$, and $|a_k - b_k| = \frac{|a_0 - b_0|}{2^k} \to 0$ as $k \to \infty$, the sequences $(a_k)$ and $(b_k)$ must both be converging (by convergence of monotonic bounded sequences) to the same number $L = \lim a_k = \lim b_k$, and $L \in \bigcap_{k=0}^{\infty} I_k$.

Let $\epsilon > 0$. Then $\exists k$ such that $|b_k - a_k| < \epsilon/2$, and since $a_k \leq L \leq b_k$, we have

$$
|L - a_k| < \epsilon/2.
$$

On the other hand, let $m \in \{n : c_n \in I_k\} \in U$. Then $a_k \leq c_m \leq b_k$ and so

$$
|a_k - c_m| < \epsilon/2.
$$

Thus

$$
|L - c_m| \leq |L - a_k| + |a_k - c_m| < \epsilon.
$$

Therefore, $\{n : |L - c_n| < \epsilon\} \in U$, and that completes proof of existence.

Suppose $c_n \to L$ and $c_n \to L'$. Then $\left\{n : |L - c_n| < \frac{|L - L'|}{3}\right\} \in U$ and $\left\{n : |L' - c_n| < \frac{|L - L'|}{3}\right\} \in U$. By property 3, their intersection must also live in $U$, but their intersection is the empty set, which cannot be in $U$ by property 1. This is a contradiction, hence the limit is unique and that concludes our proof. <span class="qed">♡</span>

## 5. Wins

Wait, this is awesome! Now we have an instrument to find a limit of *any* bounded real sequence. So, alternating sequences like $0, 1, 0, 1, 0, 1, \cdots$ will always converge, since either the odd or even indices have to be in the ultrafilter. Also, going back to our example of with the subset of all integers that have an odd number of digits, that sequence will also converge to some value, which means we can assign a size to it.

One caveat here is that you can always choose an ultrafilter that you like, so in the example above you can make your sequence converge to either 0 or 1 under the same ultrafilter if you shift it by 1 index and make it $1, 0, 1, 0, 1, 0, \cdots$. This is a little silly, but it is a useful tool.

[^1]: The first 3 conditions define a filter.
