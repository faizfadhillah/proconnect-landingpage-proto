# Android App Links Configuration

File `assetlinks.json` digunakan untuk Android App Links (Deep Linking). File ini **tidak di-commit ke git** karena setiap environment memiliki konfigurasi yang berbeda.

## Setup per Environment

### Staging Environment
File: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.proconnectjob.dev",
      "sha256_cert_fingerprints": [
        "FB:76:05:E3:0A:E9:65:EC:7D:BD:B4:54:A9:8C:83:92:9A:FA:BD:39:BA:92:95:F0:A9:54:7B:4A:95:91:66:BC"
      ]
    }
  }
]
```

**URL**: `https://stg.proconnect.fivestarstudio.id/.well-known/assetlinks.json`

### Production Environment
File: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.proconnectjob",
      "sha256_cert_fingerprints": [
        "00:A5:E0:54:A3:BC:36:42:45:F2:32:AC:91:C3:DA:42:E8:14:82:BC:02:94:A1:8F:A3:C9:5F:F4:A1:45:BE:75"
      ]
    }
  }
]
```

**URL**: `https://proconnectcareer.com/.well-known/assetlinks.json`

## Cara Setup

1. **Copy template file**:
   ```bash
   # Untuk staging
   cp public/.well-known/assetlinks.json.example public/.well-known/assetlinks.json
   
   # Untuk production
   cp public/.well-known/assetlinks.json.production.example public/.well-known/assetlinks.json
   ```

2. **Atau buat manual** dengan mengikuti format di atas

3. **Pastikan file ada** di `public/.well-known/assetlinks.json` sebelum deploy

4. **Verifikasi setelah deploy**:
   - Staging: https://stg.proconnect.fivestarstudio.id/.well-known/assetlinks.json
   - Production: https://proconnectcareer.com/.well-known/assetlinks.json

## Catatan

- File ini **di-ignore dari git** (lihat `.gitignore`)
- Setiap environment harus memiliki file sendiri
- File harus dapat diakses tanpa autentikasi
- Content-Type harus `application/json`
- File harus valid JSON
