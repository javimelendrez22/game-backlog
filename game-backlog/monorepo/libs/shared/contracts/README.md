# contracts

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test contracts` to execute the unit tests via [Vitest](https://vitest.dev/).

# DELETE /games/:id

successful delete returns 204 with no content. we just need to know the delete succeeded so that
we can invalidate the query in the front end.


if the game is not found we return 204 with no content also. if the game is not found the game may have been deleted by another user in a different request. the overall objective was done thou.

if a non uuid id is passed it fails with the zod validation pipe and returns bad request exception
