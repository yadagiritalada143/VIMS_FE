import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  constructor(
  ) { }

  decrypt(encryptedInput: string): string {
    const key = CryptoJS.enc.Utf8.parse(environment?.CRYPTO_KEY);
    const iv = CryptoJS.enc.Utf8.parse(environment?.CRYPTO_IV);
    //const encryptedData = CryptoJS.enc.Base64.parse(encryptedInput);
    const decryptedData = CryptoJS.AES.decrypt(encryptedInput, key, { iv: iv, mode: CryptoJS.mode.CBC});
    const decrypted = decryptedData.toString(CryptoJS.enc.Utf8);
    return decrypted;
  }
}
