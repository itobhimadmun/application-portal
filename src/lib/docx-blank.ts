/**
 * The dotted rule that stands in for an answer nobody has typed yet.
 *
 * It lives on its own because both the server-side renderer and the browser
 * need it, and the renderer pulls in JSZip — too heavy to ship to the client
 * for the sake of one string.
 */
export const BLANK = "……………";
