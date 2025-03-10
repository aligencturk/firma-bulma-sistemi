# Toplu Firma Bulma ve İletişim Sistemi - Dağıtım Kılavuzu

Bu belge, Toplu Firma Bulma ve İletişim Sistemi'nin dağıtım ve lansman sürecini açıklar.

## 1. Ön Hazırlık

### 1.1. Kod Gözden Geçirme
- [ ] Tüm kodlar gözden geçirildi mi?
- [ ] Gereksiz veya kullanılmayan kodlar temizlendi mi?
- [ ] Yorum satırları ve dokümantasyon yeterli mi?
- [ ] Hassas bilgiler (API anahtarları, şifreler vb.) çevresel değişkenlere taşındı mı?

### 1.2. Varlık Optimizasyonu
- [ ] JavaScript dosyaları minimize edildi mi?
- [ ] CSS dosyaları minimize edildi mi?
- [ ] Görseller optimize edildi mi?
- [ ] Gereksiz dosyalar kaldırıldı mı?

### 1.3. Yapılandırma Dosyaları
- [ ] `.env` dosyası oluşturuldu mu?
- [ ] `.gitignore` dosyası güncellendi mi?
- [ ] `README.md` dosyası güncellendi mi?
- [ ] Lisans dosyası eklendi mi?

## 2. Hosting Hizmeti Seçimi

### 2.1. Statik Site Hosting Seçenekleri
- [ ] **Netlify**: Ücretsiz SSL, sürekli dağıtım, form işleme
- [ ] **Vercel**: Ücretsiz SSL, sürekli dağıtım, serverless fonksiyonlar
- [ ] **GitHub Pages**: Ücretsiz hosting, GitHub entegrasyonu
- [ ] **Firebase Hosting**: Ücretsiz SSL, CDN, Firebase entegrasyonu
- [ ] **AWS S3 + CloudFront**: Ölçeklenebilir, CDN, düşük maliyet

### 2.2. Hosting Hizmeti Kurulumu
- [ ] Hosting hesabı oluşturuldu mu?
- [ ] Dağıtım yapılandırması ayarlandı mı?
- [ ] Çevresel değişkenler yapılandırıldı mı?
- [ ] SSL sertifikası etkinleştirildi mi?

## 3. Domain Ayarları

### 3.1. Domain Satın Alma
- [ ] Domain adı belirlendi mi?
- [ ] Domain satın alındı mı?
- [ ] Domain yenileme tarihi not edildi mi?

### 3.2. DNS Ayarları
- [ ] DNS kayıtları yapılandırıldı mı?
- [ ] A kaydı veya CNAME kaydı eklendi mi?
- [ ] MX kayıtları (e-posta için) yapılandırıldı mı?
- [ ] TXT kayıtları (doğrulama için) eklendi mi?

### 3.3. SSL Sertifikası
- [ ] SSL sertifikası alındı mı?
- [ ] SSL sertifikası yapılandırıldı mı?
- [ ] HTTPS yönlendirmesi etkinleştirildi mi?

## 4. Supabase Yapılandırması

### 4.1. Üretim Ortamı Ayarları
- [ ] Üretim ortamı için yeni bir Supabase projesi oluşturuldu mu?
- [ ] Veritabanı tabloları ve indeksler oluşturuldu mu?
- [ ] RLS politikaları yapılandırıldı mı?
- [ ] Kimlik doğrulama ayarları yapılandırıldı mı?

### 4.2. Güvenlik Ayarları
- [ ] API anahtarları güvenli bir şekilde saklanıyor mu?
- [ ] CORS politikaları yapılandırıldı mı?
- [ ] Rate limiting etkinleştirildi mi?
- [ ] Yedekleme planı oluşturuldu mu?

## 5. API Entegrasyonları

### 5.1. Google Places API
- [ ] Üretim ortamı için Google Places API anahtarı alındı mı?
- [ ] API kısıtlamaları yapılandırıldı mı?
- [ ] Faturalandırma hesabı kuruldu mu?
- [ ] Kullanım limitleri ve uyarılar ayarlandı mı?

### 5.2. SendGrid API
- [ ] Üretim ortamı için SendGrid API anahtarı alındı mı?
- [ ] E-posta şablonları oluşturuldu mu?
- [ ] Gönderici kimliği doğrulandı mı?
- [ ] Spam filtreleri test edildi mi?

## 6. Dağıtım Süreci

### 6.1. Dağıtım Öncesi Kontrol Listesi
- [ ] Tüm testler başarıyla tamamlandı mı?
- [ ] Tüm API anahtarları ve çevresel değişkenler yapılandırıldı mı?
- [ ] Veritabanı bağlantısı test edildi mi?
- [ ] Tüm bağımlılıklar güncel mi?

### 6.2. Dağıtım Adımları
1. Üretim yapısını oluşturun:
   ```bash
   # Eğer bir yapı aracı kullanıyorsanız (örn. Webpack, Parcel)
   npm run build
   ```

2. Dosyaları hosting hizmetine yükleyin:
   ```bash
   # Netlify CLI kullanarak
   netlify deploy --prod
   
   # Vercel CLI kullanarak
   vercel --prod
   
   # Firebase CLI kullanarak
   firebase deploy
   ```

3. DNS ayarlarını yapılandırın ve doğrulayın.

4. SSL sertifikasını etkinleştirin ve HTTPS yönlendirmesini yapılandırın.

### 6.3. Dağıtım Sonrası Kontroller
- [ ] Web sitesi tüm tarayıcılarda doğru şekilde yükleniyor mu?
- [ ] Tüm API istekleri başarıyla tamamlanıyor mu?
- [ ] Kimlik doğrulama işlevleri çalışıyor mu?
- [ ] Sayfa yükleme performansı kabul edilebilir mi?
- [ ] SSL sertifikası doğru şekilde yapılandırılmış mı?

## 7. Lansman Süreci

### 7.1. Lansman Öncesi Kontrol Listesi
- [ ] Tüm içerikler ve metinler gözden geçirildi mi?
- [ ] Yasal metinler (Gizlilik Politikası, Kullanım Koşulları) eklendi mi?
- [ ] Analitik araçları entegre edildi mi?
- [ ] Hata izleme araçları entegre edildi mi?
- [ ] Kullanıcı geri bildirimi mekanizması eklendi mi?

### 7.2. Lansman Stratejisi
- [ ] Lansman tarihi belirlendi mi?
- [ ] Beta test kullanıcıları belirlendi mi?
- [ ] Lansman duyurusu hazırlandı mı?
- [ ] Sosyal medya paylaşımları planlandı mı?
- [ ] Kullanıcı kılavuzu hazırlandı mı?

### 7.3. Lansman Sonrası İzleme
- [ ] Kullanıcı davranışları izleniyor mu?
- [ ] Performans metrikleri izleniyor mu?
- [ ] Hata raporları izleniyor mu?
- [ ] Kullanıcı geri bildirimleri toplanıyor mu?
- [ ] Düzenli bakım planı oluşturuldu mu?

## 8. Bakım ve Güncelleme

### 8.1. Düzenli Bakım Görevleri
- [ ] Güvenlik güncellemeleri
- [ ] Bağımlılık güncellemeleri
- [ ] Veritabanı bakımı
- [ ] Performans optimizasyonu
- [ ] Yedekleme ve kurtarma testleri

### 8.2. Güncelleme Süreci
1. Geliştirme ortamında değişiklikleri yapın
2. Testleri çalıştırın
3. Staging ortamında değişiklikleri test edin
4. Üretim ortamına dağıtın
5. Dağıtım sonrası kontrolleri yapın

### 8.3. Ölçeklendirme Planı
- [ ] Kullanıcı sayısı artışına göre ölçeklendirme planı
- [ ] Veritabanı ölçeklendirme planı
- [ ] API kullanım limitleri ve ölçeklendirme planı
- [ ] CDN entegrasyonu planı

## 9. Felaket Kurtarma Planı

### 9.1. Yedekleme Stratejisi
- [ ] Veritabanı yedekleme planı
- [ ] Kod yedekleme planı
- [ ] Yapılandırma dosyaları yedekleme planı
- [ ] Yedekleme testleri planı

### 9.2. Kurtarma Prosedürleri
- [ ] Veritabanı kurtarma prosedürü
- [ ] Uygulama kurtarma prosedürü
- [ ] DNS kurtarma prosedürü
- [ ] SSL sertifikası kurtarma prosedürü

### 9.3. İş Sürekliliği Planı
- [ ] Kesinti durumunda iletişim planı
- [ ] Alternatif hosting planı
- [ ] Veri kaybı durumunda eylem planı
- [ ] Güvenlik ihlali durumunda eylem planı

## 10. Dokümantasyon

### 10.1. Teknik Dokümantasyon
- [ ] Kod dokümantasyonu
- [ ] API dokümantasyonu
- [ ] Veritabanı şema dokümantasyonu
- [ ] Dağıtım ve yapılandırma dokümantasyonu

### 10.2. Kullanıcı Dokümantasyonu
- [ ] Kullanım kılavuzu
- [ ] Sık sorulan sorular
- [ ] Video eğitimleri
- [ ] Sorun giderme kılavuzu

### 10.3. Yönetici Dokümantasyonu
- [ ] Yönetim paneli kılavuzu
- [ ] Bakım ve güncelleme kılavuzu
- [ ] Güvenlik kılavuzu
- [ ] Ölçeklendirme kılavuzu 