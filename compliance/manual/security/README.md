Records of the security tests a person performs and the pipeline deliberately does not.

Two controls in the authentication pack are not automated on purpose. Testing rate limiting means
submitting wrong passwords repeatedly, which is a small attack on the client's system and can lock a
real account. Access control between accounts cannot be tested reliably at all, and a confident wrong
answer there would be worse than none.

One .yml per test, naming who did it, what they actually tried, the commit, and the outcome. A record
that says only "tested, passed" is an assertion rather than evidence, and the schema refuses it.
