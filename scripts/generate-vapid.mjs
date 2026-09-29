import { generateKeyPairSync } from 'node:crypto'

const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'})
const pub=publicKey.export({format:'jwk'})
const priv=privateKey.export({format:'jwk'})
const publicBytes=Buffer.concat([Buffer.from([4]),Buffer.from(pub.x,'base64url'),Buffer.from(pub.y,'base64url')])
console.log('VAPID_PUBLIC_KEY='+publicBytes.toString('base64url'))
console.log('VAPID_PRIVATE_KEY='+priv.d)
console.log('VAPID_SUBJECT=mailto:martinezdiegoe@gmail.com')
console.log('Guardá la clave privada solo en Supabase Secrets. No la subas al repositorio.')
