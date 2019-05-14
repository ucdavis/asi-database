var accessToken = null;

/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}


/*
Import a PEM encoded RSA private key, to use for RSA-PSS signing.
Takes a string containing the PEM encoded key, and returns a Promise
that will resolve to a CryptoKey representing the private key.
*/
function importPrivateKey(pem) {
  // fetch the part of the PEM string between header and footer
  const pemHeader = "-----BEGIN ENCRYPTED PRIVATE KEY-----";
  const pemFooter = "-----END ENCRYPTED PRIVATE KEY-----";
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
  // base64 decode the string to get the binary data
  const binaryDerString = window.atob(pemContents);
  // convert from a binary string to an ArrayBuffer
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-PSS",
      // Consider using a 4096-bit key for systems that require long-term security
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign"]
  );
}

function getAccessToken(secrets) {
  const authenticationUrl = 'https://api.box.com/oauth2/token';

  
  let key = {
    key: secrets.boxAppSettings.appAuth.privateKey,
    passphrase: secrets.boxAppSettings.appAuth.passphrase
  }

  let array = new Int32Array(8);
  let jti = crypto.getRandomValues(array).join("");

  let claims = {
    'iss': secrets.boxAppSettings.clientID,
    'sub': secrets.enterpriseID,
    'box_sub_type': 'enterprise',
    'aud': authenticationUrl,
    // This is an identifier that helps protect against
    // replay attacks
    'jti': jti,
    // We give the assertion a lifetime of 45 seconds 
    // before it expires
    'exp': Math.floor(Date.now() / 1000) + 45
  };

  let keyId = secrets.boxAppSettings.appAuth.publicKeyID;

  let signedClaims = KJUR.jws.JWS.sign(null, {alg: "RS512", keyid: keyId}, claims, key.key, key.passphrase);
  return $.post(authenticationUrl, {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    // Our JWT assertion
    assertion: signedClaims,
    // The OAuth 2 client ID and secret
    client_id: secrets.boxAppSettings.clientID,
    client_secret: secrets.boxAppSettings.clientSecret
  })
}