"""
Pure-Python replacements for the 3 scipy.stats functions stat_test.py used
(ttest_ind equal/unequal variance, mannwhitneyu two-sided). scipy itself pulls
in ~135MB of bundled BLAS/LAPACK (see api/stat_test.py's git history) purely
for this one endpoint, which pushed the Vercel Function bundle over the
500MB limit. No other function in this project imports scipy.

p-values are computed analytically (t-distribution via the regularized
incomplete beta function; Mann-Whitney via the normal approximation with
continuity and tie correction — the same formula scipy itself falls back to
for n large enough or when ties are present), not via a lookup table.
"""
import math


def _betacf(a: float, b: float, x: float, max_iter: int = 200, eps: float = 1e-12) -> float:
    """Continued-fraction evaluation of the incomplete beta function (Numerical Recipes)."""
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < 1e-30:
        d = 1e-30
    d = 1.0 / d
    h = d
    for m in range(1, max_iter + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < 1e-30:
            d = 1e-30
        c = 1.0 + aa / c
        if abs(c) < 1e-30:
            c = 1e-30
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < 1e-30:
            d = 1e-30
        c = 1.0 + aa / c
        if abs(c) < 1e-30:
            c = 1e-30
        d = 1.0 / d
        de = d * c
        h *= de
        if abs(de - 1.0) < eps:
            break
    return h


def _betai(a: float, b: float, x: float) -> float:
    """Regularized incomplete beta function I_x(a, b)."""
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    bt = math.exp(
        math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
        + a * math.log(x) + b * math.log(1.0 - x)
    )
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * _betacf(a, b, x) / a
    return 1.0 - bt * _betacf(b, a, 1.0 - x) / b


def _t_sf_two_sided(t: float, df: float) -> float:
    """Two-sided p-value for Student's t distribution with df degrees of freedom."""
    x = df / (df + t * t)
    return _betai(df / 2.0, 0.5, x)


def _normal_cdf(z: float) -> float:
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))


def _mean_var(sample: list[float]) -> tuple[float, float]:
    n = len(sample)
    mean = sum(sample) / n
    var = sum((v - mean) ** 2 for v in sample) / (n - 1)  # sample variance (ddof=1)
    return mean, var


def ttest_ind(g1: list[float], g2: list[float], equal_var: bool = True) -> float:
    """Two-sample t-test p-value (Student's for equal_var, Welch's otherwise)."""
    n1, n2 = len(g1), len(g2)
    m1, v1 = _mean_var(g1)
    m2, v2 = _mean_var(g2)

    if equal_var:
        df = n1 + n2 - 2
        pooled_var = ((n1 - 1) * v1 + (n2 - 1) * v2) / df
        se = math.sqrt(pooled_var * (1.0 / n1 + 1.0 / n2))
    else:
        se2_1 = v1 / n1
        se2_2 = v2 / n2
        se = math.sqrt(se2_1 + se2_2)
        # Welch–Satterthwaite degrees of freedom
        df = (se2_1 + se2_2) ** 2 / (se2_1 ** 2 / (n1 - 1) + se2_2 ** 2 / (n2 - 1))

    if se == 0:
        return 1.0 if m1 == m2 else 0.0

    t = (m1 - m2) / se
    return _t_sf_two_sided(t, df)


_EXACT_MAX_N = 20  # matches scipy's practical range for the exact permutation test


def _mannwhitney_u_distribution(n1: int, n2: int) -> list[int]:
    """
    Exact null distribution of the (tie-free) Mann-Whitney U statistic:
    counts[u] = number of arrangements of n1+n2 ranked items with U = u,
    for u in 0..n1*n2. Standard recurrence (e.g. Mann & Whitney 1947):
        w(u, n1, n2) = w(u - n2, n1 - 1, n2) + w(u, n1, n2 - 1)
    memoized over (n1, n2) since only n1+1 * n2+1 size-pairs are ever visited.
    """
    memo: dict[tuple[int, int], list[int]] = {}

    def w(a: int, b: int) -> list[int]:
        key = (a, b)
        if key in memo:
            return memo[key]
        umax = a * b
        if a == 0 or b == 0:
            counts = [0] * (umax + 1)
            counts[0] = 1
            memo[key] = counts
            return counts
        left = w(a - 1, b)   # length (a-1)*b + 1
        right = w(a, b - 1)  # length a*(b-1) + 1
        counts = [0] * (umax + 1)
        shift = b  # w(u - n2, n1 - 1, n2) contributes at offset +b
        for u, c in enumerate(left):
            counts[u + shift] += c
        for u, c in enumerate(right):
            counts[u] += c
        memo[key] = counts
        return counts

    return w(n1, n2)


def _mannwhitney_exact_pvalue(u: float, n1: int, n2: int) -> float:
    counts = _mannwhitney_u_distribution(n1, n2)
    total = math.comb(n1 + n2, n1)
    u_int = int(round(u))
    cdf_u = sum(counts[: u_int + 1]) / total
    return min(1.0, 2.0 * cdf_u)


def mannwhitneyu(g1: list[float], g2: list[float]) -> float:
    """
    Two-sided Mann-Whitney U test p-value. Uses the exact permutation
    distribution when there are no ties and both groups are small enough
    (matching scipy's own default 'auto' behavior); falls back to the normal
    approximation with continuity and tie correction otherwise.
    """
    n1, n2 = len(g1), len(g2)
    n = n1 + n2
    tagged = sorted([(v, 0) for v in g1] + [(v, 1) for v in g2], key=lambda t: t[0])

    ranks = [0.0] * n
    tie_term = 0.0
    has_ties = False
    i = 0
    while i < n:
        j = i
        while j < n and tagged[j][0] == tagged[i][0]:
            j += 1
        avg_rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks[k] = avg_rank
        t = j - i
        if t > 1:
            has_ties = True
            tie_term += t ** 3 - t
        i = j

    r1 = sum(ranks[k] for k in range(n) if tagged[k][1] == 0)
    u1 = r1 - n1 * (n1 + 1) / 2.0
    u2 = n1 * n2 - u1
    u = min(u1, u2)

    if not has_ties and n1 <= _EXACT_MAX_N and n2 <= _EXACT_MAX_N:
        return _mannwhitney_exact_pvalue(u, n1, n2)

    mean_u = n1 * n2 / 2.0
    var_u = (n1 * n2 / 12.0) * ((n + 1) - tie_term / (n * (n - 1)))
    if var_u <= 0:
        return 1.0

    std_u = math.sqrt(var_u)
    # Continuity correction shrinks |u - mean_u| by 0.5 but must not overshoot
    # past zero (which would flip the sign and inflate significance) — this
    # matters whenever |u - mean_u| <= 0.5, common with small/tied samples.
    diff = u - mean_u
    if diff > 0:
        diff = max(diff - 0.5, 0.0)
    elif diff < 0:
        diff = min(diff + 0.5, 0.0)
    z = diff / std_u
    p = 2.0 * (1.0 - _normal_cdf(abs(z)))
    return min(p, 1.0)
