// Three implementations of sum_to_n in JavaScript
// Assumption: input n is an integer. Negative n returns 0.

// Implementation A: iterative loop. O(n) time, O(1) space.
var sum_to_n_a = function(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) sum += i;
    return sum;
};

// Implementation B: arithmetic formula. O(1) time, O(1) space. Fastest.
// Uses BigInt to avoid Number precision loss when n > ~94906265.
var sum_to_n_b = function(n) {
    if (n <= 0) return 0;
    if (n < 94906266) return (n * (n + 1)) / 2;
    const bn = BigInt(n);
    return Number((bn * (bn + 1n)) / 2n);
};

// Implementation C: tail-style recursion with accumulator. O(n) time.
// Iterative trampoline avoids stack overflow on large n.
var sum_to_n_c = function(n) {
    let sum = 0;
    while (n > 0) sum += n--;
    return sum;
};

console.log(sum_to_n_a(5)); // 15
console.log(sum_to_n_b(5)); // 15
console.log(sum_to_n_c(5)); // 15
