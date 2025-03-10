# Toplu Firma Bulma ve İletişim Sistemi

Bu proje, kullanıcıların Google Places API üzerinden firma bilgilerini arayabildiği, filtreleyebildiği, toplu WhatsApp mesajı ve e-posta gönderebildiği modern bir web uygulamasıdır.

## Özellikler

- **Firma Arama**: 
  - Google Places API kullanarak detaylı firma arama
  - Şehir ve firma türüne göre arama
  - Her sayfada 20 sonuç gösterme (maksimum 100 sonuç)

- **Gelişmiş Filtreleme**: 
  - Yıldız değerlendirmesine göre filtreleme
  - Konum bazlı filtreleme
  - Anlık filtreleme sonuçları

- **Toplu İletişim**: 
  - WhatsApp mesajı gönderme
    - Hazır mesaj şablonları
    - Firma adı ve tarih değişkenleri
    - Tek tek veya toplu gönderim
  - E-posta gönderme
    - Zengin metin editörü
    - Kişiselleştirilebilir şablonlar
    - Toplu gönderim

- **Kullanıcı Yönetimi**:
  - Kayıt ve giriş sistemi
  - Firebase Authentication
  - Kullanıcı profili yönetimi

- **Veri Saklama**:
  - Firebase Realtime Database
  - Arama geçmişi
  - Kaydedilen firmalar
  - Kullanıcı tercihleri

## Teknolojiler

- **Frontend**:
  - HTML5
  - CSS3 (Bootstrap 5.3.2)
  - JavaScript (ES6+)
  - Bootstrap Icons
  - Quill.js (Zengin metin editörü)

- **Backend & Veritabanı**:
  - Firebase Authentication
  - Firebase Realtime Database
  - Google Places API

- **API'ler**:
  - Google Places API
  - WhatsApp Business API (wa.me)

## Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/kullaniciadi/firma-bulma-sistemi.git
   cd firma-bulma-sistemi
   ```

2. Firebase projesini oluşturun:
   - [Firebase Console](https://console.firebase.google.com)'da yeni proje oluşturun
   - Authentication ve Realtime Database'i etkinleştirin
   - Firebase yapılandırma bilgilerini `app.js` içine ekleyin

3. Google Places API anahtarını alın:
   - [Google Cloud Console](https://console.cloud.google.com)'da proje oluşturun
   - Places API'yi etkinleştirin
   - API anahtarını alın ve `app.js` içinde ilgili yere ekleyin

4. Uygulamayı başlatın:
   - Bir web sunucusu kullanarak `index.html` dosyasını çalıştırın
   - Veya Visual Studio Code'da Live Server eklentisini kullanın

## Kullanım

### Firma Arama
1. Ana sayfada veya arama sayfasında firma türünü girin
2. Şehir seçin
3. "Ara" butonuna tıklayın
4. Sonuçlar listelenecektir (sayfa başına 20 sonuç)

### WhatsApp Mesajı Gönderme
1. Arama sonuçlarından firmaları seçin
2. "WhatsApp" butonuna tıklayın
3. Mesaj şablonu seçin veya özel mesaj yazın
4. Değişkenleri kullanarak mesajı kişiselleştirin ({firma_adi}, {tarih})
5. "Gönder" butonuna tıklayın

### E-posta Gönderme
1. Firmaları seçin
2. "E-posta" butonuna tıklayın
3. Konu ve içeriği yazın
4. Zengin metin editörünü kullanarak mesajınızı biçimlendirin
5. "Gönder" butonuna tıklayın

### Firma Kaydetme
1. Arama sonuçlarından firmaları seçin
2. "Kaydet" butonuna tıklayın
3. Kaydedilen firmalar "Kaydedilenler" sayfasında görüntülenebilir

## Güvenlik

- Google Places API anahtarı güvenliği
- Firebase Authentication kullanımı
- WhatsApp mesaj gönderme limitleri
- Kullanıcı verilerinin güvenli saklanması

## Sürüm Geçmişi

- **v1.0.0** (2024-01-20)
  - İlk sürüm
  - Temel arama fonksiyonları
  - WhatsApp ve e-posta entegrasyonu

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız veya önerileriniz için [GitHub Issues](https://github.com/kullaniciadi/firma-bulma-sistemi/issues) üzerinden iletişime geçebilirsiniz. 